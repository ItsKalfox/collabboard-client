import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { normalizeMember, getInitials } from '../../mock/mockMembers';
import './BoardHeader.css';

const COLOR_HEX = {
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#f43f5e',
  purple: '#a855f7',
};

export default function BoardHeader({ project = {}, onAddTask, onAddMember, onAddTag, onInfoClick }) {
  const [activeSubTab, setActiveSubTab] = useState('Board');
  const [projectMembers, setProjectMembers] = useState([]);

  const subTabs = ['Board', 'Timeline', 'Team Info'];

  const { 
    id: projectId,
    name = 'Unknown Project', 
    description = '', 
    category = 'General',
    status = 'active',
    tags = [],
    createdAt 
  } = project;

  useEffect(() => {
    if (!projectId) return;
    const fetchMembers = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/projects/${projectId}/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const membersList = data.data?.members || [];
          if (membersList.length > 0) {
            setProjectMembers(membersList);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch members:', err);
      }
      
      if (Array.isArray(project.members) && project.members.length > 0) {
        setProjectMembers(project.members.map(m => typeof m === 'string' ? { name: m } : m));
      } else {
        setProjectMembers([]);
      }
    };
    fetchMembers();
  }, [projectId, project]);

  const displayTags = [category, status === 'active' ? 'Active' : 'Archived', ...(tags || [])];
  const displayDeadline = project.dueDate || (createdAt ? new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Ongoing');
  const displayPriority = 'Normal';

  return (
    <div className="board-header-container">
      {/* TOP ROW: Title, Deadline, Avatars, Add Task */}
      <div className="board-title-row" style={{ alignItems: 'flex-start', margin: 0 }}>
        
        {/* LEFT: Title & Info Icon */}
        <div className="board-title-group" style={{ alignItems: 'center' }}>
          <h1 className="board-main-title">{name}</h1>
          <button className="info-icon-btn" title={description || 'Project Info'} onClick={onInfoClick} style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-secondary, #6b7280)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={18} strokeWidth={2} />
          </button>
        </div>

        {/* RIGHT: Deadline, Avatars, Add Task */}
        <div className="board-team-group" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Deadline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary, #6b7280)' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: '500' }}>Deadline:</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary, #111)' }}>{displayDeadline}</span>
          </div>

          {/* Avatars */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="pc-list-members" style={{ marginRight: '16px', display: 'flex', flexDirection: 'row-reverse' }}>
              {projectMembers.map(normalizeMember).slice(0, 4).map((member, idx, arr) => (
                <div
                  key={idx}
                  className="pc-list-avatar"
                  style={{ backgroundColor: member.avatar ? 'transparent' : (member.bg || COLOR_HEX.blue), zIndex: idx, marginLeft: idx !== arr.length - 1 ? '-10px' : '0' }}
                >
                  <div className="avatar-inner">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} />
                    ) : (
                      member.initials || getInitials(member.name)
                    )}
                  </div>
                  <div className="custom-avatar-tooltip">
                    <div className="tooltip-avatar" style={{ backgroundColor: member.bg || COLOR_HEX.blue }}>
                      {member.avatar ? <img src={member.avatar} alt="" /> : (member.initials || getInitials(member.name))}
                    </div>
                    <div className="tooltip-info">
                      <span className="name">{member.name}</span>
                      <span className="email">{member.email || member.role || 'Member'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {projectMembers.length > 4 && (
                <div className="pc-list-avatar-more" style={{ zIndex: 10 }}>
                  +{projectMembers.length - 4}
                </div>
              )}
            </div>
            <button className="invite-member-btn" title="Add Member" onClick={onAddMember}>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* SECOND ROW: Description & Add Task Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '-8px', marginBottom: '8px' }}>
        <div style={{ flex: 1, paddingRight: '16px' }}>
          {description && (
            <div style={{
               fontSize: '13px', color: 'var(--text-dim, #6b7280)', 
               display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', 
               overflow: 'hidden', textOverflow: 'ellipsis',
               lineHeight: '1.5', textAlign: 'left'
            }}>
              {description}
            </div>
          )}
        </div>
        
        <button className="add-task-header-btn" onClick={onAddTask} style={{ margin: 0, flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add new task</span>
        </button>
      </div>



      {/* Sub-Tabs Bar: Board, Timeline, Team Info */}
      <div className="board-subtabs-bar">
        <div className="subtabs-list">
          {subTabs.map((tab) => (
            <button
              key={tab}
              className={`subtab-btn ${activeSubTab === tab ? 'active' : ''}`}
              onClick={() => setActiveSubTab(tab)}
            >
              {tab}
              {activeSubTab === tab && <div className="subtab-active-indicator" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
