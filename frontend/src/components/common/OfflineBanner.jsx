import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflineBanner({ isOnline, isSyncing }) {
  if (isOnline && !isSyncing) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        borderRadius: '30px',
        fontSize: '13px',
        fontWeight: '500',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
        border: !isOnline ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)',
        background: !isOnline ? 'rgba(30, 25, 15, 0.85)' : 'rgba(15, 23, 42, 0.85)',
        color: !isOnline ? '#fbbf24' : '#60a5fa',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {!isOnline ? (
        <>
          <WifiOff size={16} />
          <span>Offline Mode — Changes saved locally</span>
        </>
      ) : (
        <>
          <RefreshCw size={16} className="spin-animation" style={{ animation: 'spin 1.5s linear infinite' }} />
          <span>Syncing offline changes...</span>
        </>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
