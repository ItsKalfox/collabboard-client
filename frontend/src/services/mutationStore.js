import PouchDB from 'pouchdb-browser';
import { parseJwt } from '../utils/jwtUtils';

const db = new PouchDB('collabboard_mutations');

const mutationListeners = new Set();

/**
 * Subscribes a listener to mutation store lifecycle events (enqueued, updated, removed).
 * @param {Function} callback - (event: 'enqueued'|'updated'|'removed', data: Object) => void
 * @returns {Function} Unsubscribe function
 */
export const subscribeMutationStore = (callback) => {
  mutationListeners.add(callback);
  return () => mutationListeners.delete(callback);
};

const notifyMutationListeners = (event, data = {}) => {
  mutationListeners.forEach(fn => {
    try {
      fn(event, data);
    } catch (e) {
      console.error('Error in mutation store listener:', e);
    }
  });
};

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
        notifyMutationListeners('removed', { mutationId: createDoc._id || createDoc.mutationId, mutation: createDoc });
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
        notifyMutationListeners('removed', { mutationId: createDoc._id || createDoc.mutationId, mutation: createDoc });
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
  notifyMutationListeners('enqueued', { mutationId, mutation: doc });
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
 * Returns the count of pending mutations for the current user.
 * @returns {Promise<number>}
 */
export const getPendingMutationsCount = async () => {
  try {
    const list = await getPendingMutations();
    return list.length;
  } catch {
    return 0;
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
    if (extra.payload !== undefined) doc.payload = { ...doc.payload, ...extra.payload };
    await db.put(doc);
    notifyMutationListeners('updated', { mutationId, status, mutation: doc });
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
    notifyMutationListeners('removed', { mutationId, mutation: doc });
  } catch (err) {
    if (err.name !== 'not_found') {
      console.error(`Failed to remove mutation ${mutationId}:`, err);
    }
  }
};

/**
 * Retrieves all conflicted mutations for the current user.
 * @returns {Promise<Array<Object>>}
 */
export const getConflictedMutations = async () => {
  try {
    const userId = getCurrentUserId();
    const result = await db.allDocs({ include_docs: true });
    return result.rows
      .map(r => r.doc)
      .filter(doc => doc && doc.userId === userId && doc.status === 'CONFLICT')
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.error('Failed to retrieve conflicted mutations:', err);
    return [];
  }
};

/**
 * Resets a conflicted mutation back to PENDING without duplicating the document.
 * @param {string} mutationId 
 * @returns {Promise<Object|null>}
 */
export const resetMutationToPending = async (mutationId) => {
  try {
    const doc = await db.get(mutationId);
    doc.status = 'PENDING';
    doc.lastError = null;
    doc.retryCount = 0;
    await db.put(doc);
    notifyMutationListeners('updated', { mutationId, status: 'PENDING', mutation: doc });
    return doc;
  } catch (err) {
    console.error(`Failed to reset mutation ${mutationId} to PENDING:`, err);
    throw err;
  }
};

