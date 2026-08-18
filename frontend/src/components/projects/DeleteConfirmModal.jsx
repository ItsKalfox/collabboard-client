import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  project,
  onDeleteConfirm,
  theme = 'dark',
}) {
  const isDark = theme !== 'light';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }} 
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDark ? '#1a1a24' : '#ffffff',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: '16px',
          boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.8)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '420px',
          width: '100%',
          padding: '24px',
          textAlign: 'center',
          color: isDark ? '#ffffff' : '#111827',
          position: 'relative'
        }}
      >
        <button 
          onClick={onClose} 
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: isDark ? '#9ca3af' : '#6b7280',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px'
          }}
        >
          <X size={18} />
        </button>

        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.12)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <AlertTriangle size={26} strokeWidth={2.2} />
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: isDark ? '#ffffff' : '#111827' }}>
          Delete Project?
        </h3>
        
        <p style={{ fontSize: '14px', color: isDark ? '#9ca3af' : '#4b5563', lineHeight: '1.5', marginBottom: '24px' }}>
          Are you sure you want to delete <strong style={{ color: isDark ? '#f3f4f6' : '#1f2937' }}>"{project.name}"</strong>? This action cannot be undone and will remove the project from the entire system.
        </p>

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f3f4f6',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
              color: isDark ? '#e5e7eb' : '#374151',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onDeleteConfirm(project.id);
              onClose();
            }}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}