import PouchDB from 'pouchdb';

const db = new PouchDB('collabboard_cache');

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

export const getCachedData = async (key) => {
};

export const fetchWithCache = async (url, options = {}) => {
};
