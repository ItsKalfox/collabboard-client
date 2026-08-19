import { useState, useEffect } from 'react';
import { AlertTriangle, X, AlertCircle } from 'lucide-react';
import { deleteProject } from '../../services/projectService';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  project,
  onDeleteConfirm,
  theme = 'dark',
}) {
  const isDark = theme !== 'light';
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isDeleting]);

  if (!isOpen || !project) return null;

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    setError('');

    try {
      // Send DELETE /projects/:id
      await deleteProject(project.id);

      // Only on backend success: update UI and close modal
      if (onDeleteConfirm) {
        onDeleteConfirm(project.id);
      }
      onClose();
    } catch (err) {
      console.error('Delete project failed:', err);
      setError(err.message || 'Failed to delete project. Please try again.');
      // Do NOT remove the project from the UI
    } finally {
      setIsDeleting(false);
    }
  };

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
      onClick={isDeleting ? undefined : onClose}
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
          disabled={isDeleting}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: isDark ? '#9ca3af' : '#6b7280',
            cursor: isDeleting ? 'not-allowed' : 'pointer',
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
        
        <p style={{ fontSize: '14px', color: isDark ? '#9ca3af' : '#4b5563', lineHeight: '1.5', marginBottom: '20px' }}>
          Are you sure you want to delete <strong style={{ color: isDark ? '#f3f4f6' : '#1f2937' }}>"{project.name}"</strong>? This action cannot be undone and will remove the project from the entire system.
        </p>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: theme === 'light' ? '#b91c1c' : '#fca5a5',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'left'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f3f4f6',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
              color: isDark ? '#e5e7eb' : '#374151',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              opacity: isDeleting ? 0.7 : 1
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}