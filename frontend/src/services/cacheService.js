import PouchDB from 'pouchdb-browser';
import { parseJwt } from '../utils/jwtUtils';

const db = new PouchDB('collabboard_cache');

/**
 * Gets the current authenticated user identifier to isolate cache records.
 * @returns {string} User ID, email, or fallback identifier.
 */
const getCurrentUserId = () => {
  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user && (user.id || user._id || user.email)) {
        return String(user.id || user._id || user.email);
      }
    }

    const token = localStorage.getItem('token');
    if (token) {
      const payload = parseJwt(token);
      if (payload && (payload.id || payload._id || payload.sub || payload.email)) {
        return String(payload.id || payload._id || payload.sub || payload.email);
      }
    }
  } catch (err) {
    // Ignore parsing errors
  }
  return 'anonymous';
};

/**
 * Generates a user-scoped cache key.
 * @param {string} url - The API URL.
 * @returns {string} Scoped cache key.
 */
export const getScopedCacheKey = (url) => {
  const userId = getCurrentUserId();
  return `${userId}:${url}`;
};

/**
 * Saves data into local PouchDB instance with user scoping and metadata.
 * @param {string} key - Raw URL or scoped key.
 * @param {any} data - Data payload to cache.
 */
export const cacheData = async (key, data) => {
  try {
    const userId = getCurrentUserId();
    const scopedKey = key.startsWith(`${userId}:`) ? key : `${userId}:${key}`;
    const existing = await db.get(scopedKey).catch(() => null);
    
    const doc = {
      _id: scopedKey,
      userId,
      url: key,
      data,
      cachedAt: Date.now(),
      source: 'cache'
    };
    
    if (existing) {
      doc._rev = existing._rev;
    }
    await db.put(doc);
  } catch (err) {
    console.error('Failed to cache data:', err);
  }
};

/**
 * Retrieves cached data from PouchDB for the currently authenticated user.
 * @param {string} key - Raw URL or scoped key.
 * @returns {Promise<Object|null>} Document record containing data and metadata, or null.
 */
export const getCachedDataRecord = async (key) => {
  try {
    const userId = getCurrentUserId();
    const scopedKey = key.startsWith(`${userId}:`) ? key : `${userId}:${key}`;
    const doc = await db.get(scopedKey);
    return doc;
  } catch (err) {
    if (err.name === 'not_found') {
      return null;
    }
    console.error('Failed to get cached data record:', err);
    return null;
  }
};

/**
 * Legacy compatibility helper returning raw cached data.
 * @param {string} key - Raw URL or scoped key.
 * @returns {Promise<any|null>} The cached data payload or null.
 */
export const getCachedData = async (key) => {
  const record = await getCachedDataRecord(key);
  return record ? record.data : null;
};

/**
 * Performs a network-first fetch. On success, updates local user-scoped cache.
 * On network failure, retrieves user-scoped cached version from PouchDB.
 * @param {string} url - The URL to fetch.
 * @param {Object} options - Standard fetch options.
 * @returns {Promise<Response>} The fetch Response object.
 */
export const fetchWithCache = async (url, options = {}) => {
  const scopedKey = getScopedCacheKey(url);
  
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    // Clone response stream before reading JSON
    const data = await response.clone().json();
    await cacheData(scopedKey, data);
    return response;
  } catch (err) {
    console.warn(`Network request failed for ${url}, attempting cache fallback.`, err);
    const cachedRecord = await getCachedDataRecord(scopedKey);
    if (cachedRecord && cachedRecord.data) {
      const cachedAtHeader = cachedRecord.cachedAt 
        ? new Date(cachedRecord.cachedAt).toISOString() 
        : new Date().toISOString();

      return new Response(JSON.stringify(cachedRecord.data), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'X-Data-Source': 'cache',
          'X-Cached-At': cachedAtHeader
        }
      });
    }
    throw err; // Re-throw network error if no user-scoped cache entry exists
  }
};
