import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import './projects.css';

const COLOR_HEX = {
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#f43f5e',
  purple: '#a855f7',
};

export default function ProjectDetailsModal({ isOpen, onClose, project, onOpenBoard, theme = 'dark' }) {
  const lightCls = theme === 'light' ? ' light' : '';

  if (!isOpen || !project) return null;

  const membersList = Array.isArray(project.members) ? project.members : [project.members].filter(Boolean);
  const dotColor = COLOR_HEX[project.color] || COLOR_HEX.blue;

  const handleOpenBoard = () => {
    onClose();
    if (onOpenBoard) onOpenBoard(project);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-panel${lightCls}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{project.name}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-row">
            <span className="detail-label">Description</span>
            <span className="detail-value">{project.description || '—'}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Owner</span>
            <span className="detail-value">{project.owner}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Members</span>
            <span className="detail-value">{membersList.join(', ')}</span>
          </div>

          {project.createdDate && (
            <div className="detail-row">
              <span className="detail-label">Created</span>
              <span className="detail-value">{project.createdDate}</span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Color Tag</span>
            <div className="detail-color-row">
              <span className="detail-color-dot" style={{ backgroundColor: dotColor }} />
              <span className="detail-value" style={{ textTransform: 'capitalize' }}>{project.color || 'blue'}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={handleOpenBoard}>
            <span>Open Board</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}