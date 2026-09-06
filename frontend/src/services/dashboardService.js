import { fetchWithCache } from './cacheService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper function to handle API responses and errors
 */
const fetchAPI = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetchWithCache(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Fetch error for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Fetches dashboard timeline data
 */
export const fetchTimelineData = () => {
  return fetchAPI('/dashboard/timeline');
};

/**
 * Fetches ongoing projects data
 */
export const fetchOngoingProjects = () => {
  return fetchAPI('/dashboard/projects/ongoing');
};

/**
 * Fetches team progress data
 * @param {string} [projectId] - Optional project ID to filter team progress
 */
export const fetchTeamProgress = (projectId = '') => {
  return fetchAPI(`/dashboard/teams${projectId ? `?projectId=${projectId}` : ''}`);
};

/**
 * Fetches recent files data
 */
export const fetchRecentFiles = () => {
  return fetchAPI('/dashboard/files');
};

/**
 * Fetches recent projects data
 */
export const fetchRecentProjects = () => {
  return fetchAPI('/dashboard/projects/recent');
};
