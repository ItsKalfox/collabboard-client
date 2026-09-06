import PouchDB from 'pouchdb';

const db = new PouchDB('collabboard_cache');

export const cacheData = async (key, data) => {
};

export const getCachedData = async (key) => {
};

export const fetchWithCache = async (url, options = {}) => {
};
