import PouchDB from 'pouchdb-browser';
import {
  saveProjectsToDB,
  saveProjectToDB,
  saveTasksToDB,
  saveUserProfileToDB,
  saveDashboardDataToDB,
  getProjectsFromDB,
  getProjectFromDB,
  getTasksByProjectFromDB,
  getUserProfileFromDB,
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
        const projectTaskMatch = key.match(/\/projects\/([^/]+)\/tasks/);
        const projectId = projectTaskMatch ? projectTaskMatch[1] : (data.data.tasks[0]?.projectId || null);
        await saveTasksToDB(projectId, data.data.tasks);
      }
      if (data.data.user) {
        await saveUserProfileToDB(data.data.user);
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
      if (projects && projects.length > 0) {
        return { status: 'success', data: { projects } };
      }
    }

    const singleProjectMatch = key.match(/\/projects\/([a-f0-9A-Za-z_-]+)$/i);
    if (singleProjectMatch && singleProjectMatch[1]) {
      const project = await getProjectFromDB(singleProjectMatch[1]);
      if (project) {
        return { status: 'success', data: { project } };
      }
    }

    const tasksMatch = key.match(/\/projects\/([a-f0-9A-Za-z_-]+)\/tasks$/i);
    if (tasksMatch && tasksMatch[1]) {
      const tasks = await getTasksByProjectFromDB(tasksMatch[1]);
      if (tasks && tasks.length > 0) {
        return { status: 'success', data: { tasks } };
      }
    }

    if (key.includes('/auth/me') || key.includes('/users/me')) {
      const user = await getUserProfileFromDB();
      if (user) {
        return { status: 'success', data: { user } };
      }
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
 * Performs a network-first fetch. If genuine network request failure occurs (e.g. offline),
 * attempts to retrieve the response from local cache / IndexedDB.
 * HTTP status errors (401, 403, 404, 409) return the response directly without fallback.
 * @param {string} url - The URL to fetch.
 * @param {Object} options - Standard fetch options.
 * @returns {Promise<Response>} Real or simulated Response object.
 */
export const fetchWithCache = async (url, options = {}) => {
  const cacheKey = url;

  // 1. OFFLINE-FIRST: If device is offline, do NOT attempt network fetch.
  // Retrieve from PouchDB / IndexedDB cache immediately (0ms network delay).
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 2. ONLINE / RACE CONDITION: Attempt network fetch with abort controller
  // to avoid long socket timeout hangs if network drops mid-request.
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const fetchOptions = { ...options, signal: options.signal || controller.signal };
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    // If HTTP response status is not 2xx, return response directly.
    // HTTP 401, 403, 404, 409 must NOT fall back to offline cached data.
    if (!response.ok) {
      return response;
    }

    // Successful GET -> cache response body asynchronously into IndexedDB & PouchDB
    const clonedResponse = response.clone();
    clonedResponse.json().then(data => {
      cacheData(cacheKey, data);
    }).catch(e => console.warn('Could not parse response JSON for caching:', e));

    return response;
  } catch (err) {
    // Genuine network failure or timeout -> attempt cache fallback
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
