import { enqueueMutation } from './mutationStore';
import { generateTempId } from './tempIdMap';
import { cacheData, getCachedData, getScopedCacheKey } from './cacheService';
import { processMutationQueue } from './syncEngine';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

  const localProject = {
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
    tasks: [],
    _isPending: true
  };

  // Update local GET /api/projects read cache
  const projectsUrl = `${API_URL}/projects`;
  const scopedKey = getScopedCacheKey(projectsUrl);
  const cached = await getCachedData(projectsUrl);
  const currentList = (cached && cached.data && Array.isArray(cached.data.projects)) ? cached.data.projects : [];
  const updatedList = [localProject, ...currentList];

  await cacheData(scopedKey, { status: 'success', data: { projects: updatedList } });

  // Enqueue outbox mutation
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
  const currentTasks = (cached && cached.data && Array.isArray(cached.data.tasks)) ? cached.data.tasks : [];
  const updatedTasks = [...currentTasks, localTask];

  await cacheData(scopedKey, { status: 'success', data: { tasks: updatedTasks } });

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
 * Handles offline updating of a task (fields or status).
 */
export const handleOfflineUpdateTask = async (taskId, projectId, updateData, isStatusOnly = false) => {
  const tasksUrl = `${API_URL}/projects/${projectId}/tasks`;
  const scopedKey = getScopedCacheKey(tasksUrl);
  const cached = await getCachedData(tasksUrl);
  let updatedTask = null;

  if (cached && cached.data && Array.isArray(cached.data.tasks)) {
    const updatedTasks = cached.data.tasks.map(task => {
      if (task._id === taskId) {
        updatedTask = {
          ...task,
          ...updateData,
          updatedAt: new Date().toISOString(),
          _isPending: true
        };
        return updatedTask;
      }
      return task;
    });

    await cacheData(scopedKey, { status: 'success', data: { tasks: updatedTasks } });
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

  return updatedTask || { _id: taskId, ...updateData, _isPending: true };
};

/**
 * Handles offline deletion of a task.
 */
export const handleOfflineDeleteTask = async (taskId, projectId) => {
  const tasksUrl = `${API_URL}/projects/${projectId}/tasks`;
  const scopedKey = getScopedCacheKey(tasksUrl);
  const cached = await getCachedData(tasksUrl);

  if (cached && cached.data && Array.isArray(cached.data.tasks)) {
    const updatedTasks = cached.data.tasks.filter(task => task._id !== taskId);
    await cacheData(scopedKey, { status: 'success', data: { tasks: updatedTasks } });
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

  if (cached && cached.data && Array.isArray(cached.data.tasks)) {
    const updatedTasks = cached.data.tasks.map(task => {
      if (task._id === taskId) {
        let subtasks = task.subtasks || [];
        if (action === 'CREATE') {
          subtasks = [...subtasks, { _id: subtaskId || generateTempId('subtask'), ...payload }];
        } else if (action === 'UPDATE') {
          subtasks = subtasks.map(s => s._id === subtaskId ? { ...s, ...payload } : s);
        } else if (action === 'DELETE') {
          subtasks = subtasks.filter(s => s._id !== subtaskId);
        }
        return { ...task, subtasks, _isPending: true };
      }
      return task;
    });

    await cacheData(scopedKey, { status: 'success', data: { tasks: updatedTasks } });
  }

  let endpoint = `${API_URL}/tasks/${taskId}/subtasks`;
  let method = 'POST';
  let type = 'CREATE_SUBTASK';

  if (action === 'UPDATE') {
    endpoint = `${API_URL}/subtasks/${subtaskId}`;
    method = 'PUT';
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
