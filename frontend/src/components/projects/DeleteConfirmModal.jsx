import React from 'react';
import { X } from 'lucide-react';
import './projects.css';

export default function DeleteConfirmModal({ isOpen, onClose, project, onDeleteConfirm, theme = 'dark' }) {
  const lightCls = theme === 'light' ? ' light' : '';

  if (!isOpen || !project) return null;

  const handleDelete = () => {
    onDeleteConfirm(project.id);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-panel${lightCls}`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <h3 className="modal-title">Delete Project</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="delete-warning-text">
            Are you sure you want to delete <strong>{project.name}</strong>? This action cannot be undone and all
            associated boards, tasks, and data will be permanently removed.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete}>Delete Project</button>
        </div>
      </div>
    </div>
  );
}