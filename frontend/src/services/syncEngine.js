import { getPendingMutations, updateMutationStatus, removeMutation, resetMutationToPending, getConflictedMutations } from './mutationStore';
import { registerIdMapping, resolveId, replaceTempIdsInString, replaceTempIdsInObject } from './tempIdMap';
import { cacheData, getCachedData, getScopedCacheKey } from './cacheService';
import { getProjectsArrayFromCache, createUpdatedProjectsCachePayload } from './offlineMutationHelper';

let isSyncing = false;
const listeners = new Set();

/**
 * Subscribes a listener to sync engine events (start, complete, error).
 * @param {Function} callback 
 * @returns {Function} Unsubscribe function
 */
export const subscribeSyncStatus = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const notifyListeners = (event, data = {}) => {
  listeners.forEach(fn => {
    try { fn(event, data); } catch (e) { console.error('Error in sync listener:', e); }
  });
};

/**
 * Returns true if sync engine is currently processing mutations.
 */
export const isSyncEngineRunning = () => isSyncing;

/**
 * Auxiliary helper to get authorization headers for sync requests.
 */
const getSyncAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Reconciles local PouchDB read cache after a successful mutation.
 * @param {Object} mutation 
 * @param {Object} responseData 
 */
const reconcileLocalReadCache = async (mutation, responseData) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const { type, tempId, projectId, taskId } = mutation;

  try {
    if (type === 'CREATE_PROJECT') {
      const realProject = responseData.data?.project || responseData.project;
      if (realProject) {
        // Update projects list cache
        const projectsUrl = `${apiUrl}/projects`;
        const cached = await getCachedData(projectsUrl);
        const currentProjects = getProjectsArrayFromCache(cached);
        const updatedProjects = currentProjects.filter(p => p._id !== tempId && p.id !== tempId);
        updatedProjects.unshift(realProject);
        await cacheData(getScopedCacheKey(projectsUrl), createUpdatedProjectsCachePayload(cached, updatedProjects));

        // Migrate tasks cache from tempId to realProject._id
        if (tempId && realProject._id) {
          const realId = realProject._id;
          const tempTasksUrl = `${apiUrl}/projects/${tempId}/tasks`;
          const realTasksUrl = `${apiUrl}/projects/${realId}/tasks`;
          const tempCached = await getCachedData(tempTasksUrl);

          if (tempCached) {
            const rawTasks = (tempCached.data && Array.isArray(tempCached.data.tasks))
              ? tempCached.data.tasks
              : (tempCached.data && Array.isArray(tempCached.data))
                ? tempCached.data
                : (Array.isArray(tempCached.tasks) ? tempCached.tasks : (Array.isArray(tempCached) ? tempCached : []));

            const migratedTasks = rawTasks.map(t => ({
              ...t,
              projectId: realId,
              _id: resolveId(t._id || t.id) || t._id || t.id,
              id: resolveId(t.id || t._id) || t.id || t._id
            }));

            await cacheData(getScopedCacheKey(realTasksUrl), { status: 'success', data: { tasks: migratedTasks } });
          }
        }
      }
    } else if (type === 'UPDATE_PROJECT') {
      const updatedProject = responseData.data?.project || responseData.project;
      if (updatedProject) {
        const targetId = String(updatedProject.id || updatedProject._id || projectId);
        const projectsUrl = `${apiUrl}/projects`;
        const cached = await getCachedData(projectsUrl);
        const currentProjects = getProjectsArrayFromCache(cached);
        const updatedProjects = currentProjects.map(p => {
          const pId = String(p.id || p._id || '');
          const pId2 = String(p._id || p.id || '');
          const isMatch = (
            pId === targetId ||
            pId2 === targetId ||
            (projectId && (pId === String(projectId) || pId2 === String(projectId)))
          );
          if (isMatch) {
            const serverTags = Array.isArray(updatedProject.tags)
              ? updatedProject.tags
              : (mutation.payload?.tags || p.tags || []);
            return {
              ...p,
              ...updatedProject,
              tags: serverTags,
              id: p.id || updatedProject.id || targetId,
              _id: p._id || updatedProject.id || targetId,
              _isPending: false
            };
          }
          return p;
        });
        await cacheData(getScopedCacheKey(projectsUrl), createUpdatedProjectsCachePayload(cached, updatedProjects));

        // Also reconcile single project cache if present
        const singleUrl = `${apiUrl}/projects/${targetId}`;
        const singleCached = await getCachedData(singleUrl);
        if (singleCached) {
          const existing = singleCached.data?.project || singleCached.project || singleCached;
          const serverTags = Array.isArray(updatedProject.tags)
            ? updatedProject.tags
            : (mutation.payload?.tags || existing.tags || []);
          const merged = {
            ...existing,
            ...updatedProject,
            tags: serverTags,
            id: existing.id || updatedProject.id || targetId,
            _id: existing._id || updatedProject.id || targetId,
            _isPending: false
          };
          const newPayload = (singleCached.data && singleCached.data.project)
            ? { ...singleCached, data: { ...singleCached.data, project: merged } }
            : (singleCached.project)
              ? { ...singleCached, project: merged }
              : merged;
          await cacheData(getScopedCacheKey(singleUrl), newPayload);
        }
      }
    } else if (type === 'DELETE_PROJECT') {
      const projectsUrl = `${apiUrl}/projects`;
      const cached = await getCachedData(projectsUrl);
      const currentProjects = getProjectsArrayFromCache(cached);
      const updatedProjects = currentProjects.filter(p => p._id !== projectId && p.id !== projectId);
      await cacheData(getScopedCacheKey(projectsUrl), createUpdatedProjectsCachePayload(cached, updatedProjects));
    } else if (type === 'CREATE_TASK' || type === 'UPDATE_TASK' || type === 'UPDATE_TASK_STATUS' || type === 'DELETE_TASK' || type === 'APPROVE_TASK' || type === 'REJECT_TASK') {
      const realTask = responseData.data?.task || responseData.task;
      const targetProjectId = projectId || (realTask && realTask.projectId);

      if (targetProjectId) {
        const tasksUrl = `${apiUrl}/projects/${targetProjectId}/tasks`;
        const cached = await getCachedData(tasksUrl);
        if (cached && cached.data && Array.isArray(cached.data.tasks)) {
          let updatedTasks = [...cached.data.tasks];
          if (type === 'CREATE_TASK' && realTask) {
            updatedTasks = updatedTasks.filter(t => t._id !== tempId && t.id !== tempId);
            updatedTasks.push(realTask);
          } else if ((type === 'UPDATE_TASK' || type === 'UPDATE_TASK_STATUS' || type === 'APPROVE_TASK' || type === 'REJECT_TASK') && realTask) {
            const realTaskId = String(realTask.id || realTask._id);
            updatedTasks = updatedTasks.map(t => {
              const tId = String(t.id || t._id);
              if (tId === realTaskId || (taskId && tId === String(taskId)) || (tempId && tId === String(tempId))) {
                return {
                  ...t,
                  ...realTask,
                  id: realTask.id || realTask._id || t.id,
                  _id: realTask._id || realTask.id || t._id,
                  _isPending: false
                };
              }
              return t;
            });
          } else if (type === 'DELETE_TASK') {
            updatedTasks = updatedTasks.filter(t => t._id !== taskId && t.id !== taskId && t._id !== tempId);
          }
          await cacheData(getScopedCacheKey(tasksUrl), { ...cached, data: { ...cached.data, tasks: updatedTasks } });
        }
      }

      // Also reconcile embedded tasks in projects list cache if present
      if (realTask) {
        const projectsUrl = `${apiUrl}/projects`;
        const cachedProjects = await getCachedData(projectsUrl);
        if (cachedProjects) {
          const currentProjects = getProjectsArrayFromCache(cachedProjects);
          const realTaskId = String(realTask.id || realTask._id);
          let modified = false;
          const updatedProjects = currentProjects.map(p => {
            if (String(p.id || p._id) === String(targetProjectId) && Array.isArray(p.tasks)) {
              modified = true;
              const updatedProjTasks = p.tasks.map(t => {
                const tId = String(t.id || t._id);
                if (tId === realTaskId || (taskId && tId === String(taskId))) {
                  return { ...t, ...realTask, id: realTask.id || realTask._id || t.id, _id: realTask._id || realTask.id || t._id, _isPending: false };
                }
                return t;
              });
              return { ...p, tasks: updatedProjTasks };
            }
            return p;
          });
          if (modified) {
            await cacheData(getScopedCacheKey(projectsUrl), createUpdatedProjectsCachePayload(cachedProjects, updatedProjects));
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to reconcile local read cache during sync:', err);
  }
};

/**
 * Main process loop for draining the pending mutation outbox.
 */
export const processMutationQueue = async () => {
  if (isSyncing) return;
  if (!navigator.onLine) return;

  isSyncing = true;
  notifyListeners('sync_start');

  try {
    const pendingMutations = await getPendingMutations();
    if (pendingMutations.length === 0) {
      isSyncing = false;
      notifyListeners('sync_complete', { processedCount: 0 });
      return;
    }

    let processedCount = 0;

    for (const mutation of pendingMutations) {
      // Check network status before each mutation
      if (!navigator.onLine) {
        console.warn('Network offline during sync loop; pausing sync.');
        break;
      }

      // Resolve any temporary IDs in endpoint and payload
      const resolvedEndpoint = replaceTempIdsInString(mutation.endpoint);
      const resolvedPayload = replaceTempIdsInObject(mutation.payload);

      await updateMutationStatus(mutation.mutationId, 'PROCESSING');

      try {
        const fetchOptions = {
          method: mutation.method || 'POST',
          headers: getSyncAuthHeaders(),
        };

        if (mutation.method !== 'GET' && mutation.method !== 'HEAD' && resolvedPayload) {
          fetchOptions.body = JSON.stringify(resolvedPayload);
        }

        const response = await fetch(resolvedEndpoint, fetchOptions);

        if (response.ok) {
          let resData = {};
          try { resData = await response.json(); } catch { }

          // Register temporary ID mapping if a real ID is returned
          if (mutation.tempId) {
            const realId = resData.data?.project?.id || resData.data?.project?._id || resData.data?.task?.id || resData.data?.task?._id || resData.project?.id || resData.project?._id || resData.task?.id || resData.task?._id;
            if (realId) {
              registerIdMapping(mutation.tempId, realId);
            }
          }

          // Reconcile PouchDB local read cache
          await reconcileLocalReadCache(mutation, resData);

          // Mark synced & remove from queue
          await removeMutation(mutation.mutationId);
          processedCount++;
          notifyListeners('mutation_synced', { mutationId: mutation.mutationId, type: mutation.type });
        } else if (response.status === 401 || response.status === 403) {
          console.warn(`Sync authentication error (${response.status}) for mutation ${mutation.mutationId}`);
          const authErrorMsg = `HTTP ${response.status} Auth Error`;
          await updateMutationStatus(mutation.mutationId, 'PENDING', { lastError: authErrorMsg });
          notifyListeners('sync_auth_error', { status: response.status, mutationId: mutation.mutationId, error: authErrorMsg });
          break; // Stop sync loop on auth failure
        } else if (response.status === 409) {
          console.warn(`Conflict error (409) for mutation ${mutation.mutationId}`);
          await updateMutationStatus(mutation.mutationId, 'CONFLICT', { lastError: '409 Version Conflict' });
          notifyListeners('mutation_conflict', { mutationId: mutation.mutationId, mutation, error: '409 Version Conflict' });
        } else {
          // HTTP 4xx / 5xx
          const errorText = `HTTP ${response.status}`;
          const newRetryCount = (mutation.retryCount || 0) + 1;
          await updateMutationStatus(mutation.mutationId, 'FAILED', {
            retryCount: newRetryCount,
            lastError: errorText
          });
        }
      } catch (err) {
        console.warn(`Network error executing mutation ${mutation.mutationId}:`, err);
        // Reset to PENDING for network errors so it retries when connectivity is restored
        await updateMutationStatus(mutation.mutationId, 'PENDING', { lastError: err.message || 'Network fetch failed' });
        break; // Stop sync loop until network is back
      }
    }

    notifyListeners('sync_complete', { processedCount });
  } catch (globalErr) {
    console.error('Unhandled error in processMutationQueue:', globalErr);
    notifyListeners('sync_error', { error: globalErr });
  } finally {
    isSyncing = false;
  }
};

/**
 * Retries a conflicted mutation by returning it to PENDING and triggering the sync engine.
 * @param {string} mutationId 
 * @returns {Promise<boolean>}
 */
export const retryConflictedMutation = async (mutationId) => {
  if (!navigator.onLine) {
    throw new Error('Cannot retry while offline. Please connect to the internet.');
  }

  await resetMutationToPending(mutationId);
  notifyListeners('mutation_retry', { mutationId });
  await processMutationQueue();
  return true;
};

/**
 * Retries all conflicted mutations for current user.
 * @returns {Promise<boolean>}
 */
export const retryAllConflictedMutations = async () => {
  if (!navigator.onLine) {
    throw new Error('Cannot retry while offline. Please connect to the internet.');
  }

  const conflicts = await getConflictedMutations();
  for (const c of conflicts) {
    await resetMutationToPending(c.mutationId);
  }
  notifyListeners('mutation_retry_all', { count: conflicts.length });
  await processMutationQueue();
  return true;
};

/**
 * Explicitly discards a conflicted mutation from PouchDB.
 * @param {string} mutationId 
 * @returns {Promise<boolean>}
 */
export const discardConflictedMutation = async (mutationId) => {
  await removeMutation(mutationId);
  notifyListeners('mutation_discarded', { mutationId });
  return true;
};

let isSyncEngineInitialized = false;

/**
 * Initializes listeners for online events and auto-sync triggers.
 */
export const initSyncEngine = () => {
  if (isSyncEngineInitialized) return;
  isSyncEngineInitialized = true;

  window.addEventListener('online', () => {
    console.log('Network online event detected. Starting sync engine...');
    processMutationQueue();
  });

  // Attempt initial sync on startup if online
  if (navigator.onLine) {
    setTimeout(() => {
      processMutationQueue();
    }, 1000);
  }
};

