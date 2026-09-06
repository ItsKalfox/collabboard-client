/**
 * dbService.js
 * Native IndexedDB service for managing offline application stores:
 * - projects: cached project documents
 * - tasks: cached task documents indexed by projectId
 * - userProfile: cached logged-in user details
 * - dashboard: cached dashboard metrics by key
 * - mutationQueue: queued offline write operations for background synchronization
 */

const DB_NAME = 'CollabBoardOfflineDB';
const DB_VERSION = 1;

let dbInstance = null;

const openDB = () => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Projects store
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }

      // Tasks store (indexed by projectId for fast lookup)
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('projectId', 'projectId', { unique: false });
      }

      // User profile store
      if (!db.objectStoreNames.contains('userProfile')) {
        db.createObjectStore('userProfile', { keyPath: 'id' });
      }

      // Dashboard cache store
      if (!db.objectStoreNames.contains('dashboard')) {
        db.createObjectStore('dashboard', { keyPath: 'key' });
      }

      // Mutation Queue store
      if (!db.objectStoreNames.contains('mutationQueue')) {
        const queueStore = db.createObjectStore('mutationQueue', { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('Failed to open IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
};

/* --- Generic Helpers --- */

const getStore = async (storeName, mode = 'readonly') => {
  const db = await openDB();
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
};

/* --- Projects --- */

export const saveProjectsToDB = async (projects) => {
  if (!Array.isArray(projects)) return;
  const store = await getStore('projects', 'readwrite');
  projects.forEach((proj) => {
    if (proj && proj.id) {
      store.put(proj);
    }
  });
};

export const saveProjectToDB = async (project) => {
  if (!project || !project.id) return;
  const store = await getStore('projects', 'readwrite');
  store.put(project);
};

export const getProjectsFromDB = async () => {
  const store = await getStore('projects', 'readonly');
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
};

export const getProjectFromDB = async (projectId) => {
  const store = await getStore('projects', 'readonly');
  return new Promise((resolve) => {
    const request = store.get(projectId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
};

export const deleteProjectFromDB = async (projectId) => {
  const store = await getStore('projects', 'readwrite');
  store.delete(projectId);
};

/* --- Tasks --- */

export const saveTasksToDB = async (projectId, tasks) => {
  if (!Array.isArray(tasks)) return;
  const store = await getStore('tasks', 'readwrite');
  tasks.forEach((t) => {
    if (t && t.id) {
      store.put({ ...t, projectId });
    }
  });
};

export const saveTaskToDB = async (task) => {
  if (!task || !task.id) return;
  const store = await getStore('tasks', 'readwrite');
  store.put(task);
};

export const getTasksByProjectFromDB = async (projectId) => {
  const store = await getStore('tasks', 'readonly');
  return new Promise((resolve) => {
    const index = store.index('projectId');
    const request = index.getAll(projectId);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
};

export const getTaskFromDB = async (taskId) => {
  const store = await getStore('tasks', 'readonly');
  return new Promise((resolve) => {
    const request = store.get(taskId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
};

export const deleteTaskFromDB = async (taskId) => {
  const store = await getStore('tasks', 'readwrite');
  store.delete(taskId);
};

/* --- User Profile --- */

export const saveUserProfileToDB = async (user) => {
  if (!user) return;
  const userId = user.id || user._id || 'current_user';
  const store = await getStore('userProfile', 'readwrite');
  store.put({ ...user, id: userId });
};

export const getUserProfileFromDB = async () => {
  const store = await getStore('userProfile', 'readonly');
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const list = request.result || [];
      resolve(list.length > 0 ? list[0] : null);
    };
    request.onerror = () => resolve(null);
  });
};

/* --- Dashboard --- */

export const saveDashboardDataToDB = async (key, data) => {
  const store = await getStore('dashboard', 'readwrite');
  store.put({ key, data, timestamp: Date.now() });
};

export const getDashboardDataFromDB = async (key) => {
  const store = await getStore('dashboard', 'readonly');
  return new Promise((resolve) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result ? request.result.data : null);
    request.onerror = () => resolve(null);
  });
};

/* --- Mutation Queue --- */

export const enqueueMutation = async (mutation) => {
  const store = await getStore('mutationQueue', 'readwrite');
  const record = {
    ...mutation,
    timestamp: Date.now(),
    status: 'pending',
  };
  return new Promise((resolve, reject) => {
    const request = store.add(record);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const getPendingMutations = async () => {
  const store = await getStore('mutationQueue', 'readonly');
  return new Promise((resolve) => {
    const index = store.index('status');
    const request = index.getAll('pending');
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
};

export const updateMutationInDB = async (mutationRecord) => {
  const store = await getStore('mutationQueue', 'readwrite');
  store.put(mutationRecord);
};

export const removeMutationFromDB = async (id) => {
  const store = await getStore('mutationQueue', 'readwrite');
  store.delete(id);
};

export const clearCompletedMutations = async () => {
  const store = await getStore('mutationQueue', 'readwrite');
  const index = store.index('status');
  const request = index.getAll('completed');
  request.onsuccess = () => {
    const list = request.result || [];
    list.forEach((item) => store.delete(item.id));
  };
};
