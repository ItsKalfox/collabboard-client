import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { normalizeMember, getInitials } from '../../utils/memberUtils';
import { getAttachments } from '../../services/projectService';
import { useSocket } from '../../context/SocketContext';
import './BoardHeader.css';

const COLOR_HEX = {
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#f43f5e',
  purple: '#a855f7',
};

export default function BoardHeader({ 
  project = {}, 
  onAddTask, 
  onAddMember, 
  onAddTag, 
  onInfoClick,
  activeSubTab = 'Board',
  onSubTabChange
}) {
  const { isConnected, connectionState, socket } = useSocket() || { isConnected: false, connectionState: 'disconnected' };
  const [projectMembers, setProjectMembers] = useState([]);
  const [projectAttachments, setProjectAttachments] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);

  const subTabs = ['Board', 'Timeline', 'Activity'];

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

    const fetchAttachmentsData = async () => {
      try {
        const atts = await getAttachments(projectId);
        setProjectAttachments(atts);
      } catch (err) {
        console.error('Failed to fetch attachments:', err);
      }
    };

    fetchMembers();
    fetchAttachmentsData();
  }, [projectId, project]);

  useEffect(() => {
    if (socket) {
      const handleActiveUsers = (users) => {
        setActiveUsers(users);
      };
      
      socket.on('active_users', handleActiveUsers);
      return () => {
        socket.off('active_users', handleActiveUsers);
      };
    }
  }, [socket]);

  const displayTags = [category, status === 'active' ? 'Active' : 'Archived', ...(tags || [])];
  
  let displayDeadline = 'Ongoing';
  if (project.dueDate) {
    const d = new Date(project.dueDate);
    displayDeadline = !isNaN(d.getTime()) ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : project.dueDate;
  } else if (createdAt) {
    displayDeadline = new Date(createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  
  const displayPriority = 'Normal';

  return (
    <div className="board-header-container">
      {/* TOP ROW: Title, Deadline, Avatars, Add Task */}
      <div className="board-title-row" style={{ alignItems: 'flex-start', margin: 0 }}>
        
        {/* LEFT: Title */}
        <div className="board-title-group" style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
          <h1 className="board-main-title">{name}</h1>
          <div 
            title={
              connectionState === 'connected' ? "Connected to live sync" : 
              connectionState === 'reconnecting' ? "Reconnecting..." : "Disconnected"
            }
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: connectionState === 'connected' ? '#10b981' : 
                               connectionState === 'reconnecting' ? '#f59e0b' : '#f43f5e',
              boxShadow: connectionState === 'connected' ? '0 0 8px #10b981' : 
                         connectionState === 'reconnecting' ? '0 0 8px #f59e0b' : 'none',
              transition: 'background-color 0.3s, box-shadow 0.3s'
            }}
          />
        </div>

        {/* RIGHT: Deadline, Avatars, Add Task */}
        <div className="board-team-group" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'nowrap' }}>
          {/* Deadline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary, #6b7280)', whiteSpace: 'nowrap', flexShrink: 0 }}>
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
              {projectMembers.map(normalizeMember).slice(0, 4).map((member, idx, arr) => {
                const isActive = activeUsers.some(u => {
                  const uId = typeof u === 'object' ? (u.userId || u.id || u._id) : u;
                  const mId = member.userId || member.id || member._id;
                  return uId && mId && String(uId) === String(mId);
                });
                
                return (
                  <div
                    key={idx}
                    className="pc-list-avatar"
                    style={{ backgroundColor: member.avatar ? 'transparent' : (member.bg || COLOR_HEX.blue), zIndex: idx, marginLeft: idx !== arr.length - 1 ? '-10px' : '0', position: 'relative' }}
                  >
                    <div className="avatar-inner">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} />
                      ) : (
                        member.initials || getInitials(member.name)
                      )}
                    </div>
                    {isActive && (
                      <div style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#10b981',
                        border: '2px solid white',
                        borderRadius: '50%',
                        zIndex: 2
                      }} title="Active now" />
                    )}
                    <div className="custom-avatar-tooltip">
                      <div className="tooltip-avatar" style={{ backgroundColor: member.bg || COLOR_HEX.blue }}>
                        {member.avatar ? <img src={member.avatar} alt="" /> : (member.initials || getInitials(member.name))}
                      </div>
                      <div className="tooltip-info">
                        <span className="name">{member.name} {isActive && '(Active)'}</span>
                        <span className="email">{member.email || member.role || 'Member'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '-8px', marginBottom: '-8px' }}>
        <div style={{ flex: 1, paddingRight: '16px' }}>
          {description && (
            <div style={{
               fontSize: '13px', color: 'var(--text-dim, #6b7280)', 
               display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', 
               overflow: 'hidden', textOverflow: 'ellipsis',
               lineHeight: '1.5', textAlign: 'left',
               marginBottom: '12px'
            }}>
              {description}
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              className="view-project-btn" 
              onClick={onInfoClick} 
              style={{ 
                cursor: 'pointer', 
                background: document.documentElement.getAttribute('data-theme') !== 'light' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', 
                border: '1px solid var(--border-color, rgba(128,128,128,0.2))', 
                color: 'var(--text-secondary)', 
                padding: '4px 14px', 
                borderRadius: '20px', 
                fontSize: '12px', 
                fontWeight: '500', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = document.documentElement.getAttribute('data-theme') !== 'light' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = document.documentElement.getAttribute('data-theme') !== 'light' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
            >
              View Project
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary, #9ca3af)', fontSize: '13px', fontWeight: '500' }}>
              <span>{projectMembers.length} {projectMembers.length === 1 ? 'Member' : 'Members'}</span>
              <span>•</span>
              {(() => {
                const docCount = projectAttachments.length;
                if (docCount === 0) return <span>No Documents</span>;
                return <span>{docCount} {docCount === 1 ? 'Document' : 'Documents'}</span>;
              })()}
            </div>
          </div>
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
              onClick={() => onSubTabChange && onSubTabChange(tab)}
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
