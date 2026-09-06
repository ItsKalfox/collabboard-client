import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncComplete = () => setIsSyncing(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    window.addEventListener('collabboard:sync-start', handleSyncStart);
    window.addEventListener('collabboard:sync-complete', handleSyncComplete);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('collabboard:sync-start', handleSyncStart);
      window.removeEventListener('collabboard:sync-complete', handleSyncComplete);
    };
  }, []);

  return { isOnline, isSyncing };
}
