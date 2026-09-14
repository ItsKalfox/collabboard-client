import { enqueueMutation } from './mutationStore';
import { generateTempId, resolveId } from './tempIdMap';
import { cacheData, getCachedData, getScopedCacheKey } from './cacheService';
import { processMutationQueue } from './syncEngine';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper to extract projects array from various cached response shapes.
 */
export const getProjectsArrayFromCache = (cached) => {
  if (!cached) return [];
  if (Array.isArray(cached)) return cached;
  if (Array.isArray(cached.projects)) return cached.projects;
  if (cached.data && Array.isArray(cached.data.projects)) return cached.data.projects;
  if (cached.data && Array.isArray(cached.data)) return cached.data;
  return [];
};

/**
 * Helper to wrap updated projects array back into the original cached structure.
 */
export const createUpdatedProjectsCachePayload = (cached, updatedProjects) => {
  if (!cached) return { status: 'success', data: { projects: updatedProjects } };
  if (Array.isArray(cached)) return updatedProjects;
  if (Array.isArray(cached.projects)) return { ...cached, projects: updatedProjects };
  if (cached.data && Array.isArray(cached.data.projects)) return { ...cached, data: { ...cached.data, projects: updatedProjects } };
  if (cached.data && Array.isArray(cached.data)) return { ...cached, data: updatedProjects };
  return { status: 'success', data: { projects: updatedProjects } };
};

/**
 * Handles offline creation of a project.
 */
export const handleOfflineCreateProject = async (projectData) => {
  const tempId = generateTempId('proj');
  const userRaw = localStorage.getItem('user');
  let ownerId = 'me';
  let ownerName = 'Current User';
  let ownerEmail = '';

  if (userRaw) {
    try {
      const u = JSON.parse(userRaw);
      ownerId = u.id || u._id || ownerId;
      ownerName = u.name || ownerName;
      ownerEmail = u.email || ownerEmail;
    } catch { }
  }

  const initialTasks = [];

  if (Array.isArray(projectData.tasks) && projectData.tasks.length > 0) {
    for (const t of projectData.tasks) {
      const tempTaskId = generateTempId('task');
      const localTask = {
        id: tempTaskId,
        _id: tempTaskId,
        projectId: tempId,
        title: t.title || 'Untitled Task',
        description: t.description || '',
        status: t.status || 'todo',
        priority: t.priority || 'medium',
        assigneeId: t.assigneeId || ownerId,
        dueDate: t.dueDate || null,
        subtasks: (t.subtasks || []).map(s => ({
          _id: generateTempId('subtask'),
          title: s.title || s.label || '',
          completed: Boolean(s.completed || s.done)
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _isPending: true
      };

      initialTasks.push(localTask);

      // Queue CREATE_TASK outbox mutation for initial task
      await enqueueMutation({
        type: 'CREATE_TASK',
        method: 'POST',
        endpoint: `${API_URL}/projects/${tempId}/tasks`,
        payload: {
          title: localTask.title,
          description: localTask.description,
          status: localTask.status,
          priority: localTask.priority,
          assigneeId: localTask.assigneeId,
          dueDate: localTask.dueDate,
          subtasks: localTask.subtasks
        },
        tempId: tempTaskId,
        projectId: tempId,
        taskId: tempTaskId
      });
    }
  }

  const localProject = {
    id: tempId,
    _id: tempId,
    name: projectData.name,
    description: projectData.description || '',
    status: projectData.status || 'planning',
    category: projectData.category || 'Design Reviews',
    color: projectData.color || 'blue',
    ownerId,
    coverImage: projectData.coverImage || null,
    dueDate: projectData.dueDate || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: [{ userId: ownerId, name: ownerName, email: ownerEmail, role: 'owner' }],
    tasks: initialTasks,
    _isPending: true
  };

  // Update local GET /api/projects read cache
  const projectsUrl = `${API_URL}/projects`;
  const scopedKey = getScopedCacheKey(projectsUrl);
  const cached = await getCachedData(projectsUrl);
  const currentList = getProjectsArrayFromCache(cached);
  const updatedList = [localProject, ...currentList.filter(p => String(p.id || p._id) !== String(localProject._id))];
  const updatedProjectsPayload = createUpdatedProjectsCachePayload(cached, updatedList);

  await cacheData(scopedKey, updatedProjectsPayload);

  // Update local GET /api/projects/:tempId/tasks read cache for initial tasks
  const projectTasksUrl = `${API_URL}/projects/${tempId}/tasks`;
  const projectTasksScopedKey = getScopedCacheKey(projectTasksUrl);
  await cacheData(projectTasksScopedKey, { status: 'success', data: { tasks: initialTasks } });

  // Enqueue outbox mutation for project
  await enqueueMutation({
    type: 'CREATE_PROJECT',
    method: 'POST',
    endpoint: projectsUrl,
    payload: projectData,
    tempId,
    projectId: tempId
  });

  return localProject;
};

/**
 * Handles offline deletion of a project.
 */
export const handleOfflineDeleteProject = async (projectId) => {
  const targetIdStr = String(projectId);
  const targetResolvedId = resolveId(projectId);

  // 1. Remove project from GET /api/projects read cache
  const projectsUrl = `${API_URL}/projects`;
  const scopedKey = getScopedCacheKey(projectsUrl);
  const cached = await getCachedData(projectsUrl);

  if (cached) {
    const currentProjects = getProjectsArrayFromCache(cached);
    const updatedProjects = currentProjects.filter(p => {
      const pId = String(p.id || p._id || '');
      const pId2 = String(p._id || p.id || '');
      const pResolved = resolveId(pId) || resolveId(pId2);

      if (pId === targetIdStr || pId2 === targetIdStr) return false;
      if (targetResolvedId && (pId === targetResolvedId || pId2 === targetResolvedId || pResolved === targetResolvedId)) return false;
      return true;
    });
    const updatedPayload = createUpdatedProjectsCachePayload(cached, updatedProjects);
    await cacheData(scopedKey, updatedPayload);
  }

  // 2. Clear tasks cache for target project
  const projectTasksUrl = `${API_URL}/projects/${projectId}/tasks`;
  const projectTasksScopedKey = getScopedCacheKey(projectTasksUrl);
  await cacheData(projectTasksScopedKey, { status: 'success', data: { tasks: [] } });

  // 3. Enqueue DELETE_PROJECT mutation (handles coalescing if pending CREATE_PROJECT exists)
  await enqueueMutation({
    type: 'DELETE_PROJECT',
    method: 'DELETE',
    endpoint: `${API_URL}/projects/${projectId}`,
    payload: null,
    tempId: targetIdStr.startsWith('temp-') ? targetIdStr : null,
    projectId: targetIdStr
  });

  return { status: 'success', message: 'Project deleted offline' };
};

/**
 * Handles offline creation of a task.
 */
export const handleOfflineCreateTask = async (projectId, taskData) => {
  const tempId = generateTempId('task');
  const userRaw = localStorage.getItem('user');
  let currentUserId = 'me';
  if (userRaw) {
    try {
      const u = JSON.parse(userRaw);
      currentUserId = u.id || u._id || currentUserId;
    } catch { }
  }

  const localTask = {
    id: tempId,
    _id: tempId,
    projectId,
    title: taskData.title,
    description: taskData.description || '',
    status: taskData.status || 'todo',
    priority: taskData.priority || 'medium',
    assigneeId: taskData.assigneeId || currentUserId,
    dueDate: taskData.dueDate || null,
    subtasks: (taskData.subtasks || []).map((s, idx) => ({
      _id: generateTempId('subtask'),
      title: s.title || s.label || '',
      completed: Boolean(s.completed || s.done)
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activities: [{
      type: 'created',
      text: `Task "${taskData.title}" created (offline)`,
      userId: currentUserId,
      timestamp: new Date().toISOString()
    }],
    _isPending: true
  };

  // Update local GET /api/projects/:projectId/tasks cache
  const tasksUrl = `${API_URL}/projects/${projectId}/tasks`;
  const scopedKey = getScopedCacheKey(tasksUrl);
  const cached = await getCachedData(tasksUrl);
  const currentTasks = getTasksArrayFromCache(cached);
  const updatedTasks = [...currentTasks, localTask];

  await cacheData(scopedKey, createUpdatedCachePayload(cached, updatedTasks));

  // Enqueue outbox mutation
  await enqueueMutation({
    type: 'CREATE_TASK',
    method: 'POST',
    endpoint: `${API_URL}/projects/${projectId}/tasks`,
    payload: taskData,
    tempId,
    projectId,
    taskId: tempId
  });

  return localTask;
};

/**
 * Helper to extract tasks array from various cached response shapes.
 */
export const getTasksArrayFromCache = (cached) => {
  if (!cached) return [];
  if (Array.isArray(cached)) return cached;
  if (Array.isArray(cached.tasks)) return cached.tasks;
  if (cached.data && Array.isArray(cached.data.tasks)) return cached.data.tasks;
  if (cached.data && Array.isArray(cached.data)) return cached.data;
  return [];
};

/**
 * Helper to wrap updated tasks array back into the original cached structure.
 */
export const createUpdatedCachePayload = (cached, updatedTasks) => {
  if (!cached) return { status: 'success', data: { tasks: updatedTasks } };
  if (Array.isArray(cached)) return updatedTasks;
  if (Array.isArray(cached.tasks)) return { ...cached, tasks: updatedTasks };
  if (cached.data && Array.isArray(cached.data.tasks)) return { ...cached, data: { ...cached.data, tasks: updatedTasks } };
  if (cached.data && Array.isArray(cached.data)) return { ...cached, data: updatedTasks };
  return { status: 'success', data: { tasks: updatedTasks } };
};

/**
 * Handles offline updating of a task (fields or status).
 */
export const handleOfflineUpdateTask = async (taskId, projectId, updateData, isStatusOnly = false) => {
  const tasksUrl = `${API_URL}/projects/${projectId}/tasks`;
  const scopedKey = getScopedCacheKey(tasksUrl);
  const cached = await getCachedData(tasksUrl);
  let updatedTask = null;

  if (cached) {
    const currentTasks = getTasksArrayFromCache(cached);
    const targetIdStr = String(taskId);

    const updatedTasks = currentTasks.map(task => {
      const tId = String(task.id || task._id);
      if (tId === targetIdStr) {
        updatedTask = {
          ...task,
          ...updateData,
          id: task.id || task._id || targetIdStr,
          _id: task._id || task.id || targetIdStr,
          updatedAt: new Date().toISOString(),
          _isPending: true
        };
        return updatedTask;
      }
      return task;
    });

    await cacheData(scopedKey, createUpdatedCachePayload(cached, updatedTasks));
  }

  // Also update local project cache if project contains embedded tasks
  const projectsUrl = `${API_URL}/projects`;
  const projectsScopedKey = getScopedCacheKey(projectsUrl);
  const cachedProjects = await getCachedData(projectsUrl);
  if (cachedProjects) {
    const currentProjects = getProjectsArrayFromCache(cachedProjects);
    const updatedProjects = currentProjects.map(p => {
      if (String(p.id || p._id) === String(projectId) && Array.isArray(p.tasks)) {
        const updatedProjTasks = p.tasks.map(t => {
          if (String(t.id || t._id) === String(taskId)) {
            return {
              ...t,
              ...updateData,
              id: t.id || t._id || taskId,
              _id: t._id || t.id || taskId,
              _isPending: true
            };
          }
          return t;
        });
        return { ...p, tasks: updatedProjTasks };
      }
      return p;
    });
    await cacheData(projectsScopedKey, createUpdatedProjectsCachePayload(cachedProjects, updatedProjects));
  }

  const endpoint = isStatusOnly
    ? `${API_URL}/tasks/${taskId}/status`
    : `${API_URL}/tasks/${taskId}`;

  const method = isStatusOnly ? 'PATCH' : 'PUT';
  const type = isStatusOnly ? 'UPDATE_TASK_STATUS' : 'UPDATE_TASK';

  await enqueueMutation({
    type,
    method,
    endpoint,
    payload: updateData,
    taskId,
    projectId
  });

  return updatedTask || { _id: taskId, id: taskId, ...updateData, _isPending: true };
};

/**
 * Handles offline deletion of a task.
 */
export const handleOfflineDeleteTask = async (taskId, projectId) => {
  const tasksUrl = `${API_URL}/projects/${projectId}/tasks`;
  const scopedKey = getScopedCacheKey(tasksUrl);
  const cached = await getCachedData(tasksUrl);

  if (cached) {
    const currentTasks = getTasksArrayFromCache(cached);
    const targetIdStr = String(taskId);

    const updatedTasks = currentTasks.filter(task => {
      const tId = String(task.id || task._id);
      return tId !== targetIdStr;
    });

    await cacheData(scopedKey, createUpdatedCachePayload(cached, updatedTasks));
  }

  // Also update local project cache if project contains embedded tasks
  const projectsUrl = `${API_URL}/projects`;
  const projectsScopedKey = getScopedCacheKey(projectsUrl);
  const cachedProjects = await getCachedData(projectsUrl);
  if (cachedProjects) {
    const currentProjects = getProjectsArrayFromCache(cachedProjects);
    const updatedProjects = currentProjects.map(p => {
      if (String(p.id || p._id) === String(projectId) && Array.isArray(p.tasks)) {
        const updatedProjTasks = p.tasks.filter(t => String(t.id || t._id) !== String(taskId));
        return { ...p, tasks: updatedProjTasks };
      }
      return p;
    });
    await cacheData(projectsScopedKey, createUpdatedProjectsCachePayload(cachedProjects, updatedProjects));
  }

  await enqueueMutation({
    type: 'DELETE_TASK',
    method: 'DELETE',
    endpoint: `${API_URL}/tasks/${taskId}`,
    payload: {},
    taskId,
    projectId
  });

  return { status: 'success', message: 'Task deleted locally' };
};

/**
 * Handles offline subtask operations.
 */
export const handleOfflineSubtaskOperation = async (subtaskId, taskId, projectId, action, payload = {}) => {
  const tasksUrl = `${API_URL}/projects/${projectId}/tasks`;
  const scopedKey = getScopedCacheKey(tasksUrl);
  const cached = await getCachedData(tasksUrl);

  if (cached) {
    const currentTasks = getTasksArrayFromCache(cached);
    const targetTaskIdStr = String(taskId);
    const targetSubIdStr = subtaskId ? String(subtaskId) : null;

    const updatedTasks = currentTasks.map(task => {
      const tId = String(task.id || task._id);
      if (tId === targetTaskIdStr) {
        let subtasks = task.subtasks || [];
        if (action === 'CREATE') {
          subtasks = [...subtasks, { _id: subtaskId || generateTempId('subtask'), id: subtaskId || generateTempId('subtask'), ...payload }];
        } else if (action === 'UPDATE') {
          subtasks = subtasks.map(s => String(s.id || s._id) === targetSubIdStr ? { ...s, ...payload } : s);
        } else if (action === 'DELETE') {
          subtasks = subtasks.filter(s => String(s.id || s._id) !== targetSubIdStr);
        }
        return { ...task, subtasks, _isPending: true };
      }
      return task;
    });

    await cacheData(scopedKey, createUpdatedCachePayload(cached, updatedTasks));
  }

  let endpoint = `${API_URL}/tasks/${taskId}/subtasks`;
  let method = 'POST';
  let type = 'CREATE_SUBTASK';

  if (action === 'UPDATE') {
    endpoint = `${API_URL}/subtasks/${subtaskId}`;
    method = 'PATCH';
    type = 'UPDATE_SUBTASK';
  } else if (action === 'DELETE') {
    endpoint = `${API_URL}/subtasks/${subtaskId}`;
    method = 'DELETE';
    type = 'DELETE_SUBTASK';
  }

  await enqueueMutation({
    type,
    method,
    endpoint,
    payload,
    taskId,
    projectId
  });

  return { status: 'success' };
};
