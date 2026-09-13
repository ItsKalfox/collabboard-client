/**
 * Utility module for generating temporary client IDs and managing 
 * mappings between temporary client IDs and server-confirmed Mongo ObjectIds.
 */

const STORAGE_KEY = 'collabboard_temp_id_map';

/**
 * Generates a unique temporary client ID prefixed with 'temp-'
 * @param {string} type - Entity prefix ('task', 'proj', 'subtask')
 * @returns {string} Temporary ID
 */
export const generateTempId = (type = 'item') => {
  const timestamp = Date.now();
  const randomHex = Math.random().toString(36).substring(2, 9);
  return `temp-${type}-${timestamp}-${randomHex}`;
};

/**
 * Checks if a given ID is a temporary client ID.
 * @param {string} id 
 * @returns {boolean}
 */
export const isTempId = (id) => {
  return typeof id === 'string' && id.startsWith('temp-');
};

/**
 * Gets all stored ID mappings from localStorage.
 * @returns {Record<string, string>}
 */
export const getTempIdMap = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

/**
 * Registers a mapping between a temporary ID and a real server ID.
 * @param {string} tempId 
 * @param {string} realId 
 */
export const registerIdMapping = (tempId, realId) => {
  if (!tempId || !realId || tempId === realId) return;
  const map = getTempIdMap();
  map[tempId] = realId;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to save tempId mapping:', err);
  }
};

/**
 * Resolves a temporary ID to a real server ID if mapped, otherwise returns the original ID.
 * @param {string} id 
 * @returns {string} Real server ID or original ID
 */
export const resolveId = (id) => {
  if (!id) return id;
  const map = getTempIdMap();
  return map[id] || id;
};

/**
 * Replaces any temporary IDs in a string (e.g. endpoint URL) with their mapped real IDs.
 * @param {string} str 
 * @returns {string}
 */
export const replaceTempIdsInString = (str) => {
  if (!str) return str;
  const map = getTempIdMap();
  let result = str;
  Object.keys(map).forEach((tempId) => {
    if (result.includes(tempId)) {
      result = result.split(tempId).join(map[tempId]);
    }
  });
  return result;
};

/**
 * Deeply replaces temporary IDs in an object/payload with their mapped real IDs.
 * @param {any} obj 
 * @returns {any}
 */
export const replaceTempIdsInObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(replaceTempIdsInObject);
  }

  const map = getTempIdMap();
  const copy = { ...obj };
  Object.keys(copy).forEach((key) => {
    const val = copy[key];
    if (typeof val === 'string' && map[val]) {
      copy[key] = map[val];
    } else if (typeof val === 'object' && val !== null) {
      copy[key] = replaceTempIdsInObject(val);
    }
  });
  return copy;
};
