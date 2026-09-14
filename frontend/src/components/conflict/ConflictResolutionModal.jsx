import React, { useState } from 'react';
import { X, AlertTriangle, RefreshCw, Trash2, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import '../auth/auth.css';

export default function ConflictResolutionModal({
  isOpen,
  onClose,
  conflicts = [],
  onRetry,
  onRetryAll,
  onDiscard,
  isSyncing = false
}) {
  const [confirmDiscardId, setConfirmDiscardId] = useState(null);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  if (!isOpen) return null;

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const handleSingleRetry = async (mutationId) => {
    if (!isOnline || isSyncing) return;
    setActionInProgressId(mutationId);
    try {
      await onRetry(mutationId);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleSingleDiscard = async (mutationId) => {
    setActionInProgressId(mutationId);
    try {
      await onDiscard(mutationId);
      setConfirmDiscardId(null);
    } finally {
      setActionInProgressId(null);
    }
  };

  const formatEntityTitle = (mutation) => {
    if (mutation.payload?.name) return mutation.payload.name;
    if (mutation.payload?.title) return mutation.payload.title;
    if (mutation.type === 'UPDATE_PROJECT') return `Project ${mutation.projectId || ''}`;
    if (mutation.type === 'UPDATE_TASK' || mutation.type === 'UPDATE_TASK_STATUS') return `Task ${mutation.taskId || ''}`;
    return mutation.type || 'Item';
  };

  const formatEntityType = (mutation) => {
    if (mutation.type?.includes('PROJECT')) return 'PROJECT';
    if (mutation.type?.includes('TASK')) return 'TASK';
    if (mutation.type?.includes('SUBTASK')) return 'SUBTASK';
    return 'MUTATION';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backdropFilter: 'blur(10px)',
        backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.4)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className={`auth-card ${!isDark ? 'light' : ''} auth-fade-in`}
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
          position: 'relative',
          boxSizing: 'border-box',
          backgroundColor: isDark ? '#121218' : '#ffffff',
          borderRadius: '20px',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: isDark ? '#ffffff' : '#111827', margin: 0 }}>
                Sync Conflicts
              </h2>
              <p style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                Local edits could not be synchronized due to a version conflict on the server (HTTP 409).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: isDark ? '#9ca3af' : '#6b7280',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Status notice */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
            fontSize: '13px',
            color: isDark ? '#d1d5db' : '#4b5563',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOnline ? (
              <>
                <Wifi size={16} color="#10b981" />
                <span style={{ color: '#10b981', fontWeight: '600' }}>Online</span> — Ready to retry sync
              </>
            ) : (
              <>
                <WifiOff size={16} color="#f59e0b" />
                <span style={{ color: '#f59e0b', fontWeight: '600' }}>Offline</span> — Reconnect to internet to retry
              </>
            )}
          </div>
          <span style={{ fontSize: '12px', opacity: 0.8 }}>
            {conflicts.length} {conflicts.length === 1 ? 'conflict' : 'conflicts'} preserved
          </span>
        </div>

        {/* Conflicts List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            marginBottom: '20px'
          }}
        >
          {conflicts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: isDark ? '#9ca3af' : '#6b7280' }}>
              <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontWeight: '600', fontSize: '15px' }}>All conflicts resolved!</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>There are no remaining synchronization conflicts.</div>
            </div>
          ) : (
            conflicts.map((m) => {
              const entityTitle = formatEntityTitle(m);
              const entityType = formatEntityType(m);
              const payload = m.payload || {};
              const isConfirmingDiscard = confirmDiscardId === m.mutationId;
              const isProcessing = actionInProgressId === m.mutationId;

              return (
                <div
                  key={m.mutationId || m._id}
                  style={{
                    backgroundColor: isDark ? '#181822' : '#f9fafb',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '14px',
                    padding: '16px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                          color: isDark ? '#60a5fa' : '#2563eb'
                        }}
                      >
                        {entityType}
                      </span>
                      <span style={{ fontWeight: '600', fontSize: '15px', color: isDark ? '#ffffff' : '#111827' }}>
                        {entityTitle}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '2px 7px',
                        borderRadius: '999px',
                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                        color: isDark ? '#f87171' : '#b91c1c'
                      }}
                    >
                      {m.lastError || '409 Version Conflict'}
                    </span>
                  </div>

                  {/* Summary of local changes that failed sync */}
                  <div
                    style={{
                      backgroundColor: isDark ? '#12121a' : '#ffffff',
                      border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      fontSize: '12px',
                      color: isDark ? '#9ca3af' : '#4b5563',
                      marginBottom: '12px'
                    }}
                  >
                    <div style={{ fontWeight: '600', marginBottom: '6px', color: isDark ? '#d1d5db' : '#374151' }}>
                      Preserved Local Changes ({m.method || 'PUT'} {m.type}):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '6px' }}>
                      {Object.entries(payload)
                        .filter(([k]) => !['__v', 'subtasks', 'members', 'tasks'].includes(k))
                        .map(([k, v]) => (
                          <div key={k} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <span style={{ fontWeight: '500', opacity: 0.8 }}>{k}: </span>
                            <span style={{ color: isDark ? '#f3f4f6' : '#111827' }}>{String(v ?? '')}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Actions per conflict */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
                    {isConfirmingDiscard ? (
                      <>
                        <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>
                          Discard offline edits?
                        </span>
                        <button
                          type="button"
                          onClick={() => setConfirmDiscardId(null)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.15)',
                            backgroundColor: 'transparent',
                            color: isDark ? '#ffffff' : '#111827',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSingleDiscard(m.mutationId)}
                          disabled={isProcessing}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          {isProcessing ? 'Discarding...' : 'Yes, Discard'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setConfirmDiscardId(m.mutationId)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                            backgroundColor: 'transparent',
                            color: isDark ? '#9ca3af' : '#6b7280',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                          onMouseOut={(e) => { e.currentTarget.style.color = isDark ? '#9ca3af' : '#6b7280'; }}
                        >
                          <Trash2 size={13} />
                          Discard
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSingleRetry(m.mutationId)}
                          disabled={!isOnline || isProcessing || isSyncing}
                          title={!isOnline ? 'Cannot retry while offline' : 'Retry synchronization'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: isDark ? '#3b82f6' : '#2563eb',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: (!isOnline || isProcessing || isSyncing) ? 'not-allowed' : 'pointer',
                            opacity: (!isOnline || isProcessing || isSyncing) ? 0.6 : 1
                          }}
                        >
                          <RefreshCw size={13} className={isProcessing ? 'spin-icon' : ''} />
                          {isProcessing ? 'Retrying...' : isOnline ? 'Retry Sync' : 'Offline'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
            marginTop: 'auto'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.15)',
              backgroundColor: 'transparent',
              color: isDark ? '#ffffff' : '#111827',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Close
          </button>

          {conflicts.length > 1 && (
            <button
              type="button"
              onClick={onRetryAll}
              disabled={!isOnline || isSyncing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: (!isOnline || isSyncing) ? 'not-allowed' : 'pointer',
                opacity: (!isOnline || isSyncing) ? 0.6 : 1
              }}
            >
              <RefreshCw size={14} className={isSyncing ? 'spin-icon' : ''} />
              {isSyncing ? 'Syncing All...' : 'Retry All Conflicts'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
