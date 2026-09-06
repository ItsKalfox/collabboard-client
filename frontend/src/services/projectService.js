import { fetchWithCache } from './cacheService';
import {
  saveProjectToDB,
  saveProjectsToDB,
  getProjectFromDB,
  getProjectsFromDB,
  deleteProjectFromDB,
  saveTasksToDB,
  getTasksByProjectFromDB,
  enqueueMutation,
  generateTempId
} from './dbService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper to get Authorization headers with Bearer token
 */
const getAuthHeaders = (isJson = true) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Create a new project via POST /api/projects
 * @param {Object} projectData
 * @returns {Promise<Object>} Created project object from backend or local DB
 */
export const createProject = async (projectData) => {
  if (!navigator.onLine) {
    const tempId = generateTempId('project');
    const newProject = {
      id: tempId,
      _id: tempId,
      ...projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: projectData.members || []
    };
    await saveProjectToDB(newProject);
    await enqueueMutation({
      type: 'CREATE_PROJECT',
      endpoint: '/projects',
      method: 'POST',
      payload: { ...projectData, tempId },
      entityType: 'project',
      entityId: tempId,
      tempId
    });
    return newProject;
  }

  try {
    const response = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(projectData)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create project');
    }

    const created = data.data?.project || data.project;
    if (created && (created.id || created._id)) {
      const projToSave = { ...created, id: created.id || created._id };
      await saveProjectToDB(projToSave);
      return projToSave;
    }
    return created;
  } catch (err) {
    if (!navigator.onLine || err.message.includes('fetch') || err.name === 'TypeError') {
      const tempId = generateTempId('project');
      const newProject = {
        id: tempId,
        _id: tempId,
        ...projectData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        members: projectData.members || []
      };
      await saveProjectToDB(newProject);
      await enqueueMutation({
        type: 'CREATE_PROJECT',
        endpoint: '/projects',
        method: 'POST',
        payload: { ...projectData, tempId },
        entityType: 'project',
        entityId: tempId,
        tempId
      });
      return newProject;
    }
    throw err;
  }
};

/**
 * Upload a cover image for a project via POST /api/projects/:id/cover-image
 */
export const uploadCoverImage = async (projectId, imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${API_URL}/projects/${projectId}/cover-image`, {
    method: 'POST',
    headers: getAuthHeaders(false),
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload cover image');
  }

  return data.data?.coverImage;
};

/**
 * Upload an attachment to a project via POST /api/projects/:id/attachments
 */
export const uploadAttachment = async (projectId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/projects/${projectId}/attachments`, {
    method: 'POST',
    headers: getAuthHeaders(false),
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload attachment');
  }

  return data.data?.attachment;
};

/**
 * Fetch all projects via GET /api/projects
 */
export const getProjects = async (searchQuery = '') => {
  const url = searchQuery 
    ? `${API_URL}/projects?q=${encodeURIComponent(searchQuery)}` 
    : `${API_URL}/projects`;

  try {
    const response = await fetchWithCache(url, {
      method: 'GET',
      headers: getAuthHeaders(true)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch projects');
    }

    const projects = data.data?.projects || [];
    if (projects.length > 0) {
      await saveProjectsToDB(projects);
    }
    return projects;
  } catch (err) {
    console.warn('getProjects network fetch failed, falling back to IndexedDB:', err);
    const dbProjects = await getProjectsFromDB();
    return dbProjects || [];
  }
};

/**
 * Update an existing project via PUT /api/projects/:id
 */
export const updateProject = async (projectId, updateData) => {
  if (!navigator.onLine) {
    const existing = await getProjectFromDB(projectId);
    const updated = { ...(existing || {}), ...updateData, id: projectId, updatedAt: new Date().toISOString() };
    await saveProjectToDB(updated);
    await enqueueMutation({
      type: 'UPDATE_PROJECT',
      endpoint: `/projects/${projectId}`,
      method: 'PUT',
      payload: updateData,
      entityType: 'project',
      entityId: projectId
    });
    return updated;
  }

  try {
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      body: JSON.stringify(updateData)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update project');
    }

    const updated = data.data?.project || data.project;
    if (updated) {
      const projToSave = { ...updated, id: updated.id || updated._id || projectId };
      await saveProjectToDB(projToSave);
      return projToSave;
    }
    return updateData;
  } catch (err) {
    if (!navigator.onLine || err.message.includes('fetch') || err.name === 'TypeError') {
      const existing = await getProjectFromDB(projectId);
      const updated = { ...(existing || {}), ...updateData, id: projectId, updatedAt: new Date().toISOString() };
      await saveProjectToDB(updated);
      await enqueueMutation({
        type: 'UPDATE_PROJECT',
        endpoint: `/projects/${projectId}`,
        method: 'PUT',
        payload: updateData,
        entityType: 'project',
        entityId: projectId
      });
      return updated;
    }
    throw err;
  }
};

/**
 * Fetch a single project by ID via GET /api/projects/:id
 */
export const getProjectById = async (projectId) => {
  try {
    const response = await fetchWithCache(`${API_URL}/projects/${projectId}`, {
      method: 'GET',
      headers: getAuthHeaders(true)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch project');
    }

    const project = data.data?.project;
    if (project) {
      await saveProjectToDB(project);
    }
    return project;
  } catch (err) {
    console.warn(`getProjectById fetch failed for ${projectId}, falling back to IndexedDB:`, err);
    const dbProject = await getProjectFromDB(projectId);
    if (dbProject) return dbProject;
    throw err;
  }
};

/**
 * Delete a project via DELETE /api/projects/:id
 */
export const deleteProject = async (projectId) => {
  if (!navigator.onLine) {
    await deleteProjectFromDB(projectId);
    await enqueueMutation({
      type: 'DELETE_PROJECT',
      endpoint: `/projects/${projectId}`,
      method: 'DELETE',
      payload: { projectId },
      entityType: 'project',
      entityId: projectId
    });
    return { status: 'success', message: 'Project deleted offline' };
  }

  try {
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(true)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete project');
    }

    await deleteProjectFromDB(projectId);
    return data;
  } catch (err) {
    if (!navigator.onLine || err.message.includes('fetch') || err.name === 'TypeError') {
      await deleteProjectFromDB(projectId);
      await enqueueMutation({
        type: 'DELETE_PROJECT',
        endpoint: `/projects/${projectId}`,
        method: 'DELETE',
        payload: { projectId },
        entityType: 'project',
        entityId: projectId
      });
      return { status: 'success', message: 'Project deleted offline' };
    }
    throw err;
  }
};

/**
 * Fetch attachments for a project via GET /api/projects/:id/attachments
 */
export const getAttachments = async (projectId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/attachments`, {
    method: 'GET',
    headers: getAuthHeaders(true)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch attachments');
  }

  return data.data?.attachments || [];
};

/**
 * Delete an attachment from a project via DELETE /api/projects/:id/attachments/:attachmentId
 */
export const deleteAttachment = async (projectId, attachmentId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(true)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete attachment');
  }

  return data;
};

/**
 * Fetch project members via GET /api/projects/:id/members
 */
export const getProjectMembers = async (projectId) => {
  try {
    const response = await fetchWithCache(`${API_URL}/projects/${projectId}/members`, {
      method: 'GET',
      headers: getAuthHeaders(true)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch project members');
    }

    return data.data?.members || [];
  } catch (err) {
    console.warn(`getProjectMembers fetch failed for ${projectId}:`, err);
    const dbProj = await getProjectFromDB(projectId);
    return dbProj?.members || [];
  }
};

/**
 * Search users via GET /api/users/search?q={query}
 */
export const searchUsers = async (query) => {
  if (!query || !query.trim()) return [];
  const response = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query.trim())}`, {
    method: 'GET',
    headers: getAuthHeaders(true)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to search users');
  }

  return data.data?.users || [];
};

/**
 * Add a member to a project via POST /api/projects/:id/members
 */
export const addProjectMember = async (projectId, memberData) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/members`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(memberData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to add project member');
  }

  return data.data?.member;
};

/**
 * Remove a member from a project via DELETE /api/projects/:id/members/:userId
 */
export const removeProjectMember = async (projectId, userId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/members/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(true)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to remove project member');
  }

  return data;
};

/**
 * Fetch project tasks & subtasks via GET /api/projects/:id/tasks
 */
export const getProjectTasks = async (projectId) => {
  try {
    const response = await fetchWithCache(`${API_URL}/projects/${projectId}/tasks`, {
      method: 'GET',
      headers: getAuthHeaders(true)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch project tasks');
    }

    const tasks = data.data?.tasks || [];
    if (tasks.length > 0) {
      await saveTasksToDB(projectId, tasks);
    }
    return tasks;
  } catch (err) {
    console.warn(`getProjectTasks fetch failed for project ${projectId}, falling back to IndexedDB:`, err);
    const dbTasks = await getTasksByProjectFromDB(projectId);
    return dbTasks || [];
  }
};

/**
 * Fetch project timeline history via GET /api/projects/:id/timeline
 */
export const getProjectTimeline = async (projectId, limit) => {
  const query = limit ? `?limit=${limit}` : '';
  const response = await fetch(`${API_URL}/projects/${projectId}/timeline${query}`, {
    method: 'GET',
    headers: getAuthHeaders(true)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch project timeline');
  }

  return data.data?.timeline || [];
};

/**
 * Refresh project timeline via GET /api/projects/:id/timeline/refresh?since={since}
 */
export const refreshProjectTimeline = async (projectId, since) => {
  const query = since ? `?since=${encodeURIComponent(since)}` : '';
  const response = await fetch(`${API_URL}/projects/${projectId}/timeline/refresh${query}`, {
    method: 'GET',
    headers: getAuthHeaders(true)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to refresh project timeline');
  }

  return data.data || { newActivities: [], lastRefreshedAt: new Date().toISOString() };
};

/**
 * Download an attachment via GET /api/projects/:id/attachments/:attachmentId/download
 */
export const downloadAttachment = async (projectId, attachmentId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/attachments/${attachmentId}/download`, {
    method: 'GET',
    headers: getAuthHeaders(true)
  });

  if (!response.ok) {
    let errorMsg = 'Failed to download attachment';
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // Response might not be JSON
    }
    throw new Error(errorMsg);
  }

  const disposition = response.headers.get('Content-Disposition');
  let filename = null;
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blob = await response.blob();
  return { blob, filename };
};
