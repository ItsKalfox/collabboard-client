import { useState, useEffect, useCallback } from 'react';
import { processQueue, isSyncing as checkIsSyncing } from '../services/syncEngine';
import { getPendingMutations, getMutationsByStatus } from '../services/dbService';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [justSyncCompleted, setJustSyncCompleted] = useState(false);

  const refreshQueueStatus = useCallback(async () => {
    try {
      const pending = await getPendingMutations();
      const conflicts = await getMutationsByStatus('conflict');
      const failed = await getMutationsByStatus('failed');

      const syncingNow = checkIsSyncing();
      setIsSyncing(syncingNow);

      const prevCount = pendingCount;
      const newCount = pending.length;

      setPendingCount(newCount);
      setHasConflict(conflicts.length > 0);
      setHasFailed(failed.length > 0);

      // Trigger temporary "sync complete" flash if count went from >0 to 0 while online
      if (prevCount > 0 && newCount === 0 && isOnline) {
        setJustSyncCompleted(true);
        setTimeout(() => setJustSyncCompleted(false), 4000);
      }
    } catch (err) {
      console.warn('Error refreshing queue status:', err);
    }
  }, [pendingCount, isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      refreshQueueStatus();
      processQueue().then(refreshQueueStatus).catch(err => console.warn('Sync on online event error:', err));
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshQueueStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    refreshQueueStatus();

    // Poll status periodically (every 1.5 seconds) to catch queue processing changes
    const intervalId = setInterval(() => {
      refreshQueueStatus();
    }, 1500);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [refreshQueueStatus]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    hasConflict,
    hasFailed,
    justSyncCompleted,
    triggerSync: processQueue
  };
}
