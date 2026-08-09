import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ChevronDown, ChevronRight, Plus, UserPlus, Trash2 } from 'lucide-react';
import '../TaskPopup/TaskPopup.css'; // Inherit styling from TaskPopup
import './projects.css';

const COLOR_HEX = {
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#f43f5e',
  purple: '#a855f7',
};

const DUMMY_TASKS = [
  { id: 't1', title: 'Design Database Schema', done: true, subtasks: [
    { label: 'Users Table', done: true },
    { label: 'Projects Table', done: true },
  ]},
  { id: 't2', title: 'Implement Auth API', done: false, subtasks: [
    { label: 'OAuth2 Integration', done: false },
    { label: 'JWT Setup', done: true },
  ]},
  { id: 't3', title: 'Frontend Dashboard', done: false, subtasks: [
    { label: 'Create UI components', done: false },
    { label: 'Connect to backend', done: false },
  ]}
];

const DUMMY_TIMELINE = [
  { id: 'ts1', text: 'Project Kickoff', date: '01 Aug 2026' },
  { id: 'ts2', text: 'Requirements Finalized', date: '05 Aug 2026' },
  { id: 'ts3', text: 'Initial Design Draft', date: '12 Aug 2026' },
];

const Icon = ({ d, size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor"
    strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default function ProjectDetailsModal({ isOpen, onClose, project: propProject, onOpenBoard, theme = 'dark' }) {
  const lightCls = theme === 'light' ? ' light' : '';
  const fileInputRef = useRef();

  // Local state initialized from props
  const [project, setProject] = useState(() => ({
    ...propProject,
    members: Array.isArray(propProject?.members) ? propProject.members : [],
    attachments: propProject?.attachments || [
      { id: 'a1', name: 'Project Brief', ext: 'PDF', size: '1.2 MB', url: null },
      { id: 'a2', name: 'UI Mockups', ext: 'FIG', size: '14.5 MB', url: null },
    ]
  }));

  const [activeTab, setActiveTab] = useState('tasks');
  const [expandedTasks, setExpandedTasks] = useState({});

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({});

  useEffect(() => {
    // Sync state if a new project is passed in
    if (propProject && propProject.id !== project?.id) {
      setProject({
        ...propProject,
        members: Array.isArray(propProject.members) ? propProject.members : [],
        attachments: propProject.attachments || [
          { id: 'a1', name: 'Project Brief', ext: 'PDF', size: '1.2 MB', url: null },
          { id: 'a2', name: 'UI Mockups', ext: 'FIG', size: '14.5 MB', url: null },
        ]
      });
      setIsEditing(false);
    }
  }, [propProject]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isEditing) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isEditing]);

  if (!isOpen || !project) return null;

  // Edit functions
  const startEdit = () => {
    setDraft({
      name: project.name,
      description: project.description,
      createdDate: project.createdDate,
      dueDate: project.dueDate,
      progress: project.progress || 0,
    });
    setIsEditing(true);
  };

  const saveEdit = () => {
    setProject(p => ({ ...p, ...draft }));
    setIsEditing(false);
  };

  const handleOpenBoard = () => {
    onClose();
    if (onOpenBoard) onOpenBoard(project);
  };

  const toggleTask = (taskId) => {
    setExpandedTasks(p => ({ ...p, [taskId]: !p[taskId] }));
  };

  // Attachment functions
  const handleFileAdd = e => {
    const files = Array.from(e.target.files);
    const newAtts = files.map(f => ({
      id: Date.now() + Math.random(),
      name: f.name.replace(/\.[^.]+$/, ''),
      ext: f.name.split('.').pop().toUpperCase(),
      size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
      url: URL.createObjectURL(f),
    }));
    setProject(p => ({ ...p, attachments: [...p.attachments, ...newAtts] }));
    e.target.value = '';
  };

  const removeAttachment = (attId, e) => {
    e.stopPropagation();
    setProject(p => ({ ...p, attachments: p.attachments.filter(a => a.id !== attId) }));
  };

  const downloadAtt = att => {
    if (!att.url) return;
    const a = document.createElement('a');
    a.href = att.url;
    a.download = `${att.name}.${att.ext.toLowerCase()}`;
    a.click();
  };

  const downloadAll = () => project.attachments.filter(a => a.url).forEach(downloadAtt);

  // Members functions
  const addDummyMember = () => {
    const dummy = { name: 'New Member', initials: 'NM', bg: COLOR_HEX.green };
    setProject(p => ({ ...p, members: [...p.members, dummy] }));
  };

  const removeMember = (idx) => {
    setProject(p => ({
      ...p,
      members: p.members.filter((_, i) => i !== idx)
    }));
  };

  const progressPercent = project.progress || 0;

  return (
    <div className="popup-backdrop" onClick={() => !isEditing && onClose()}>
      <div className={`popup-panel${lightCls}`} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="popup-header">
          <button className="popup-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="popup-header-actions">
            {isEditing ? (
              <>
                <button className="popup-save-btn" onClick={saveEdit}>Save</button>
                <button className="popup-cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
              </>
            ) : (
              <button className="popup-icon-btn" onClick={startEdit} aria-label="Edit">
                <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        {isEditing ? (
          <input
            className="popup-title-input"
            value={draft.name}
            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            style={{ marginBottom: '16px', textAlign: 'center' }}
          />
        ) : (
          <h2 className="popup-title" style={{ textAlign: 'center' }}>{project.name}</h2>
        )}

        {/* Description */}
        {isEditing ? (
          <textarea
            className="popup-desc-textarea"
            value={draft.description || ''}
            onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
            placeholder="Add a detailed description..."
            style={{ marginBottom: '24px' }}
          />
        ) : (
          <p className="popup-description" style={{ 
            marginBottom: '24px', 
            color: 'var(--popup-text-muted)',
            textAlign: 'left',
            background: 'transparent',
            border: 'none',
            padding: '0'
          }}>
            {project.description || 'This is a detailed description preview. Here you can write out the full scope of your project, including key objectives, target audience, technical requirements, and any other relevant context. It provides an at-a-glance summary for team members to quickly understand what the project entails and how they can best contribute to its success.'}
          </p>
        )}

        {/* ── Meta Grid ── */}
        <div className="popup-meta-grid" style={{ marginBottom: '24px' }}>
          {/* Created date */}
          <div className="popup-meta-row">
            <div className="popup-meta-label">
              <Icon d="M3 4h18v2H3zm0 7h18v2H3zm0 7h18v2H3z"/>
              Created date
            </div>
            <div className="popup-meta-val">
              {isEditing ? (
                <input className="popup-mini-input popup-mini-input--wide"
                  value={draft.createdDate || ''}
                  onChange={e => setDraft(d => ({ ...d, createdDate: e.target.value }))}
                  placeholder="e.g. 01 Aug 2026"
                />
              ) : (
                <span className="popup-meta-text">{project.createdDate || '—'}</span>
              )}
            </div>
          </div>

          {/* Due date */}
          <div className="popup-meta-row">
            <div className="popup-meta-label">
              <Icon d="M3 4h18v2H3zm0 7h18v2H3zm0 7h18v2H3z"/>
              Due date
            </div>
            <div className="popup-meta-val">
              {isEditing ? (
                <input className="popup-mini-input popup-mini-input--wide"
                  value={draft.dueDate || ''}
                  onChange={e => setDraft(d => ({ ...d, dueDate: e.target.value }))}
                  placeholder="e.g. 30 Aug 2026"
                />
              ) : (
                <span className="popup-meta-text">{project.dueDate || 'Ongoing'}</span>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="popup-meta-row">
            <div className="popup-meta-label">
              <Icon d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 2v8l5 3"/>
              Progress
            </div>
            <div className="popup-meta-val popup-meta-val--progress">
              {isEditing ? (
                <input type="range" min="0" max="100"
                  className="popup-progress-range"
                  value={draft.progress}
                  onChange={e => setDraft(d => ({ ...d, progress: +e.target.value }))}
                />
              ) : (
                <div className="popup-progress-bar">
                  <div className="popup-progress-fill" style={{ width: `${progressPercent}%`, backgroundColor: theme === 'light' ? '#000' : '#fff' }}/>
                </div>
              )}
              <span className="popup-progress-label">
                {isEditing ? draft.progress : progressPercent}%
              </span>
            </div>
          </div>
        </div>

        <hr className="popup-divider"/>

        {/* ── Attachments ── */}
        <div className="popup-att-section">
          <div className="popup-att-header">
            <span className="popup-att-title">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              Attachments
            </span>
            <button className="popup-download-all-btn" onClick={downloadAll}>
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download All
            </button>
          </div>

          <div className="popup-att-list">
            {project.attachments.map(att => (
              <div
                key={att.id}
                className={`popup-att-card ${att.url ? 'clickable' : ''}`}
                onClick={() => downloadAtt(att)}
                title={att.url ? `Download ${att.name}` : 'No file attached'}
                style={{ position: 'relative' }}
              >
                <div className="popup-att-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div className="popup-att-info">
                  <span className="popup-att-name">{att.name}</span>
                  <span className="popup-att-meta">{att.ext} • {att.size}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                  {att.url && (
                    <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" className="popup-att-dl-icon" style={{ flexShrink: 0, position: 'relative', right: 'auto', top: 'auto', opacity: 1, transform: 'none' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  )}
                  {isEditing && (
                    <button 
                      onClick={(e) => removeAttachment(att.id, e)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex' }}
                      title="Remove attachment"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add button */}
            {isEditing && (
              <>
                <button
                  className="popup-att-add-btn"
                  onClick={() => fileInputRef.current.click()}
                  title="Add attachment"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={handleFileAdd}
                />
              </>
            )}
          </div>
        </div>

        <hr className="popup-divider"/>

        {/* Tabs */}
        <div className="popup-tabs" style={{ display: 'flex', gap: '16px', borderBottom: 'var(--popup-divider)', marginBottom: '20px' }}>
          {['tasks', 'members', 'timeline'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === t ? '2px solid var(--popup-text-main)' : '2px solid transparent',
                color: activeTab === t ? 'var(--popup-text-heading)' : 'var(--popup-tab-inactive)',
                padding: '0 4px 10px',
                fontSize: '14px',
                fontWeight: activeTab === t ? '600' : '500',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}
            >
              {t === 'tasks' ? 'All Tasks' : t === 'members' ? 'Team Members' : 'Timeline'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="popup-content" style={{ paddingBottom: '20px' }}>
          
          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {DUMMY_TASKS.map(t => {
                const isExpanded = expandedTasks[t.id];
                return (
                  <div key={t.id} style={{ border: 'var(--popup-card-border)', background: 'var(--popup-card-bg)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div 
                      onClick={() => toggleTask(t.id)}
                      style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: 'var(--popup-checkbox-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.done ? '#6366f1' : 'transparent' }}>
                          {t.done && <svg viewBox="0 0 24 24" width={10} height={10} stroke="#fff" strokeWidth="3" fill="none"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <span style={{ fontSize: '14px', color: 'var(--popup-text-main)', textDecoration: t.done ? 'line-through' : 'none' }}>
                          {t.title}
                        </span>
                      </div>
                      <button style={{ background: 'transparent', border: 'none', color: 'var(--popup-text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>
                    {isExpanded && t.subtasks.length > 0 && (
                      <div style={{ padding: '0 16px 16px 42px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {t.subtasks.map((sub, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '3px', border: 'var(--popup-checkbox-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: sub.done ? '#6366f1' : 'transparent' }}>
                              {sub.done && <svg viewBox="0 0 24 24" width={8} height={8} stroke="#fff" strokeWidth="3" fill="none"><polyline points="20 6 9 17 4 12"/></svg>}
                            </div>
                            <span style={{ fontSize: '13px', color: 'var(--popup-text-label)', textDecoration: sub.done ? 'line-through' : 'none' }}>
                              {sub.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--popup-text-main)', fontWeight: '600' }}>{project.members.length} Members</span>
                {isEditing && (
                  <button onClick={addDummyMember} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--popup-btn-bg)', border: 'var(--popup-btn-border)', color: 'var(--popup-text-main)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
                    <UserPlus size={14} /> Add Member
                  </button>
                )}
              </div>
              {project.members.map((m, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--popup-card-bg)', border: 'var(--popup-card-border)', borderRadius: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: m.bg || COLOR_HEX.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                    {m.avatar ? <img src={m.avatar} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (m.initials || m.name.substring(0, 2))}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--popup-text-main)' }}>{m.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--popup-text-muted)' }}>{project.owner === m.name ? 'Owner' : 'Member'}</div>
                  </div>
                  {isEditing && project.owner !== m.name && (
                    <button 
                      onClick={() => removeMember(idx)}
                      style={{ background: 'var(--popup-btn-bg)', border: 'var(--popup-btn-border)', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex' }}
                      title="Remove member"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '8px', paddingTop: '8px' }}>
              {DUMMY_TIMELINE.map((item, idx) => (
                <div key={item.id} style={{ display: 'flex', gap: '16px', position: 'relative', paddingBottom: idx === DUMMY_TIMELINE.length - 1 ? '0' : '32px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#6366f1', zIndex: 1 }} />
                    {idx !== DUMMY_TIMELINE.length - 1 && (
                      <div style={{ position: 'absolute', top: '12px', bottom: '0', left: '5px', width: '2px', background: 'var(--popup-divider)' }} />
                    )}
                  </div>
                  <div style={{ marginTop: '-4px' }}>
                    <div style={{ fontSize: '14px', color: 'var(--popup-text-main)', fontWeight: '500' }}>{item.text}</div>
                    <div style={{ fontSize: '12px', color: 'var(--popup-text-muted)', marginTop: '4px' }}>{item.date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: 'var(--popup-divider)' }}>
          <button className="popup-save-btn" onClick={handleOpenBoard} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Open Project Board</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}