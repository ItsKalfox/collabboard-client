import { fetchWithCache } from './cacheService';
import {
  saveTaskToDB,
  getTaskFromDB,
  deleteTaskFromDB,
  enqueueMutation
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
    const tempId = `task-off-${Date.now()}`;
    const newTask = {
      id: tempId,
      _id: tempId,
      projectId,
      ...taskData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveTaskToDB(newTask);
    await enqueueMutation({
      type: 'CREATE_TASK',
      payload: { projectId, taskData, tempId }
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
      const tempId = `task-off-${Date.now()}`;
      const newTask = {
        id: tempId,
        _id: tempId,
        projectId,
        ...taskData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveTaskToDB(newTask);
      await enqueueMutation({
        type: 'CREATE_TASK',
        payload: { projectId, taskData, tempId }
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
      payload: { taskId, status }
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
        payload: { taskId, status }
      });
      return { status: 'success', message: 'Task status updated offline' };
    }
    throw err;
  }
};

/**
 * Update task details
 */
export const updateTask = async (taskId, updateData) => {
  if (!navigator.onLine) {
    const existing = await getTaskFromDB(taskId);
    if (existing) {
      await saveTaskToDB({ ...existing, ...updateData, updatedAt: new Date().toISOString() });
    }
    await enqueueMutation({
      type: 'UPDATE_TASK',
      payload: { taskId, updateData }
    });
    return { ...existing, ...updateData };
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
    return updated;
  } catch (err) {
    if (!navigator.onLine || err.message.includes('fetch') || err.name === 'TypeError') {
      const existing = await getTaskFromDB(taskId);
      if (existing) {
        await saveTaskToDB({ ...existing, ...updateData, updatedAt: new Date().toISOString() });
      }
      await enqueueMutation({
        type: 'UPDATE_TASK',
        payload: { taskId, updateData }
      });
      return { ...existing, ...updateData };
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
      payload: { taskId }
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
        payload: { taskId }
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
    const tempId = `sub-off-${Date.now()}`;
    const newSub = { id: tempId, ...subtaskData };
    const task = await getTaskFromDB(taskId);
    if (task) {
      const subtasks = [...(task.subtasks || []), newSub];
      await saveTaskToDB({ ...task, subtasks });
    }
    await enqueueMutation({
      type: 'CREATE_SUBTASK',
      payload: { taskId, subtaskData }
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
      const tempId = `sub-off-${Date.now()}`;
      const newSub = { id: tempId, ...subtaskData };
      const task = await getTaskFromDB(taskId);
      if (task) {
        const subtasks = [...(task.subtasks || []), newSub];
        await saveTaskToDB({ ...task, subtasks });
      }
      await enqueueMutation({
        type: 'CREATE_SUBTASK',
        payload: { taskId, subtaskData }
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
        const subtasks = task.subtasks.map(s => s.id === subtaskId ? { ...s, ...updateData } : s);
        await saveTaskToDB({ ...task, subtasks });
      }
    }
    await enqueueMutation({
      type: 'UPDATE_SUBTASK',
      payload: { subtaskId, updateData }
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
          const subtasks = task.subtasks.map(s => s.id === subtaskId ? { ...s, ...updateData } : s);
          await saveTaskToDB({ ...task, subtasks });
        }
      }
      await enqueueMutation({
        type: 'UPDATE_SUBTASK',
        payload: { subtaskId, updateData }
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
        const subtasks = task.subtasks.filter(s => s.id !== subtaskId);
        await saveTaskToDB({ ...task, subtasks });
      }
    }
    await enqueueMutation({
      type: 'DELETE_SUBTASK',
      payload: { subtaskId }
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
          const subtasks = task.subtasks.filter(s => s.id !== subtaskId);
          await saveTaskToDB({ ...task, subtasks });
        }
      }
      await enqueueMutation({
        type: 'DELETE_SUBTASK',
        payload: { subtaskId }
      });
      return { status: 'success', message: 'Subtask deleted offline' };
    }
    throw err;
  }
};
