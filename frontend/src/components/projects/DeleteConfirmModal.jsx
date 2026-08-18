import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import '../TaskPopup/TaskPopup.css';
import './projects.css';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  project,
  onDeleteConfirm,
  theme = 'dark',
}) {
  const lightCls = theme === 'light' ? ' light' : '';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen || !project) return null;

  return (
    <div className="popup-backdrop" onClick={onClose}>
      <div
        className={`popup-panel${lightCls}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '400px', textAlign: 'center' }}
      >
        <div className="popup-header" style={{ justifyContent: 'flex-end' }}>
          <button className="popup-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div style={{ padding: '10px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <AlertTriangle size={24} />
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--popup-text-heading)', marginBottom: '8px' }}>
            Delete Project?
          </h3>
          
          <p style={{ fontSize: '14px', color: 'var(--popup-text-muted)', lineHeight: '1.5', marginBottom: '24px' }}>
            Are you sure you want to delete <strong style={{ color: 'var(--popup-text-main)' }}>"{project.name}"</strong>? This action cannot be undone.
          </p>

          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button
              className="popup-cancel-btn"
              onClick={onClose}
              style={{ flex: 1, padding: '10px' }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onDeleteConfirm(project.id);
                onClose();
              }}
              style={{
                flex: 1,
                padding: '10px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}