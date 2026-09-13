import { getPendingMutations, updateMutationStatus, removeMutation } from './mutationStore';
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
        const projectsUrl = `${apiUrl}/projects`;
        const cached = await getCachedData(projectsUrl);
        const currentProjects = getProjectsArrayFromCache(cached);
        const updatedProjects = currentProjects.map(p => (p._id === updatedProject._id || p.id === updatedProject._id) ? { ...p, ...updatedProject } : p);
        await cacheData(getScopedCacheKey(projectsUrl), createUpdatedProjectsCachePayload(cached, updatedProjects));
      }
    } else if (type === 'DELETE_PROJECT') {
      const projectsUrl = `${apiUrl}/projects`;
      const cached = await getCachedData(projectsUrl);
      const currentProjects = getProjectsArrayFromCache(cached);
      const updatedProjects = currentProjects.filter(p => p._id !== projectId && p.id !== projectId);
      await cacheData(getScopedCacheKey(projectsUrl), createUpdatedProjectsCachePayload(cached, updatedProjects));
    } else if (type === 'CREATE_TASK' || type === 'UPDATE_TASK' || type === 'UPDATE_TASK_STATUS' || type === 'DELETE_TASK') {
      const realTask = responseData.data?.task || responseData.task;
      const targetProjectId = projectId || (realTask && realTask.projectId);

      if (targetProjectId) {
        const tasksUrl = `${apiUrl}/projects/${targetProjectId}/tasks`;
        const cached = await getCachedData(tasksUrl);
        if (cached && cached.data && Array.isArray(cached.data.tasks)) {
          let updatedTasks = [...cached.data.tasks];
          if (type === 'CREATE_TASK' && realTask) {
            updatedTasks = updatedTasks.filter(t => t._id !== tempId);
            updatedTasks.push(realTask);
          } else if ((type === 'UPDATE_TASK' || type === 'UPDATE_TASK_STATUS') && realTask) {
            updatedTasks = updatedTasks.map(t => (t._id === realTask._id || t._id === tempId) ? realTask : t);
          } else if (type === 'DELETE_TASK') {
            updatedTasks = updatedTasks.filter(t => t._id !== taskId && t._id !== tempId);
          }
          await cacheData(getScopedCacheKey(tasksUrl), { ...cached, data: { ...cached.data, tasks: updatedTasks } });
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
            const realId = resData.data?.project?._id || resData.data?.task?._id || resData.project?._id || resData.task?._id;
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
          await updateMutationStatus(mutation.mutationId, 'PENDING', { lastError: `HTTP ${response.status} Auth Error` });
          break; // Stop sync loop on auth failure
        } else if (response.status === 409) {
          console.warn(`Conflict error (409) for mutation ${mutation.mutationId}`);
          await updateMutationStatus(mutation.mutationId, 'CONFLICT', { lastError: '409 Version Conflict' });
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
 * Initializes listeners for online events and auto-sync triggers.
 */
export const initSyncEngine = () => {
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
