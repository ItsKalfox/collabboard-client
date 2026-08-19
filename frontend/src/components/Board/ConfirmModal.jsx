import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import '../auth/auth.css'; // Reuse auth styles for the glassmorphism card

export default function ConfirmModal({ isOpen, onClose, title, message, onConfirm, confirmText = 'Delete', loading = false }) {
  if (!isOpen) return null;

  // Determine if dark theme is active to match the rest of the app
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backdropFilter: 'blur(8px)',
      backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.3)',
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div 
        className={`auth-card ${!isDark ? 'light' : ''} auth-fade-in`} 
        style={{ maxWidth: '400px', width: '100%', padding: '32px', position: 'relative', boxSizing: 'border-box', backgroundColor: isDark ? '#101016' : '#ffffff', textAlign: 'center' }}
      >
        <button type="button" onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted, #9ca3af)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#ef4444' }}>
          <AlertTriangle size={48} />
        </div>

        <h2 className="auth-title" style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{title}</h2>
        <p style={{ color: 'var(--text-secondary, #9ca3af)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" onClick={onClose}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: 'transparent', color: isDark ? '#fff' : '#000', fontWeight: '600', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button type="button" onClick={onConfirm}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
