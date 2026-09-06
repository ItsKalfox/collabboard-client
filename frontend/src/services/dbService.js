/**
 * dbService.js
 * IndexedDB Offline Database Service for CollabBoard.
 *
 * Stores:
 * 1. projects: Structured project documents (keyPath: 'id')
 * 2. tasks: Structured task documents (keyPath: 'id', index: 'projectId')
 * 3. userProfile: Current user profile information (keyPath: 'id')
 * 4. mutationQueue: Queued offline mutations for background sync (keyPath: 'id', autoIncrement: true)
 */

const DB_NAME = 'CollabBoardOfflineDB';
const DB_VERSION = 1;

let dbInstance = null;

/**
 * Open or initialize IndexedDB connection
 */
export const openDB = () => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Projects Store
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }

      // 2. Tasks Store (indexed by projectId)
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('projectId', 'projectId', { unique: false });
      }

      // 3. User Profile Store
      if (!db.objectStoreNames.contains('userProfile')) {
        db.createObjectStore('userProfile', { keyPath: 'id' });
      }

      // 4. Dashboard Cache Store
      if (!db.objectStoreNames.contains('dashboard')) {
        db.createObjectStore('dashboard', { keyPath: 'key' });
      }

      // 5. Mutation Queue Store
      if (!db.objectStoreNames.contains('mutationQueue')) {
        const queueStore = db.createObjectStore('mutationQueue', { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('createdAt', 'createdAt', { unique: false });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('entityType', 'entityType', { unique: false });
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

/**
 * Helper to acquire an IndexedDB transaction and object store
 */
const getStore = async (storeName, mode = 'readonly') => {
  const db = await openDB();
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
};

/**
 * Generate temporary client ID for offline entity creation
 */
export const generateTempId = (prefix = 'offline') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/* ==========================================
   PROJECTS STORE API
   ========================================== */

export const saveProjects = async (projects) => {
  if (!Array.isArray(projects)) return;
  const store = await getStore('projects', 'readwrite');
  projects.forEach((proj) => {
    if (proj && (proj.id || proj._id)) {
      const formatted = { ...proj, id: proj.id || proj._id };
      store.put(formatted);
    }
  });
};

export const saveProject = async (project) => {
  if (!project) return;
  const projId = project.id || project._id;
  if (!projId) return;
  const store = await getStore('projects', 'readwrite');
  store.put({ ...project, id: projId });
};

export const getProjects = async () => {
  const store = await getStore('projects', 'readonly');
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
};

export const getProject = async (projectId) => {
  const store = await getStore('projects', 'readonly');
  return new Promise((resolve) => {
    const request = store.get(projectId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
};

export const deleteProject = async (projectId) => {
  const store = await getStore('projects', 'readwrite');
  store.delete(projectId);
};

// Backward-compatible aliases
export const saveProjectsToDB = saveProjects;
export const saveProjectToDB = saveProject;
export const getProjectsFromDB = getProjects;
export const getProjectFromDB = getProject;
export const deleteProjectFromDB = deleteProject;


/* ==========================================
   TASKS STORE API
   ========================================== */

export const saveTasks = async (projectId, tasks) => {
  if (!Array.isArray(tasks)) return;
  const store = await getStore('tasks', 'readwrite');
  tasks.forEach((t) => {
    if (t && (t.id || t._id)) {
      const taskId = t.id || t._id;
      store.put({ ...t, id: taskId, projectId });
    }
  });
};

export const saveTask = async (task) => {
  if (!task) return;
  const taskId = task.id || task._id;
  if (!taskId) return;
  const store = await getStore('tasks', 'readwrite');
  store.put({ ...task, id: taskId });
};

export const getTasks = async (projectId) => {
  const store = await getStore('tasks', 'readonly');
  return new Promise((resolve) => {
    if (projectId) {
      const index = store.index('projectId');
      const request = index.getAll(projectId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    } else {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    }
  });
};

export const getTask = async (taskId) => {
  const store = await getStore('tasks', 'readonly');
  return new Promise((resolve) => {
    const request = store.get(taskId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
};

export const deleteTask = async (taskId) => {
  const store = await getStore('tasks', 'readwrite');
  store.delete(taskId);
};

// Backward-compatible aliases
export const saveTasksToDB = saveTasks;
export const saveTaskToDB = saveTask;
export const getTasksByProjectFromDB = getTasks;
export const getTaskFromDB = getTask;
export const deleteTaskFromDB = deleteTask;


/* ==========================================
   USER PROFILE STORE API
   ========================================== */

export const saveUserProfile = async (user) => {
  if (!user) return;
  const userId = user.id || user._id || 'current_user';
  const store = await getStore('userProfile', 'readwrite');
  store.put({ ...user, id: userId });
};

export const getUserProfile = async () => {
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

// Backward-compatible aliases
export const saveUserProfileToDB = saveUserProfile;
export const getUserProfileFromDB = getUserProfile;


/* ==========================================
   DASHBOARD CACHE STORE API
   ========================================== */

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


/* ==========================================
   MUTATION QUEUE STORE API
   ========================================== */

/**
 * Enqueue a new mutation for background synchronization
 * Supports schema: id, type, endpoint, method, payload, entityType, entityId, createdAt, status, retryCount, error, version
 */
export const addMutation = async (mutationData) => {
  const store = await getStore('mutationQueue', 'readwrite');
  const record = {
    type: mutationData.type || 'UNKNOWN',
    endpoint: mutationData.endpoint || '',
    method: mutationData.method || 'POST',
    payload: mutationData.payload || {},
    entityType: mutationData.entityType || 'unknown',
    entityId: mutationData.entityId || null,
    createdAt: mutationData.createdAt || Date.now(),
    status: mutationData.status || 'pending',
    retryCount: mutationData.retryCount || 0,
    error: mutationData.error || null,
    version: mutationData.version || 1,
    // Maintain payload.tempId if present
    tempId: mutationData.tempId || (mutationData.payload ? mutationData.payload.tempId : null)
  };

  return new Promise((resolve, reject) => {
    const request = store.add(record);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const enqueueMutation = async (mutation) => {
  return addMutation(mutation);
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

export const getAllMutationsFromDB = async () => {
  const store = await getStore('mutationQueue', 'readonly');
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
};

export const getMutationsByStatus = async (status) => {
  const store = await getStore('mutationQueue', 'readonly');
  return new Promise((resolve) => {
    const index = store.index('status');
    const request = index.getAll(status);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
};

export const updateMutationStatus = async (id, status, error = null, retryCountIncrement = 0) => {
  const store = await getStore('mutationQueue', 'readwrite');
  return new Promise((resolve) => {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result;
      if (record) {
        record.status = status;
        if (error !== null) record.error = error;
        if (retryCountIncrement) record.retryCount = (record.retryCount || 0) + retryCountIncrement;
        store.put(record);
      }
      resolve(record);
    };
    getReq.onerror = () => resolve(null);
  });
};

export const updateMutationInDB = async (mutationRecord) => {
  const store = await getStore('mutationQueue', 'readwrite');
  store.put(mutationRecord);
};

export const deleteCompletedMutation = async (id) => {
  const store = await getStore('mutationQueue', 'readwrite');
  store.delete(id);
};

export const removeMutationFromDB = deleteCompletedMutation;

export const clearCompletedMutations = async () => {
  const store = await getStore('mutationQueue', 'readwrite');
  const index = store.index('status');
  const request = index.getAll('completed');
  request.onsuccess = () => {
    const list = request.result || [];
    list.forEach((item) => store.delete(item.id));
  };
};


/* ==========================================
   CLEARING & RESET HELPERS
   ========================================== */

export const clearStore = async (storeName) => {
  const store = await getStore(storeName, 'readwrite');
  store.clear();
};

export const clearAllStores = async () => {
  const stores = ['projects', 'tasks', 'userProfile', 'dashboard', 'mutationQueue'];
  for (const name of stores) {
    await clearStore(name);
  }
};
