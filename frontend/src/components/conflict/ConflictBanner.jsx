import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Eye, X, WifiOff } from 'lucide-react';

export default function ConflictBanner({ conflicts = [], onOpenModal, onRetryAll, isSyncing = false }) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!conflicts || conflicts.length === 0 || isDismissed) {
    return null;
  }

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const count = conflicts.length;

  const firstConflict = conflicts[0];
  const entityName = firstConflict?.payload?.name || firstConflict?.payload?.title || firstConflict?.type || 'item';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 20px',
        marginBottom: '16px',
        borderRadius: '16px',
        backdropFilter: 'blur(16px)',
        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
        border: isDark ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(239, 68, 68, 0.25)',
        boxShadow: isDark
          ? '0 8px 24px -6px rgba(239, 68, 68, 0.2)'
          : '0 8px 20px -6px rgba(239, 68, 68, 0.15)',
        transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
        zIndex: 20
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '260px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            flexShrink: 0
          }}
        >
          <AlertTriangle size={20} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '600', fontSize: '14px', color: isDark ? '#fecaca' : '#991b1b' }}>
              {count === 1 ? '1 Sync Conflict Detected' : `${count} Sync Conflicts Detected`}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 7px',
                borderRadius: '999px',
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.15)',
                color: isDark ? '#f87171' : '#b91c1c'
              }}
            >
              HTTP 409
            </span>
          </div>
          <span style={{ fontSize: '12px', color: isDark ? '#d1d5db' : '#4b5563', marginTop: '2px' }}>
            {count === 1
              ? `Local changes to "${entityName}" conflict with server updates. Your local edits are safely preserved.`
              : `Multiple offline edits conflict with server updates. Your local edits are safely preserved.`}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onOpenModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
            color: isDark ? '#ffffff' : '#111827',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Eye size={15} />
          Resolve Conflicts
        </button>

        <button
          type="button"
          onClick={onRetryAll}
          disabled={!isOnline || isSyncing}
          title={!isOnline ? 'Cannot retry while offline' : 'Retry synchronization'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: (!isOnline || isSyncing) ? 'not-allowed' : 'pointer',
            border: 'none',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            opacity: (!isOnline || isSyncing) ? 0.6 : 1,
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => { if (isOnline && !isSyncing) e.currentTarget.style.opacity = '0.9'; }}
          onMouseOut={(e) => { if (isOnline && !isSyncing) e.currentTarget.style.opacity = '1'; }}
        >
          {isOnline ? (
            <RefreshCw size={14} className={isSyncing ? 'spin-icon' : ''} />
          ) : (
            <WifiOff size={14} />
          )}
          {isSyncing ? 'Syncing...' : isOnline ? 'Retry All' : 'Offline'}
        </button>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          title="Dismiss banner"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: isDark ? '#9ca3af' : '#6b7280',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = isDark ? '#ffffff' : '#111827'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = isDark ? '#9ca3af' : '#6b7280'; }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
