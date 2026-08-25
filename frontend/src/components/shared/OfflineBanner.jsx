import { useState, useEffect, useRef } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import './OfflineBanner.css';

/**
 * Global bottom-center connection-status banner.
 * Mount once in App.jsx — it manages its own visibility.
 */
export default function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const { isSyncing, pendingCount } = useOfflineQueue();

  // 'offline' | 'syncing' | 'hidden'
  const [state, setState] = useState('hidden');
  const hideTimer = useRef(null);

  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);

    if (!isOnline) {
      setState('offline');
    } else if (isSyncing || pendingCount > 0) {
      setState('syncing');
    } else if (state === 'syncing' || state === 'offline') {
      // Just came back online and finished syncing — briefly show "back online" then hide
      setState('online');
      hideTimer.current = setTimeout(() => setState('hidden'), 2500);
    }

    return () => clearTimeout(hideTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, isSyncing, pendingCount]);

  if (state === 'hidden') return null;

  const config = {
    offline: {
      icon: (
        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <circle cx="12" cy="20" r="1" />
        </svg>
      ),
      text: <><span style={{ color: '#ef4444', fontWeight: 700 }}>Offline</span> - You are currently offline</>,
      className: 'offline-banner--offline',
    },
    syncing: {
      icon: (
        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="offline-banner-spin">
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      ),
      text: <><span style={{ color: '#10b981', fontWeight: 700 }}>Online</span> - Updating…</>,
      className: 'offline-banner--syncing',
    },
    online: {
      icon: (
        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      text: 'Back online',
      className: 'offline-banner--online',
    },
  };

  const { icon, text, className } = config[state];

  return (
    <div className={`offline-banner ${className}`}>
      <span className="offline-banner-icon">{icon}</span>
      <span className="offline-banner-text">{text}</span>
    </div>
  );
}
