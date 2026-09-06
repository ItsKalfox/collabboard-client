import { fetchWithCache } from './cacheService';
import {
  saveTaskToDB,
  getTaskFromDB,
  deleteTaskFromDB,
  enqueueMutation,
  generateTempId
} from './dbService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = (isJson = true) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

/**
 * Create a new task under a project
 */
export const createTask = async (projectId, taskData) => {
  if (!navigator.onLine) {
    const tempId = generateTempId('task');
    const newTask = {
      id: tempId,
      _id: tempId,
      projectId,
      ...taskData,
      subtasks: taskData.subtasks || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveTaskToDB(newTask);
    await enqueueMutation({
      type: 'CREATE_TASK',
      endpoint: `/projects/${projectId}/tasks`,
      method: 'POST',
      payload: { ...taskData, tempId },
      entityType: 'task',
      entityId: tempId,
      tempId
    });
    return newTask;
  }

  try {
    const res = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(taskData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create task');
    }
    const created = data.data?.task || data.task;
    if (created) {
      await saveTaskToDB({ ...created, projectId });
    }
    return created;
  } catch (err) {
    if (!navigator.onLine || err.message.includes('fetch') || err.name === 'TypeError') {
      const tempId = generateTempId('task');
      const newTask = {
        id: tempId,
        _id: tempId,
        projectId,
        ...taskData,
        subtasks: taskData.subtasks || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveTaskToDB(newTask);
      await enqueueMutation({
        type: 'CREATE_TASK',
        endpoint: `/projects/${projectId}/tasks`,
        method: 'POST',
        payload: { ...taskData, tempId },
        entityType: 'task',
        entityId: tempId,
        tempId
      });
      return newTask;
    }
    throw err;
  }
};

/**
 * Update task status (Kanban move)
 */
export const updateTaskStatus = async (taskId, status) => {
  if (!navigator.onLine) {
    const existing = await getTaskFromDB(taskId);
    if (existing) {
      await saveTaskToDB({ ...existing, status, updatedAt: new Date().toISOString() });
    }
    await enqueueMutation({
      type: 'UPDATE_TASK_STATUS',
      endpoint: `/tasks/${taskId}/status`,
      method: 'PATCH',
      payload: { status },
      entityType: 'task',
      entityId: taskId
    });
    return { status: 'success', message: 'Task status updated offline' };
  }

  try {
    const res = await fetch(`${API_URL}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update task status');
    }
    const updated = data.data?.task || data.task;
    if (updated) {
      await saveTaskToDB(updated);
    }
    return data;
  } catch (err) {
    if (!navigator.onLine || err.message.includes('fetch') || err.name === 'TypeError') {
      const existing = await getTaskFromDB(taskId);
      if (existing) {
        await saveTaskToDB({ ...existing, status, updatedAt: new Date().toISOString() });
      }
      await enqueueMutation({
        type: 'UPDATE_TASK_STATUS',
        endpoint: `/tasks/${taskId}/status`,
        method: 'PATCH',
        payload: { status },
        entityType: 'task',
        entityId: taskId
      });
      return { status: 'success', message: 'Task status updated offline' };
    }
    throw err;
  }
};

/**
 * Update task details (title, description, due date, priority, assignee, etc.)
 */
export const updateTask = async (taskId, updateData) => {
  if (!navigator.onLine) {
    const existing = await getTaskFromDB(taskId);
    const updated = { ...(existing || {}), ...updateData, id: taskId, updatedAt: new Date().toISOString() };
    await saveTaskToDB(updated);
    await enqueueMutation({
      type: 'UPDATE_TASK',
      endpoint: `/tasks/${taskId}`,
      method: 'PATCH',
      payload: updateData,
      entityType: 'task',
      entityId: taskId
    });
    return updated;
  }

  try {
    const res = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(true),
      body: JSON.stringify(updateData)
    });
    const data = await res.json();
    if (!res.ok && res.status !== 409) {
      throw new Error(data.message || 'Failed to update task');
    }
    const updated = data.data?.task || data.task;
    if (updated) {
      await saveTaskToDB(updated);
    }
    return updated || updateData;
  } catch (err) {
    if (!navigator.onLine || err.message.includes('fetch') || err.name === 'TypeError') {
      const existing = await getTaskFromDB(taskId);
      const updated = { ...(existing || {}), ...updateData, id: taskId, updatedAt: new Date().toISOString() };
      await saveTaskToDB(updated);
      await enqueueMutation({
        type: 'UPDATE_TASK',
        endpoint: `/tasks/${taskId}`,
        method: 'PATCH',
        payload: updateData,
        entityType: 'task',
        entityId: taskId
      });
      return updated;
    }
    throw err;
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId) => {
  if (!navigator.onLine) {
    await deleteTaskFromDB(taskId);
    await enqueueMutation({
      type: 'DELETE_TASK',
      endpoint: `/tasks/${taskId}`,
      method: 'DELETE',
      payload: { taskId },
      entityType: 'task',
      entityId: taskId
    });
    return { status: 'success', message: 'Task deleted offline' };
  }

  try {
    const res = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(true)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete task');
    }
    await deleteTaskFromDB(taskId);
    return data;
  } catch (err) {
    if (!navigator.onLine || err.message.includes('fetch') || err.name === 'TypeError') {
      await deleteTaskFromDB(taskId);
      await enqueueMutation({
        type: 'DELETE_TASK',
        endpoint: `/tasks/${taskId}`,
        method: 'DELETE',
        payload: { taskId },
        entityType: 'task',
        entityId: taskId
      });
      return { status: 'success', message: 'Task deleted offline' };
    }
    throw err;
  }
};

/**
 * Create a subtask
 */
export const createSubtask = async (taskId, subtaskData) => {
  if (!navigator.onLine) {
    const tempId = generateTempId('subtask');
    const newSub = { id: tempId, ...subtaskData };
    const task = await getTaskFromDB(taskId);
    if (task) {
      const subtasks = [...(task.subtasks || []), newSub];
      await saveTaskToDB({ ...task, subtasks });
    }
    await enqueueMutation({
      type: 'CREATE_SUBTASK',
      endpoint: `/tasks/${taskId}/subtasks`,
      method: 'POST',
      payload: { ...subtaskData, tempId },
      entityType: 'subtask',
      entityId: tempId,
      tempId
    });
    return newSub;
  }

  try {
    const res = await fetch(`${API_URL}/tasks/${taskId}/subtasks`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(subtaskData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create subtask');
    return data.data?.subtask;
  } catch (err) {
    if (!navigator.onLine || err.message.includes('fetch') || err.name === 'TypeError') {
      const tempId = generateTempId('subtask');
      const newSub = { id: tempId, ...subtaskData };
      const task = await getTaskFromDB(taskId);
      if (task) {
        const subtasks = [...(task.subtasks || []), newSub];
        await saveTaskToDB({ ...task, subtasks });
      }
      await enqueueMutation({
        type: 'CREATE_SUBTASK',
        endpoint: `/tasks/${taskId}/subtasks`,
        method: 'POST',
        payload: { ...subtaskData, tempId },
        entityType: 'subtask',
        entityId: tempId,
        tempId
      });
      return newSub;
    }
    throw err;
  }
};

/**
 * Toggle / Update subtask
 */
export const updateSubtask = async (subtaskId, taskId, updateData) => {
  if (!navigator.onLine) {
    if (taskId) {
      const task = await getTaskFromDB(taskId);
      if (task && task.subtasks) {
        const subtasks = task.subtasks.map(s => (s.id === subtaskId || s._id === subtaskId) ? { ...s, ...updateData } : s);
        await saveTaskToDB({ ...task, subtasks });
      }
    }
    await enqueueMutation({
      type: 'UPDATE_SUBTASK',
      endpoint: `/subtasks/${subtaskId}`,
      method: 'PATCH',
      payload: updateData,
      entityType: 'subtask',
      entityId: subtaskId
    });
    return { status: 'success', message: 'Subtask updated offline' };
  }

  try {
    const res = await fetch(`${API_URL}/subtasks/${subtaskId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(true),
      body: JSON.stringify(updateData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update subtask');
    return data;
  } catch (err) {
    if (!navigator.onLine || err.message.includes('fetch') || err.name === 'TypeError') {
      if (taskId) {
        const task = await getTaskFromDB(taskId);
        if (task && task.subtasks) {
          const subtasks = task.subtasks.map(s => (s.id === subtaskId || s._id === subtaskId) ? { ...s, ...updateData } : s);
          await saveTaskToDB({ ...task, subtasks });
        }
      }
      await enqueueMutation({
        type: 'UPDATE_SUBTASK',
        endpoint: `/subtasks/${subtaskId}`,
        method: 'PATCH',
        payload: updateData,
        entityType: 'subtask',
        entityId: subtaskId
      });
      return { status: 'success', message: 'Subtask updated offline' };
    }
    throw err;
  }
};

/**
 * Delete a subtask
 */
export const deleteSubtask = async (subtaskId, taskId) => {
  if (!navigator.onLine) {
    if (taskId) {
      const task = await getTaskFromDB(taskId);
      if (task && task.subtasks) {
        const subtasks = task.subtasks.filter(s => s.id !== subtaskId && s._id !== subtaskId);
        await saveTaskToDB({ ...task, subtasks });
      }
    }
    await enqueueMutation({
      type: 'DELETE_SUBTASK',
      endpoint: `/subtasks/${subtaskId}`,
      method: 'DELETE',
      payload: { subtaskId },
      entityType: 'subtask',
      entityId: subtaskId
    });
    return { status: 'success', message: 'Subtask deleted offline' };
  }

  try {
    const res = await fetch(`${API_URL}/subtasks/${subtaskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(true)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete subtask');
    return data;
  } catch (err) {
    if (!navigator.onLine || err.message.includes('fetch') || err.name === 'TypeError') {
      if (taskId) {
        const task = await getTaskFromDB(taskId);
        if (task && task.subtasks) {
          const subtasks = task.subtasks.filter(s => s.id !== subtaskId && s._id !== subtaskId);
          await saveTaskToDB({ ...task, subtasks });
        }
      }
      await enqueueMutation({
        type: 'DELETE_SUBTASK',
        endpoint: `/subtasks/${subtaskId}`,
        method: 'DELETE',
        payload: { subtaskId },
        entityType: 'subtask',
        entityId: subtaskId
      });
      return { status: 'success', message: 'Subtask deleted offline' };
    }
    throw err;
  }
};
