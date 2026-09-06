import PouchDB from 'pouchdb-browser';
import {
  saveProjectsToDB,
  saveProjectToDB,
  saveTasksToDB,
  saveDashboardDataToDB,
  getProjectsFromDB,
  getProjectFromDB,
  getTasksByProjectFromDB,
  getDashboardDataFromDB,
} from './dbService';

const db = new PouchDB('collabboard_cache');

/**
 * Saves data into local PouchDB instance and syncs structured entities to IndexedDB.
 * @param {string} key - The unique identifier/URL for the data.
 * @param {any} data - The data payload to cache.
 */
export const cacheData = async (key, data) => {
  try {
    const existing = await db.get(key).catch(() => null);
    const doc = {
      _id: key,
      data,
      timestamp: Date.now()
    };
    if (existing) {
      doc._rev = existing._rev;
    }
    await db.put(doc);

    // Synchronize structured entities to IndexedDB stores for offline query capabilities
    if (data && data.status === 'success' && data.data) {
      if (data.data.projects) {
        await saveProjectsToDB(data.data.projects);
      }
      if (data.data.project) {
        await saveProjectToDB(data.data.project);
      }
      if (data.data.tasks) {
        // Extract projectId from URL if possible
        const projectTaskMatch = key.match(/\/projects\/([^/]+)\/tasks/);
        if (projectTaskMatch && projectTaskMatch[1]) {
          await saveTasksToDB(projectTaskMatch[1], data.data.tasks);
        }
      }
      if (key.includes('/dashboard/')) {
        const endpoint = key.split('/api')[1] || key;
        await saveDashboardDataToDB(endpoint, data);
      }
    }
  } catch (err) {
    console.error('Failed to cache data:', err);
  }
};

/**
 * Retrieves data from local PouchDB instance or falls back to structured IndexedDB stores.
 * @param {string} key - The unique URL identifier for the data.
 * @returns {Promise<any|null>} The cached data payload or null if not found.
 */
export const getCachedData = async (key) => {
  try {
    const doc = await db.get(key);
    if (doc && doc.data) {
      return doc.data;
    }
  } catch (err) {
    if (err.name !== 'not_found') {
      console.error('PouchDB get error:', err);
    }
  }

  // Fallback to structured IndexedDB tables if PouchDB key missed
  try {
    if (key.includes('/projects?q=') || key.endsWith('/projects')) {
      const projects = await getProjectsFromDB();
      return { status: 'success', data: { projects } };
    }

    const singleProjectMatch = key.match(/\/projects\/([a-f0-9A-Z_-]+)$/i);
    if (singleProjectMatch && singleProjectMatch[1]) {
      const project = await getProjectFromDB(singleProjectMatch[1]);
      if (project) {
        return { status: 'success', data: { project } };
      }
    }

    const tasksMatch = key.match(/\/projects\/([a-f0-9A-Z_-]+)\/tasks$/i);
    if (tasksMatch && tasksMatch[1]) {
      const tasks = await getTasksByProjectFromDB(tasksMatch[1]);
      return { status: 'success', data: { tasks } };
    }

    if (key.includes('/dashboard/')) {
      const endpoint = key.split('/api')[1] || key;
      const dashboardData = await getDashboardDataFromDB(endpoint);
      if (dashboardData) {
        return dashboardData;
      }
    }
  } catch (fallbackErr) {
    console.error('IndexedDB fallback retrieval error:', fallbackErr);
  }

  return null;
};

/**
 * Performs a network-first fetch. If network request fails,
 * attempts to retrieve the response from local cache / IndexedDB.
 * @param {string} url - The URL to fetch.
 * @param {Object} options - Standard fetch options.
 * @returns {Promise<Response>} Simulated or real fetch Response object.
 */
export const fetchWithCache = async (url, options = {}) => {
  const cacheKey = url;
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    // Clone response before reading stream
    const data = await response.clone().json();
    await cacheData(cacheKey, data);
    return response;
  } catch (err) {
    console.warn(`Network request failed for ${url}, attempting cache fallback.`, err);
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    throw err; // Re-throw if neither network nor cache succeeded
  }
};
