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
