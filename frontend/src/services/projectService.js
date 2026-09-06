import { fetchWithCache } from './cacheService';
import {
  saveProjectToDB,
  getProjectFromDB,
  deleteProjectFromDB,
  enqueueMutation
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
    const tempId = `proj-off-${Date.now()}`;
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
      payload: { tempId, projectData }
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
    if (created && created.id) {
      await saveProjectToDB(created);
    }
    return created;
  } catch (err) {
    if (!navigator.onLine || err.message.includes('fetch') || err.name === 'TypeError') {
      const tempId = `proj-off-${Date.now()}`;
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
        payload: { tempId, projectData }
      });
      return newProject;
    }
    throw err;
  }
};

/**
 * Upload a cover image for a project via POST /api/projects/:id/cover-image
 * @param {string} projectId
 * @param {File} imageFile
 * @returns {Promise<string>} Uploaded cover image URL
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
 * @param {string} projectId
 * @param {File} file
 * @returns {Promise<Object>} Uploaded attachment object
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
 * @param {string} searchQuery
 * @returns {Promise<Array>} List of projects
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
 * @param {string} projectId
 * @param {Object} updateData
 * @returns {Promise<Object>} Updated project object from backend or local DB
 */
export const updateProject = async (projectId, updateData) => {
  if (!navigator.onLine) {
    const existing = await getProjectFromDB(projectId);
    const updated = { ...existing, ...updateData, id: projectId, updatedAt: new Date().toISOString() };
    await saveProjectToDB(updated);
    await enqueueMutation({
      type: 'UPDATE_PROJECT',
      payload: { projectId, updateData }
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
    if (updated && updated.id) {
      await saveProjectToDB(updated);
    }
    return updated;
  } catch (err) {
    if (!navigator.onLine || err.message.includes('fetch') || err.name === 'TypeError') {
      const existing = await getProjectFromDB(projectId);
      const updated = { ...existing, ...updateData, id: projectId, updatedAt: new Date().toISOString() };
      await saveProjectToDB(updated);
      await enqueueMutation({
        type: 'UPDATE_PROJECT',
        payload: { projectId, updateData }
      });
      return updated;
    }
    throw err;
  }
};

/**
 * Fetch a single project by ID via GET /api/projects/:id
 * @param {string} projectId
 * @returns {Promise<Object>} Project details
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
 * @param {string} projectId
 * @returns {Promise<Object>} Success response
 */
export const deleteProject = async (projectId) => {
  if (!navigator.onLine) {
    await deleteProjectFromDB(projectId);
    await enqueueMutation({
      type: 'DELETE_PROJECT',
      payload: { projectId }
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
        payload: { projectId }
      });
      return { status: 'success', message: 'Project deleted offline' };
    }
    throw err;
  }
};

/**
 * Fetch attachments for a project via GET /api/projects/:id/attachments
 * @param {string} projectId
 * @returns {Promise<Array>} List of attachments
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
 * @param {string} projectId
 * @param {string} attachmentId
 * @returns {Promise<Object>} Success response
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
 * @param {string} projectId
 * @returns {Promise<Array>} List of project members
 */
export const getProjectMembers = async (projectId) => {
  const response = await fetchWithCache(`${API_URL}/projects/${projectId}/members`, {
    method: 'GET',
    headers: getAuthHeaders(true)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch project members');
  }

  return data.data?.members || [];
};

/**
 * Search users via GET /api/users/search?q={query}
 * @param {string} query
 * @returns {Promise<Array>} List of matching users
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
 * @param {string} projectId
 * @param {Object} memberData - { userId, email, role }
 * @returns {Promise<Object>} Added member object
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
 * @param {string} projectId
 * @param {string} userId
 * @returns {Promise<Object>} Response data
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
 * @param {string} projectId
 * @returns {Promise<Array>} List of project tasks
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
 * @param {string} projectId
 * @param {number} [limit]
 * @returns {Promise<Array>} List of timeline activities
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
 * @param {string} projectId
 * @param {string|number} [since]
 * @returns {Promise<Object>} Object with newActivities array and lastRefreshedAt
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
 * @param {string} projectId
 * @param {string} attachmentId
 * @returns {Promise<{ blob: Blob, filename: string|null }>}
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

  // Extract filename from Content-Disposition header if available
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





