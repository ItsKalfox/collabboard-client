import {
  getPendingMutations,
  removeMutationFromDB,
  updateMutationInDB,
  saveProjectToDB,
  deleteProjectFromDB,
  saveTaskToDB,
  deleteTaskFromDB,
  getProjectsFromDB,
  getTasksByProjectFromDB
} from './dbService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let isSyncing = false;
const tempIdMap = new Map();

const getAuthHeaders = (isJson = true) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

/**
 * Resolves a potential temporary ID to its real server ID
 */
export const resolveId = (id) => {
  if (!id) return id;
  return tempIdMap.get(id) || id;
};

/**
 * Dispatches custom window sync events for UI components
 */
const notifySyncEvent = (eventName, detail = {}) => {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
};

/**
 * Main queue processor for syncing offline mutations to backend server
 */
export const processMutationQueue = async () => {
  if (isSyncing) return;
  if (!navigator.onLine) return;

  const pending = await getPendingMutations();
  if (!pending || pending.length === 0) {
    return;
  }

  isSyncing = true;
  notifySyncEvent('collabboard:sync-start', { pendingCount: pending.length });

  let processedCount = 0;
  let hasError = false;

  try {
    for (const mutation of pending) {
      if (!navigator.onLine) break;

      try {
        await executeMutation(mutation);
        await removeMutationFromDB(mutation.id);
        processedCount++;
      } catch (err) {
        console.error(`Failed to process mutation #${mutation.id} (${mutation.type}):`, err);
        // If HTTP status is 4xx client error (except 429), remove unprocessable mutation
        if (err.status >= 400 && err.status < 500 && err.status !== 429) {
          console.warn(`Removing unprocessable mutation #${mutation.id} due to ${err.status} error.`);
          await removeMutationFromDB(mutation.id);
        } else {
          // Network error or 5xx server error: pause sync loop to retry later
          hasError = true;
          break;
        }
      }
    }
  } finally {
    isSyncing = false;
    notifySyncEvent('collabboard:sync-complete', { processedCount, hasError });
  }
};

/**
 * Executes individual API mutation against the backend
 */
async function executeMutation(mutation) {
  const { type, payload } = mutation;

  switch (type) {
    case 'CREATE_PROJECT': {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload.projectData)
      });
      const data = await response.json();
      if (!response.ok) {
        const err = new Error(data.message || 'Failed to sync project creation');
        err.status = response.status;
        throw err;
      }
      const realProject = data.data?.project || data.project;
      if (payload.tempId && realProject && realProject.id) {
        tempIdMap.set(payload.tempId, realProject.id);
        await deleteProjectFromDB(payload.tempId);
        await saveProjectToDB(realProject);
      }
      break;
    }

    case 'UPDATE_PROJECT': {
      const realProjectId = resolveId(payload.projectId);
      const response = await fetch(`${API_URL}/projects/${realProjectId}`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload.updateData)
      });
      const data = await response.json();
      if (!response.ok) {
        const err = new Error(data.message || 'Failed to sync project update');
        err.status = response.status;
        throw err;
      }
      if (data.data?.project) {
        await saveProjectToDB(data.data.project);
      }
      break;
    }

    case 'DELETE_PROJECT': {
      const realProjectId = resolveId(payload.projectId);
      const response = await fetch(`${API_URL}/projects/${realProjectId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(true)
      });
      if (!response.ok && response.status !== 404) {
        const data = await response.json().catch(() => ({}));
        const err = new Error(data.message || 'Failed to sync project deletion');
        err.status = response.status;
        throw err;
      }
      await deleteProjectFromDB(realProjectId);
      if (payload.projectId) await deleteProjectFromDB(payload.projectId);
      break;
    }

    case 'CREATE_TASK': {
      const realProjectId = resolveId(payload.projectId);
      const response = await fetch(`${API_URL}/projects/${realProjectId}/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload.taskData)
      });
      const data = await response.json();
      if (!response.ok) {
        const err = new Error(data.message || 'Failed to sync task creation');
        err.status = response.status;
        throw err;
      }
      const realTask = data.data?.task || data.task;
      if (payload.tempId && realTask && realTask.id) {
        tempIdMap.set(payload.tempId, realTask.id);
        await deleteTaskFromDB(payload.tempId);
        await saveTaskToDB({ ...realTask, projectId: realProjectId });
      }
      break;
    }

    case 'UPDATE_TASK': {
      const realTaskId = resolveId(payload.taskId);
      const response = await fetch(`${API_URL}/tasks/${realTaskId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ ...payload.updateData, force: true })
      });
      const data = await response.json();
      if (!response.ok && response.status !== 409) {
        const err = new Error(data.message || 'Failed to sync task update');
        err.status = response.status;
        throw err;
      }
      if (data.data?.task) {
        await saveTaskToDB(data.data.task);
      }
      break;
    }

    case 'UPDATE_TASK_STATUS': {
      const realTaskId = resolveId(payload.taskId);
      const response = await fetch(`${API_URL}/tasks/${realTaskId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ status: payload.status })
      });
      const data = await response.json();
      if (!response.ok) {
        const err = new Error(data.message || 'Failed to sync task status');
        err.status = response.status;
        throw err;
      }
      if (data.data?.task) {
        await saveTaskToDB(data.data.task);
      }
      break;
    }

    case 'DELETE_TASK': {
      const realTaskId = resolveId(payload.taskId);
      const response = await fetch(`${API_URL}/tasks/${realTaskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(true)
      });
      if (!response.ok && response.status !== 404) {
        const data = await response.json().catch(() => ({}));
        const err = new Error(data.message || 'Failed to sync task deletion');
        err.status = response.status;
        throw err;
      }
      await deleteTaskFromDB(realTaskId);
      if (payload.taskId) await deleteTaskFromDB(payload.taskId);
      break;
    }

    case 'CREATE_SUBTASK': {
      const realTaskId = resolveId(payload.taskId);
      const response = await fetch(`${API_URL}/tasks/${realTaskId}/subtasks`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload.subtaskData)
      });
      const data = await response.json();
      if (!response.ok) {
        const err = new Error(data.message || 'Failed to sync subtask creation');
        err.status = response.status;
        throw err;
      }
      break;
    }

    case 'UPDATE_SUBTASK': {
      const realSubtaskId = resolveId(payload.subtaskId);
      const response = await fetch(`${API_URL}/subtasks/${realSubtaskId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload.updateData)
      });
      if (!response.ok && response.status !== 404) {
        const data = await response.json().catch(() => ({}));
        const err = new Error(data.message || 'Failed to sync subtask update');
        err.status = response.status;
        throw err;
      }
      break;
    }

    case 'DELETE_SUBTASK': {
      const realSubtaskId = resolveId(payload.subtaskId);
      const response = await fetch(`${API_URL}/subtasks/${realSubtaskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(true)
      });
      if (!response.ok && response.status !== 404) {
        const data = await response.json().catch(() => ({}));
        const err = new Error(data.message || 'Failed to sync subtask deletion');
        err.status = response.status;
        throw err;
      }
      break;
    }

    default:
      console.warn(`Unknown mutation type: ${type}`);
      break;
  }
}

/**
 * Initialize automatic sync event listeners
 */
export const initSyncListeners = () => {
  window.addEventListener('online', () => {
    console.log('Network connected. Starting background mutation sync...');
    processMutationQueue();
  });

  // Attempt initial sync on load if online
  if (navigator.onLine) {
    processMutationQueue();
  }
};
