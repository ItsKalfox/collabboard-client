import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

/**
 * Compact global status indicator rendered in the application top navigation bar.
 * Communicates online, offline, syncing, sync complete, and error states with icons and text.
 */
export default function SyncStatusBadge({
  isOnline = true,
  pendingCount = 0,
  syncStatus = 'idle',
  lastSyncError = null,
  onTriggerSync
}) {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  // 1. Determine active visual state
  let config = {
    key: 'online',
    text: 'Online',
    fullText: 'Online',
    title: 'Connected to server. All changes synced.',
    icon: (
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: isDark ? '#34d399' : '#10b981',
          boxShadow: isDark ? '0 0 6px #34d399' : '0 0 4px #10b981',
          display: 'inline-block'
        }}
      />
    ),
    bg: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
    border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(16, 185, 129, 0.25)',
    color: isDark ? '#34d399' : '#059669'
  };

  if (!isOnline) {
    if (pendingCount > 0) {
      config = {
        key: 'offline-pending',
        text: `Offline • ${pendingCount} pending`,
        fullText: `Offline — ${pendingCount} ${pendingCount === 1 ? 'change' : 'changes'} waiting to sync`,
        title: `Offline — ${pendingCount} ${pendingCount === 1 ? 'change is' : 'changes are'} saved locally and waiting to sync`,
        icon: <WifiOff size={13} strokeWidth={2.2} />,
        bg: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.12)',
        border: isDark ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(245, 158, 11, 0.3)',
        color: isDark ? '#fbbf24' : '#b45309'
      };
    } else {
      config = {
        key: 'offline',
        text: 'Offline',
        fullText: 'Offline — changes saved locally',
        title: 'Offline — changes are saved locally and will sync when reconnected',
        icon: <WifiOff size={13} strokeWidth={2.2} />,
        bg: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
        border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(245, 158, 11, 0.2)',
        color: isDark ? '#fbbf24' : '#d97706'
      };
    }
  } else if (syncStatus === 'syncing') {
    config = {
      key: 'syncing',
      text: 'Syncing changes…',
      fullText: 'Syncing changes…',
      title: 'Synchronizing queued local changes with server…',
      icon: (
        <RefreshCw
          size={13}
          strokeWidth={2.2}
          style={{
            animation: 'sync-badge-spin 1s linear infinite'
          }}
        />
      ),
      bg: isDark ? 'rgba(59, 130, 246, 0.16)' : 'rgba(59, 130, 246, 0.1)',
      border: isDark ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(59, 130, 246, 0.25)',
      color: isDark ? '#60a5fa' : '#2563eb'
    };
  } else if (syncStatus === 'synced') {
    config = {
      key: 'synced',
      text: 'Changes synced',
      fullText: 'Changes synced',
      title: 'All offline changes successfully synchronized.',
      icon: <CheckCircle2 size={13} strokeWidth={2.2} />,
      bg: isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.1)',
      border: isDark ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(16, 185, 129, 0.25)',
      color: isDark ? '#34d399' : '#059669'
    };
  } else if (syncStatus === 'auth_error') {
    config = {
      key: 'auth_error',
      text: 'Sync paused — auth required',
      fullText: 'Sync paused — authentication required',
      title: 'Sync paused: server reported authentication or authorization error (HTTP 401/403).',
      icon: <ShieldAlert size={13} strokeWidth={2.2} />,
      bg: isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.1)',
      border: isDark ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(239, 68, 68, 0.25)',
      color: isDark ? '#f87171' : '#dc2626'
    };
  } else if (syncStatus === 'error') {
    config = {
      key: 'error',
      text: 'Sync paused — will retry',
      fullText: 'Sync paused — will retry',
      title: lastSyncError ? `Sync paused: ${lastSyncError}. Will retry automatically.` : 'Sync paused — will retry.',
      icon: <AlertCircle size={13} strokeWidth={2.2} />,
      bg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
      border: isDark ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(245, 158, 11, 0.25)',
      color: isDark ? '#fbbf24' : '#d97706'
    };
  } else if (pendingCount > 0) {
    // Online with pending mutations (e.g. queue just ready to fire)
    config = {
      key: 'pending',
      text: `${pendingCount} pending`,
      fullText: `${pendingCount} ${pendingCount === 1 ? 'change' : 'changes'} waiting to sync`,
      title: `${pendingCount} ${pendingCount === 1 ? 'change' : 'changes'} waiting to sync with server`,
      icon: <RefreshCw size={13} strokeWidth={2.2} />,
      bg: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
      border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(59, 130, 246, 0.2)',
      color: isDark ? '#60a5fa' : '#2563eb'
    };
  }

  return (
    <>
      <style>{`
        @keyframes sync-badge-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .sync-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 13px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          line-height: 1;
          user-select: none;
          transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
          white-space: nowrap;
          cursor: default;
        }
        .sync-status-badge.clickable {
          cursor: pointer;
        }
        .sync-status-badge.clickable:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        @media (max-width: 640px) {
          .sync-status-badge .badge-text-full {
            display: none;
          }
          .sync-status-badge .badge-text-short {
            display: inline;
          }
        }
        @media (min-width: 641px) {
          .sync-status-badge .badge-text-short {
            display: none;
          }
          .sync-status-badge .badge-text-full {
            display: inline;
          }
        }
      `}</style>
      <div
        className={`sync-status-badge ${onTriggerSync && pendingCount > 0 && isOnline ? 'clickable' : ''}`}
        role="status"
        aria-live="polite"
        aria-label={config.fullText}
        title={config.title}
        onClick={onTriggerSync && pendingCount > 0 && isOnline ? onTriggerSync : undefined}
        style={{
          backgroundColor: config.bg,
          border: config.border,
          color: config.color
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {config.icon}
        </span>
        <span className="badge-text-full">{config.text}</span>
        <span className="badge-text-short">
          {config.key.startsWith('offline') ? (pendingCount > 0 ? `${pendingCount}` : 'Offline') : config.text}
        </span>
      </div>
    </>
  );
}
