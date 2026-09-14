import React, { useState, useEffect } from 'react';
import { WifiOff, X, RefreshCw } from 'lucide-react';

/**
 * Lightweight global offline banner displayed above main content when disconnected.
 * Informs the user that changes are saved locally and shows the pending mutation count.
 */
export default function OfflineBanner({
  isOnline = true,
  pendingCount = 0,
  onTriggerSync
}) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissal if connection status toggles or pending count changes
  useEffect(() => {
    setIsDismissed(false);
  }, [isOnline, pendingCount]);

  if (isOnline || isDismissed) {
    return null;
  }

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '10px 18px',
        marginBottom: '16px',
        borderRadius: '16px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
        border: isDark ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(245, 158, 11, 0.25)',
        boxShadow: isDark
          ? '0 6px 20px -4px rgba(245, 158, 11, 0.15)'
          : '0 6px 16px -4px rgba(245, 158, 11, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
        zIndex: 20
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            flexShrink: 0
          }}
        >
          <WifiOff size={18} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '600', fontSize: '13px', color: isDark ? '#fef3c7' : '#92400e' }}>
              No connection — changes are being saved locally.
            </span>
            {pendingCount > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.15)',
                  color: isDark ? '#fbbf24' : '#b45309'
                }}
              >
                {pendingCount} {pendingCount === 1 ? 'change waiting to sync' : 'changes waiting to sync'}
              </span>
            )}
          </div>
          <span style={{ fontSize: '12px', color: isDark ? '#d1d5db' : '#6b7280', marginTop: '2px' }}>
            {pendingCount > 0
              ? 'Your edits will automatically synchronize with the server as soon as the connection is restored.'
              : 'You can continue working offline. Any tasks, tags, or projects you edit will sync when reconnected.'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            color: isDark ? '#9ca3af' : '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          title="Dismiss banner"
          aria-label="Dismiss offline banner"
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
