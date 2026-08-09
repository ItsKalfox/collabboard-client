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

  const membersList = Array.isArray(project.members) ? project.members : [];
  const progressPercent = project.progress || 0;

  const handleCardClick = () => {
    if (onOpenBoard) {
      onOpenBoard(project);
    } else {
      onViewDetails(project);
    }
  };

  return (
    <div
      className={`${isDark ? 'glass-card' : 'glass-card-light'} pc-list-card${lightCls}`}
      onClick={handleCardClick}
    >
      {/* 1. Thumbnail Image */}
      <div className="pc-list-image-container">
        {project.coverImage ? (
          <img src={project.coverImage} alt={project.name} className="pc-list-image" />
        ) : (
          <div className="pc-list-image-placeholder" style={{ backgroundColor: COLOR_HEX[project.color] || COLOR_HEX.blue }} />
        )}
      </div>

      {/* 2. Project Info */}
      <div className="pc-list-info">
        <h3 className={`pc-list-title${lightCls}`}>{project.name}</h3>
        <p className={`pc-list-desc${lightCls}`}>{project.description}</p>
      </div>

      {/* 3. Progress Bar */}
      <div className="pc-list-progress-section">
        <div className="pc-list-progress-header">
          <span className={`pc-list-progress-label${lightCls}`}>Progress</span>
          <span className={`pc-list-progress-percent${lightCls}`}>{progressPercent}%</span>
        </div>
        <div className={`pc-list-progress-track${lightCls}`}>
          <div 
            className="pc-list-progress-fill"
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: isDark ? '#ffffff' : '#000000' 
            }} 
          />
        </div>
      </div>

      {/* 4. Owner */}
      <div className="pc-list-meta">
        <span className={`pc-list-meta-label${lightCls}`}>Owner</span>
        <span className={`pc-list-meta-value${lightCls}`}>{project.owner}</span>
      </div>

      {/* 5. Date */}
      <div className="pc-list-meta">
        <span className={`pc-list-meta-label${lightCls}`}>Created</span>
        <span className={`pc-list-meta-value${lightCls}`}>{project.createdDate}</span>
      </div>

      {/* 6. Members (Overlapping Chips) */}
      <div className="pc-list-members">
        {membersList.slice(0, 4).map((member, idx) => (
          <div
            key={idx}
            className={`pc-list-avatar${lightCls}`}
            style={{ backgroundColor: member.bg || COLOR_HEX.blue, zIndex: 10 - idx }}
            title={member.name}
          >
            {member.avatar ? (
              <img src={member.avatar} alt={member.name} />
            ) : (
              member.initials || member.name?.substring(0, 2) || '?'
            )}
          </div>
        ))}
        {membersList.length > 4 && (
          <div className={`pc-list-avatar-more${lightCls}`} style={{ zIndex: 1 }}>
            +{membersList.length - 4}
          </div>
        )}
      </div>

      {/* 7. Actions */}
      <div className="pc-list-actions" ref={menuRef} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`pc-list-menu-btn${lightCls}`}
          title="Options"
          id={`options-btn-${project.id}`}
        >
          <MoreVertical size={18} />
        </button>

        {showMenu && (
          <div className={`${isDark ? 'glass-menu' : 'glass-menu-light'} pc-list-menu animate-modal`}>
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
  );
}