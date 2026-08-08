import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Info, Trash2, ArrowRight } from 'lucide-react';

const COLOR_HEX = {
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#f43f5e',
  purple: '#a855f7',
};

export default function ProjectCard({
  project,
  theme = 'dark',
  onEdit,
  onDelete,
  onViewDetails,
  onOpenBoard,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const isDark = theme !== 'light';
  const lightCls = isDark ? '' : ' light';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const membersList = Array.isArray(project.members) ? project.members : [project.members];
  const dotColor = COLOR_HEX[project.color] || COLOR_HEX.blue;

const handleCardClick = () => {
  // this up to navigate to the Kanban board for this project.

  if (onOpenBoard) {
    onOpenBoard(project);
  } else {
    onViewDetails(project);
  }
};

  return (
    <div
      className={`${isDark ? 'glass-card' : 'glass-card-light'} pc-card${lightCls}`}
      onClick={handleCardClick}
    >
      <div>
        {/* Header: color dot + name + 3-dot menu */}
        <div className="pc-header">
          <div className="pc-title-wrap">
            <span className="pc-color-dot" style={{ backgroundColor: dotColor }} />
            <h3 className={`pc-title${lightCls}`}>{project.name}</h3>
          </div>

          <div className="pc-menu-wrap" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`pc-menu-btn${lightCls}`}
              title="Options"
              id={`options-btn-${project.id}`}
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div className={`${isDark ? 'glass-menu' : 'glass-menu-light'} pc-menu animate-modal`}>
                <button
                  onClick={() => { setShowMenu(false); onEdit(project); }}
                  className={`pc-menu-item${lightCls}`}
                >
                  <Edit2 size={14} /> Edit Project
                </button>
                <button
                  onClick={() => { setShowMenu(false); onViewDetails(project); }}
                  className={`pc-menu-item${lightCls}`}
                >
                  <Info size={14} /> Project Details
                </button>
                <div className={`pc-menu-divider${lightCls}`} />
                <button
                  onClick={() => { setShowMenu(false); onDelete(project); }}
                  className={`pc-menu-item pc-menu-item-danger${lightCls}`}
                >
                  <Trash2 size={14} /> Delete Project
                </button>
              </div>
            )}
          </div>
        </div>

        <p className={`pc-desc${lightCls}`}>{project.description}</p>

        <div className={`pc-divider${lightCls}`} />

        <div className="pc-info-stack">
          <div className="pc-info-row">
            <span className="pc-info-label">Owner</span>
            <span className={`pc-info-value${lightCls}`}>{project.owner}</span>
          </div>
          <div className="pc-info-row">
            <span className="pc-info-label">Members</span>
            <span className={`pc-info-value${lightCls}`}>{membersList.join(', ')}</span>
          </div>
          {project.createdDate && (
            <div className="pc-info-row">
              <span className="pc-info-label">Created</span>
              <span className={`pc-info-value${lightCls}`}>{project.createdDate}</span>
            </div>
          )}
        </div>
      </div>

      <div className={`pc-footer${lightCls}`}>
        <span className={`pc-footer-text${lightCls}`}>Click to Open Board</span>
        <ArrowRight size={16} className="pc-footer-arrow" />
      </div>
    </div>
  );
}