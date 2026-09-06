import PouchDB from 'pouchdb';

const db = new PouchDB('collabboard_cache');

/**
 * Saves data into the local PouchDB instance.
 * @param {string} key - The unique identifier for the data.
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
  } catch (err) {
    console.error('Failed to cache data:', err);
  }
};

/**
 * Retrieves data from the local PouchDB instance.
 * @param {string} key - The unique identifier for the data.
 * @returns {Promise<any|null>} The cached data or null if not found.
 */
export const getCachedData = async (key) => {
  try {
    const doc = await db.get(key);
    return doc.data;
  } catch (err) {
    if (err.name === 'not_found') {
      return null;
    }
    console.error('Failed to get cached data:', err);
    return null;
  }
};

/**
 * Performs a network-first fetch. If the network request fails,
 * it attempts to retrieve the response from the local PouchDB cache.
 * @param {string} url - The URL to fetch.
 * @param {Object} options - Standard fetch options.
 * @returns {Promise<Response>} The fetch Response object.
 */
export const fetchWithCache = async (url, options = {}) => {
  const cacheKey = url;
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    // We clone the response because reading JSON consumes the stream
    const data = await response.clone().json();
    await cacheData(cacheKey, data);
    return response;
  } catch (err) {
    console.warn(`Network request failed for ${url}, attempting cache fallback.`, err);
    const cached = await getCachedData(cacheKey);
    if (cached) {
      // Return a simulated fetch Response object
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    throw err; // If neither network nor cache succeeded
  }
};
