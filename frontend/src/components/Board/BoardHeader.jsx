import { useState } from 'react';
import './BoardHeader.css';

export default function BoardHeader({ projectName = 'Travel apps' }) {
  const [activeSubTab, setActiveSubTab] = useState('Board');

  const subTabs = ['Board', 'Timeline', 'Team Info'];

  return (
    <div className="board-header-container">
      {/* Top Bar: Breadcrumb */}
      <div className="board-header-top">
        <div className="board-breadcrumb">
          <span className="breadcrumb-root">Project</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{projectName}</span>
        </div>
      </div>

      {/* Main Title & Team Avatars */}
      <div className="board-title-row">
        <div className="board-title-group">
          <h1 className="board-main-title">{projectName}</h1>
          <button className="info-icon-btn" title="Project Info">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>
        </div>

        <div className="board-team-group">
          <div className="team-avatars-stack">
            <div className="avatar-circle av-1">SC</div>
            <div className="avatar-circle av-2">JD</div>
            <div className="avatar-circle av-3">AK</div>
          </div>
          <button className="invite-member-btn" title="Add Member">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Metadata Row: Priority, Deadline, Tags */}
      <div className="board-metadata-row">
        <div className="meta-item">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
          </svg>
          <span className="meta-label">Priority:</span>
          <span className="priority-badge">Normal</span>
        </div>

        <div className="meta-item">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span className="meta-label">Deadline:</span>
          <span className="meta-value">30 December 2023</span>
        </div>

        <div className="meta-item">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
          <span className="meta-label">Tags:</span>
          <div className="tags-list">
            <span className="tag-pill tag-blue">UI Design</span>
            <span className="tag-pill tag-purple">UX Design</span>
            <button className="add-tag-btn">+ Add more</button>
          </div>
        </div>
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
