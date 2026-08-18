import { useState, useEffect } from 'react';
import './BoardHeader.css';

export default function BoardHeader({ project = {}, onAddTask, onAddMember }) {
  const [activeSubTab, setActiveSubTab] = useState('Board');
  const [projectMembers, setProjectMembers] = useState([]);

  const subTabs = ['Board', 'Timeline', 'Team Info'];

  const { 
    id: projectId,
    name = 'Unknown Project', 
    description = '', 
    category = 'General',
    status = 'active',
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
          setProjectMembers(data.data?.members || []);
        }
      } catch (err) {
        console.error('Failed to fetch members:', err);
      }
    };
    fetchMembers();
  }, [projectId]);

  const displayTags = [category, status === 'active' ? 'Active' : 'Archived'];
  const displayDeadline = createdAt ? new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Ongoing';
  const displayPriority = 'Normal';

  return (
    <div className="board-header-container">
      {/* Main Title & Team Avatars */}
      <div className="board-title-row">
        <div className="board-title-group">
          <h1 className="board-main-title">{name}</h1>
          <button className="info-icon-btn" title={description || 'Project Info'}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>
        </div>

        <div className="board-team-group">
          <div className="team-avatars-stack">
            {projectMembers.map((m, idx) => (
              <div key={idx} className={`avatar-circle av-${(idx % 3) + 1}`} title={m.name}>
                {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
              </div>
            ))}
          </div>
          <button className="invite-member-btn" title="Add Member" onClick={onAddMember}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Metadata Row & Add New Task Button */}
      <div className="board-metadata-row">
        <div className="metadata-left-items">
          <div className="meta-item">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
            <span className="meta-label">Priority:</span>
            <span className="priority-badge">{displayPriority}</span>
          </div>

          <div className="meta-item">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span className="meta-label">Deadline:</span>
            <span className="meta-value">{displayDeadline}</span>
          </div>

          <div className="meta-item">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            <span className="meta-label">Tags:</span>
            <div className="tags-list">
              {displayTags.map((tag, idx) => (
                <span key={idx} className={`tag-pill tag-${idx % 2 === 0 ? 'blue' : 'purple'}`}>
                  {tag}
                </span>
              ))}
              <button className="add-tag-btn">+ Add more</button>
            </div>
          </div>
        </div>

        <button className="add-task-header-btn" onClick={onAddTask}>
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
