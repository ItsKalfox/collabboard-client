import {
  getPendingMutations,
  getAllMutationsFromDB,
  updateMutationStatus,
  updateMutationInDB,
  deleteCompletedMutation,
  saveProjectToDB,
  getProjectFromDB,
  deleteProjectFromDB,
  saveTaskToDB,
  getTaskFromDB,
  deleteTaskFromDB,
  getTasksByProjectFromDB
} from './dbService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let syncingLockState = false;

/**
 * Get current sync status
 */
export const isSyncing = () => syncingLockState;

/**
 * Get count of pending mutations in the queue
 */
export const getPendingMutationCount = async () => {
  try {
    const pending = await getPendingMutations();
    return pending.length;
  } catch (err) {
    console.warn('Failed to get pending mutation count:', err);
    return 0;
  }
};

/**
 * Enqueue a new mutation record and attempt synchronization if online
 */
export const enqueueMutation = async (mutationData) => {
  const { addMutation } = await import('./dbService');
  const result = await addMutation(mutationData);
  if (navigator.onLine && !syncingLockState) {
    processQueue().catch(err => console.warn('Background sync error:', err));
  }
  return result;
};

/**
 * Remap temporary IDs across pending mutation payloads, endpoints, and IndexedDB stores
 */
const remapTemporaryId = async (tempId, realId, entityType) => {
  if (!tempId || !realId || tempId === realId) return;

  try {
    // 1. Update dependent queued mutations in IndexedDB
    const allMutations = await getAllMutationsFromDB();
    for (const item of allMutations) {
      if (item.status !== 'pending') continue;
      let modified = false;

      // Endpoint replacement
      if (item.endpoint && item.endpoint.includes(tempId)) {
        item.endpoint = item.endpoint.replaceAll(tempId, realId);
        modified = true;
      }

      // Entity ID replacement
      if (item.entityId === tempId) {
        item.entityId = realId;
        modified = true;
      }

      // Temp ID field replacement
      if (item.tempId === tempId) {
        item.tempId = realId;
        modified = true;
      }

      // Payload replacement
      if (item.payload && typeof item.payload === 'object') {
        const payloadStr = JSON.stringify(item.payload);
        if (payloadStr.includes(tempId)) {
          const replacedStr = payloadStr.replaceAll(tempId, realId);
          try {
            item.payload = JSON.parse(replacedStr);
            modified = true;
          } catch (e) {
            console.warn('Payload remapping parse error:', e);
          }
        }
      }

      if (modified) {
        await updateMutationInDB(item);
      }
    }

    // 2. Update IndexedDB entity references
    if (entityType === 'project' || tempId.startsWith('proj-off')) {
      const dbProj = await getProjectFromDB(tempId);
      if (dbProj) {
        await deleteProjectFromDB(tempId);
        await saveProjectToDB({ ...dbProj, id: realId, _id: realId });
      }

      // Update tasks referencing temp project ID
      const projectTasks = await getTasksByProjectFromDB(tempId);
      if (Array.isArray(projectTasks) && projectTasks.length > 0) {
        for (const task of projectTasks) {
          await deleteTaskFromDB(task.id);
          await saveTaskToDB({ ...task, projectId: realId });
        }
      }
    } else if (entityType === 'task' || tempId.startsWith('task-off')) {
      const dbTask = await getTaskFromDB(tempId);
      if (dbTask) {
        await deleteTaskFromDB(tempId);
        await saveTaskToDB({ ...dbTask, id: realId, _id: realId });
      }
    } else if (entityType === 'subtask' || tempId.startsWith('sub-off')) {
      // Subtasks are embedded inside parent tasks
      const allMutations = await getAllMutationsFromDB();
      // Inspect tasks store for subtasks with tempId
      // taskService/Kanban board handles subtask array mapping
    }
  } catch (err) {
    console.error('Error remapping temporary ID:', err);
  }
};

/**
 * Process queued pending mutations sequentially in createdAt order
 */
export const processQueue = async () => {
  if (syncingLockState) return;
  if (!navigator.onLine) return;

  syncingLockState = true;

  try {
    const pendingMutations = await getPendingMutations();
    // Sort sequentially by createdAt ascending
    pendingMutations.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    for (const mutation of pendingMutations) {
      if (!navigator.onLine) {
        break; // Network connection lost, halt processing
      }

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const endpointUrl = mutation.endpoint.startsWith('http')
        ? mutation.endpoint
        : `${API_URL}${mutation.endpoint.startsWith('/') ? '' : '/'}${mutation.endpoint}`;

      const options = {
        method: mutation.method || 'POST',
        headers
      };

      if (mutation.method !== 'GET' && mutation.method !== 'DELETE' && mutation.payload) {
        // Strip client temporary helper properties before sending to backend if necessary
        const bodyPayload = { ...mutation.payload };
        if (bodyPayload.tempId && !bodyPayload.id) {
          delete bodyPayload.tempId;
        }
        options.body = JSON.stringify(bodyPayload);
      }

      let res;
      try {
        res = await fetch(endpointUrl, options);
      } catch (networkErr) {
        console.warn('Network error during sync, halting queue processing:', networkErr.message);
        await updateMutationStatus(mutation.id, 'pending', networkErr.message, 1);
        break; // Stop loop on genuine network disconnect
      }

      // Handle 409 Conflict: Do NOT overwrite server data automatically
      if (res.status === 409) {
        let errData = {};
        try { errData = await res.json(); } catch {}
        console.warn(`Mutation ${mutation.id} conflict (HTTP 409):`, errData.message);
        await updateMutationStatus(mutation.id, 'conflict', `409 Conflict: ${errData.message || 'Server state conflict'}`, 0);
        continue;
      }

      // Handle Permanent Client Errors (400, 404, 422, etc.)
      if (res.status >= 400 && res.status < 500) {
        let errData = {};
        try { errData = await res.json(); } catch {}
        console.error(`Mutation ${mutation.id} permanent error (HTTP ${res.status}):`, errData.message);
        await updateMutationStatus(mutation.id, 'failed', `HTTP ${res.status}: ${errData.message || 'Permanent client error'}`, 0);
        continue;
      }

      // Handle Server Errors (500, 502, 503)
      if (res.status >= 500) {
        let errData = {};
        try { errData = await res.json(); } catch {}
        console.warn(`Mutation ${mutation.id} server error (HTTP ${res.status}), will retry:`, errData.message);
        await updateMutationStatus(mutation.id, 'pending', `HTTP ${res.status}: ${errData.message || 'Server error'}`, 1);
        break; // Stop loop on server errors to allow retry later
      }

      // Handle 2xx Success
      if (res.ok) {
        let data = {};
        try { data = await res.json(); } catch {}

        const resData = data.data || data;
        const serverEntity = resData.project || resData.task || resData.subtask || resData;

        const realId = serverEntity?.id || serverEntity?._id || data.id || data._id;

        // Temporary ID resolution & cascading updates
        const tempId = mutation.tempId || (mutation.payload ? mutation.payload.tempId : null);
        if (tempId && realId) {
          await remapTemporaryId(tempId, realId, mutation.entityType);
        }

        // Save fresh server object to IndexedDB if returned
        if (mutation.entityType === 'project' && serverEntity && serverEntity.name) {
          await saveProjectToDB({ ...serverEntity, id: realId || serverEntity.id });
        } else if (mutation.entityType === 'task' && serverEntity && serverEntity.title) {
          await saveTaskToDB({ ...serverEntity, id: realId || serverEntity.id });
        }

        // Delete completed mutation from queue
        await deleteCompletedMutation(mutation.id);
      }
    }
  } catch (err) {
    console.error('Error processing sync queue:', err);
  } finally {
    syncingLockState = false;
  }
};

// Global browser online event listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    processQueue().catch(err => console.warn('Sync on online event error:', err));
  });

  // Attempt initial sync if already online on module load
  if (navigator.onLine) {
    setTimeout(() => {
      processQueue().catch(err => console.warn('Initial sync error:', err));
    }, 1000);
  }
}
