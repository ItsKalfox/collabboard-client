import { fetchWithCache } from './cacheService';
import { getDashboardDataFromDB } from './dbService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper function to handle API responses and errors for Dashboard widgets.
 * Wraps dashboard GET requests with fetchWithCache and fallback to IndexedDB.
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
    console.warn(`Fetch error for ${endpoint}, checking IndexedDB fallback:`, error);
    const cached = await getDashboardDataFromDB(endpoint);
    if (cached) {
      return cached;
    }
    // Return safe empty response shape when offline and no cache exists yet
    return { status: 'success', data: [] };
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
