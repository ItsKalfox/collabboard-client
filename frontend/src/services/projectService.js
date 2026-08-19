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
 * @returns {Promise<Object>} Created project object from backend
 */
export const createProject = async (projectData) => {
  const response = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(projectData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create project');
  }

  return data.data?.project || data.project;
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

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(true)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch projects');
  }

  return data.data?.projects || [];
};

/**
 * Update an existing project via PUT /api/projects/:id
 * @param {string} projectId
 * @param {Object} updateData
 * @returns {Promise<Object>} Updated project object from backend
 */
export const updateProject = async (projectId, updateData) => {
  const response = await fetch(`${API_URL}/projects/${projectId}`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify(updateData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update project');
  }

  return data.data?.project || data.project;
};

/**
 * Fetch a single project by ID via GET /api/projects/:id
 * @param {string} projectId
 * @returns {Promise<Object>} Project details
 */
export const getProjectById = async (projectId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}`, {
    method: 'GET',
    headers: getAuthHeaders(true)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch project');
  }

  return data.data?.project;
};

/**
 * Delete a project via DELETE /api/projects/:id
 * @param {string} projectId
 * @returns {Promise<Object>} Success response
 */
export const deleteProject = async (projectId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(true)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete project');
  }

  return data;
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
  const response = await fetch(`${API_URL}/projects/${projectId}/members`, {
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

