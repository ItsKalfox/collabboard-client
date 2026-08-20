import React from 'react';
import { X } from 'lucide-react';
import '../auth/auth.css'; // Reuse auth styles for the glassmorphism card

export default function ActionModal({ isOpen, onClose, title, onSubmit, children, submitText = 'Submit', loading = false, hideSubmit = false, hideFooter = false, cardMinHeight }) {
  if (!isOpen) return null;

  // Determine if dark theme is active to match the rest of the app
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backdropFilter: 'blur(8px)',
        backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.3)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`auth-card ${!isDark ? 'light' : ''} auth-fade-in`}
        style={{ 
          maxWidth: '420px', 
          width: '100%', 
          padding: '32px',
          position: 'relative',
          boxSizing: 'border-box',
          backgroundColor: isDark ? '#101016' : '#ffffff',
          ...(cardMinHeight ? { minHeight: cardMinHeight } : {})
        }}
      >
        <button 
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted, #9ca3af)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div className="auth-header" style={{ marginBottom: '24px' }}>
          <h2 className="auth-title">{title}</h2>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          {children}

          {!hideFooter && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button 
                type="button" 
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                  background: 'transparent',
                  color: isDark ? '#fff' : '#000',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {hideSubmit ? 'Close' : 'Cancel'}
              </button>
              {!hideSubmit && (
                <button 
                  type="submit" 
                  className="auth-submit-btn" 
                  style={{ flex: 1, marginTop: 0 }}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : submitText}
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
