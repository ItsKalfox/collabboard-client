import { useState, useEffect, useRef, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

const QUEUE_KEY = 'collabboard_offline_queue';

function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Manages a persistent queue of failed API actions.
 *
 * Returns:
 *   enqueueAction(action)  — save an action to be retried later
 *   pendingCount           — number of queued actions
 *   isSyncing              — true while processing the queue
 */
export function useOfflineQueue() {
  const { isOnline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(() => readQueue().length);
  const [isSyncing, setIsSyncing] = useState(false);
  // Track previous online state so we only trigger sync on the transition offline→online
  const wasOnline = useRef(isOnline);

  const enqueueAction = useCallback((action) => {
    const queue = readQueue();
    const entry = { ...action, id: `${Date.now()}-${Math.random()}`, timestamp: Date.now() };
    queue.push(entry);
    writeQueue(queue);
    setPendingCount(queue.length);
  }, []);

  const processQueue = useCallback(async () => {
    const queue = readQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);

    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const remaining = [];

    for (const item of queue) {
      try {
        if (item.type === 'UPDATE_TASK_STATUS') {
          const res = await fetch(`${apiUrl}/tasks/${item.taskId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(item.payload),
          });
          // Only remove from queue on success; re-queue on network failure
          if (!res.ok && res.status >= 500) {
            remaining.push(item); // server error — retry later
          }
          // 4xx errors are business-logic failures; discard them (stale move)
        } else {
          // Unknown action type — discard to prevent infinite loop
        }
      } catch {
        // Network still down — keep item and abort the rest of the loop
        remaining.push(item);
        // Re-queue all items not yet processed
        const currentIndex = queue.indexOf(item);
        remaining.push(...queue.slice(currentIndex + 1));
        break;
      }
    }

    writeQueue(remaining);
    setPendingCount(remaining.length);
    setIsSyncing(false);
  }, []);

  // Auto-sync whenever we come back online
  useEffect(() => {
    if (isOnline && !wasOnline.current) {
      processQueue();
    }
    wasOnline.current = isOnline;
  }, [isOnline, processQueue]);

  // Sync on initial mount too, in case the app was reopened with a queue
  useEffect(() => {
    if (isOnline && readQueue().length > 0) {
      processQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { enqueueAction, pendingCount, isSyncing };
}
