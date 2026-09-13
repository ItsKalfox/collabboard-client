import PouchDB from 'pouchdb-browser';
import { parseJwt } from '../utils/jwtUtils';

const db = new PouchDB('collabboard_mutations');

/**
 * Gets current authenticated user ID for mutation isolation.
 * @returns {string}
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
  } catch {
    // ignore
  }
  return 'anonymous';
};

/**
 * Enqueues a new offline mutation. Handles coalescing for CREATE + DELETE pairs.
 * @param {Object} mutation - Mutation details
 * @returns {Promise<Object>} The stored mutation document
 */
export const enqueueMutation = async ({
  type,
  method,
  endpoint,
  payload = {},
  tempId = null,
  tempProjectId = null,
  taskId = null,
  projectId = null
}) => {
  const userId = getCurrentUserId();
  const timestamp = Date.now();
  const randomHex = Math.random().toString(36).substring(2, 8);
  const mutationId = `mutation_${timestamp}_${randomHex}`;

  // Coalescing check: If deleting a task/project that was created offline and still pending, remove the pending create
  if (type === 'DELETE_TASK' && taskId && taskId.startsWith('temp-')) {
    const allDocs = await db.allDocs({ include_docs: true });
    const pendingCreates = allDocs.rows
      .map(r => r.doc)
      .filter(doc => doc.type === 'CREATE_TASK' && doc.tempId === taskId && doc.status === 'PENDING');

    if (pendingCreates.length > 0) {
      for (const createDoc of pendingCreates) {
        await db.remove(createDoc);
      }
      // Both CREATE and DELETE cancel out (no-op)
      return null;
    }
  }

  if (type === 'DELETE_PROJECT' && projectId && projectId.startsWith('temp-')) {
    const allDocs = await db.allDocs({ include_docs: true });
    const pendingCreates = allDocs.rows
      .map(r => r.doc)
      .filter(doc => doc.type === 'CREATE_PROJECT' && doc.tempId === projectId && doc.status === 'PENDING');

    if (pendingCreates.length > 0) {
      for (const createDoc of pendingCreates) {
        await db.remove(createDoc);
      }
      return null;
    }
  }

  const doc = {
    _id: mutationId,
    mutationId,
    userId,
    type,
    method,
    endpoint,
    payload,
    tempId,
    tempProjectId,
    taskId,
    projectId,
    createdAt: timestamp,
    status: 'PENDING', // PENDING | PROCESSING | SYNCED | FAILED | CONFLICT
    retryCount: 0,
    lastError: null
  };

  await db.put(doc);
  return doc;
};

/**
 * Retrieves all pending mutations for the current user, ordered by creation time.
 * @returns {Promise<Array<Object>>}
 */
export const getPendingMutations = async () => {
  try {
    const userId = getCurrentUserId();
    const result = await db.allDocs({ include_docs: true });
    const docs = result.rows
      .map(r => r.doc)
      .filter(doc => doc.userId === userId && (doc.status === 'PENDING' || (doc.status === 'FAILED' && doc.retryCount < 3)))
      .sort((a, b) => a.createdAt - b.createdAt);

    return docs;
  } catch (err) {
    console.error('Failed to retrieve pending mutations:', err);
    return [];
  }
};

/**
 * Retrieves all mutations (including SYNCED, FAILED, CONFLICT) for debugging / audit.
 * @returns {Promise<Array<Object>>}
 */
export const getAllMutations = async () => {
  try {
    const userId = getCurrentUserId();
    const result = await db.allDocs({ include_docs: true });
    return result.rows
      .map(r => r.doc)
      .filter(doc => doc.userId === userId)
      .sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
};

/**
 * Updates status and metadata of a mutation in PouchDB.
 * @param {string} mutationId 
 * @param {string} status 
 * @param {Object} extra 
 */
export const updateMutationStatus = async (mutationId, status, extra = {}) => {
  try {
    const doc = await db.get(mutationId);
    doc.status = status;
    if (extra.lastError !== undefined) doc.lastError = extra.lastError;
    if (extra.retryCount !== undefined) doc.retryCount = extra.retryCount;
    if (extra.realId !== undefined) doc.realId = extra.realId;
    await db.put(doc);
    return doc;
  } catch (err) {
    console.error(`Failed to update mutation ${mutationId} status:`, err);
  }
};

/**
 * Safely removes a completed mutation from PouchDB.
 * @param {string} mutationId 
 */
export const removeMutation = async (mutationId) => {
  try {
    const doc = await db.get(mutationId);
    await db.remove(doc);
  } catch (err) {
    if (err.name !== 'not_found') {
      console.error(`Failed to remove mutation ${mutationId}:`, err);
    }
  }
};
