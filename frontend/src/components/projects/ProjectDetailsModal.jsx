import { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ChevronDown, ChevronRight, UserPlus, Trash2, Calendar, Search } from 'lucide-react';
import { MOCK_MEMBERS, normalizeMember } from '../../mock/mockMembers';
import '../TaskPopup/TaskPopup.css';
import './projects.css';

const COLOR_HEX = {
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#f43f5e',
  purple: '#a855f7',
};

const Icon = ({ d, size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor"
    strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default function ProjectDetailsModal({ 
  isOpen, 
  onClose, 
  project: propProject, 
  onSaveProject,
  onOpenBoard, 
  theme = 'dark' 
}) {
  const lightCls = theme === 'light' ? ' light' : '';
  const fileInputRef = useRef();

  // Local state initialized from props
  const [project, setProject] = useState(() => ({
    ...propProject,
    members: Array.isArray(propProject?.members) ? propProject.members.map(normalizeMember) : [],
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

  // Member search in members tab
  const [showAddMemberSearch, setShowAddMemberSearch] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const memberSearchWrapRef = useRef(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (propProject) {
      setProject({
        ...propProject,
        members: Array.isArray(propProject.members) ? propProject.members.map(normalizeMember) : [],
        attachments: propProject.attachments || [
          { id: 'a1', name: 'Project Brief', ext: 'PDF', size: '1.2 MB', url: null },
          { id: 'a2', name: 'UI Mockups', ext: 'FIG', size: '14.5 MB', url: null },
        ]
      });
      setIsEditing(false);
    }
  }, [propProject]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isEditing) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isEditing]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (memberSearchWrapRef.current && !memberSearchWrapRef.current.contains(e.target)) {
        setShowAddMemberSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen || !project) return null;

  // Edit functions
  const startEdit = () => {
    setDraft({
      name: project.name,
      description: project.description,
      rawCreatedDate: project.rawCreatedDate || '',
      createdDate: project.createdDate || '',
      rawDueDate: project.rawDueDate || '',
      dueDate: project.dueDate || '',
    });
    setIsEditing(true);
  };

  const saveEdit = () => {
    let formattedCreated = draft.createdDate;
    if (draft.rawCreatedDate && draft.rawCreatedDate.includes('-')) {
      const parts = draft.rawCreatedDate.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(d.getTime())) {
        formattedCreated = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }

    let formattedDue = draft.dueDate;
    if (draft.rawDueDate && draft.rawDueDate.includes('-')) {
      const parts = draft.rawDueDate.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(d.getTime())) {
        formattedDue = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }

    const updated = {
      ...project,
      name: draft.name,
      description: draft.description,
      rawCreatedDate: draft.rawCreatedDate,
      createdDate: formattedCreated,
      rawDueDate: draft.rawDueDate,
      dueDate: formattedDue,
    };

    setProject(updated);
    if (onSaveProject) onSaveProject(updated);
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
    const updated = { ...project, attachments: [...project.attachments, ...newAtts] };
    setProject(updated);
    if (onSaveProject) onSaveProject(updated);
    e.target.value = '';
  };

  const removeAttachment = (attId, e) => {
    e.stopPropagation();
    const updated = { ...project, attachments: project.attachments.filter(a => a.id !== attId) };
    setProject(updated);
    if (onSaveProject) onSaveProject(updated);
  };

  const downloadAtt = att => {
    let downloadUrl = att.url;
    let createdTempUrl = false;

    if (!downloadUrl) {
      const mockContent = `Mock attachment file content for ${att.name}.${att.ext.toLowerCase()}\nProject: ${project.name}\nSize: ${att.size}`;
      const blob = new Blob([mockContent], { type: 'text/plain;charset=utf-8' });
      downloadUrl = URL.createObjectURL(blob);
      createdTempUrl = true;
    }

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${att.name}.${att.ext.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (createdTempUrl) {
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    }
  };

  const downloadAll = () => {
    if (!project.attachments || project.attachments.length === 0) return;
    project.attachments.forEach((att, index) => {
      setTimeout(() => {
        downloadAtt(att);
      }, index * 200);
    });
  };

  // Members functions
  const availableMembers = MOCK_MEMBERS.filter(m => 
    !project.members.some(existing => existing.name === m.name) &&
    (m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
     m.role.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const addMemberToProject = (memberObj) => {
    const normalized = normalizeMember(memberObj);
    if (!project.members.some(m => m.name === normalized.name)) {
      const updated = { ...project, members: [...project.members, normalized] };
      setProject(updated);
      if (onSaveProject) onSaveProject(updated);
    }
    setMemberSearch('');
    setShowAddMemberSearch(false);
  };

  const removeMember = (idx) => {
    const updated = {
      ...project,
      members: project.members.filter((_, i) => i !== idx)
    };
    setProject(updated);
    if (onSaveProject) onSaveProject(updated);
  };

  const progressPercent = project.progress || 0;

  return (
    <div className="popup-backdrop" onClick={() => !isEditing && onClose()}>
      <div className={`popup-panel${lightCls}`} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="popup-header">
          <button className="popup-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2.5} />
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
            {project.description || 'No description provided.'}
          </p>
        )}

        {/* ── Meta Grid ── */}
        <div className="popup-meta-grid" style={{ marginBottom: '24px' }}>
          {/* Created date */}
          <div className="popup-meta-row">
            <div className="popup-meta-label">
              <Calendar size={14} style={{ marginRight: '6px' }} />
              Created date
            </div>
            <div className="popup-meta-val">
              {isEditing ? (
                <input 
                  type="date"
                  className="popup-mini-input popup-mini-input--wide"
                  value={draft.rawCreatedDate || ''}
                  onChange={e => setDraft(d => ({ ...d, rawCreatedDate: e.target.value }))}
                  style={{ colorScheme: theme === 'light' ? 'light' : 'dark' }}
                />
              ) : (
                <span className="popup-meta-text">{project.createdDate || '—'}</span>
              )}
            </div>
          </div>

          {/* Due date */}
          <div className="popup-meta-row">
            <div className="popup-meta-label">
              <Calendar size={14} style={{ marginRight: '6px' }} />
              Due date
            </div>
            <div className="popup-meta-val">
              {isEditing ? (
                <input 
                  type="date"
                  className="popup-mini-input popup-mini-input--wide"
                  value={draft.rawDueDate || ''}
                  onChange={e => setDraft(d => ({ ...d, rawDueDate: e.target.value }))}
                  style={{ colorScheme: theme === 'light' ? 'light' : 'dark' }}
                />
              ) : (
                <span className="popup-meta-text">{project.dueDate || 'Ongoing'}</span>
              )}
            </div>
          </div>

          {/* Progress (Read-only, calculated from tasks & subtasks) */}
          <div className="popup-meta-row">
            <div className="popup-meta-label">
              <Icon d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 2v8l5 3"/>
              Progress
            </div>
            <div className="popup-meta-val popup-meta-val--progress">
              <div className="popup-progress-bar">
                <div className="popup-progress-fill" style={{ width: `${progressPercent}%`, backgroundColor: theme === 'light' ? '#000' : '#fff' }}/>
              </div>
              <span className="popup-progress-label">
                {progressPercent}%
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
            <button className="popup-download-all-btn" onClick={downloadAll} title="Download all project attachments">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download All
            </button>
          </div>

          <div className="popup-att-list">
            {project.attachments && project.attachments.map(att => (
              <div
                key={att.id}
                className="popup-att-card clickable"
                onClick={() => downloadAtt(att)}
                title={`Download ${att.name}`}
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
                  <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" className="popup-att-dl-icon" style={{ flexShrink: 0, position: 'relative', right: 'auto', top: 'auto', opacity: 1, transform: 'none' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
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

            {/* Add file button */}
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
          </div>
        </div>

        <hr className="popup-divider"/>

        {/* Tabs */}
        <div className="popup-tabs" style={{ display: 'flex', gap: '16px', borderBottom: 'var(--popup-divider)', marginBottom: '20px' }}>
          {['tasks', 'members'].map(t => (
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
              {t === 'tasks' ? 'Tasks & Subtasks' : 'Team Members'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="popup-content" style={{ paddingBottom: '20px' }}>
          
          {/* Tasks & Subtasks Tab */}
          {activeTab === 'tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(project.tasks || []).length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--popup-text-muted)', fontSize: '13px' }}>
                  No tasks recorded for this project yet. Open the Project Board to create and manage tasks.
                </div>
              ) : (
                project.tasks.map(t => {
                  const isExpanded = expandedTasks[t.id];
                  const subtasks = t.subtasks || [];
                  return (
                    <div key={t.id} style={{ border: 'var(--popup-card-border)', background: 'var(--popup-card-bg)', borderRadius: '12px', overflow: 'hidden' }}>
                      <div 
                        onClick={() => toggleTask(t.id)}
                        style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: 'var(--popup-checkbox-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.completed ? '#6366f1' : 'transparent' }}>
                            {t.completed && <svg viewBox="0 0 24 24" width={10} height={10} stroke="#fff" strokeWidth="3" fill="none"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <span style={{ fontSize: '14px', color: 'var(--popup-text-main)', textDecoration: t.completed ? 'line-through' : 'none' }}>
                            {t.title}
                          </span>
                        </div>
                        <button style={{ background: 'transparent', border: 'none', color: 'var(--popup-text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </div>
                      {isExpanded && subtasks.length > 0 && (
                        <div style={{ padding: '0 16px 16px 42px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {subtasks.map((sub, idx) => (
                            <div key={sub.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '14px', height: '14px', borderRadius: '3px', border: 'var(--popup-checkbox-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: (sub.done || sub.completed) ? '#6366f1' : 'transparent' }}>
                                {(sub.done || sub.completed) && <svg viewBox="0 0 24 24" width={8} height={8} stroke="#fff" strokeWidth="3" fill="none"><polyline points="20 6 9 17 4 12"/></svg>}
                              </div>
                              <span style={{ fontSize: '13px', color: 'var(--popup-text-label)', textDecoration: (sub.done || sub.completed) ? 'line-through' : 'none' }}>
                                {sub.label || sub.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Members Tab with Member Search & Add */}
          {activeTab === 'members' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--popup-text-main)', fontWeight: '600' }}>{project.members.length} Members</span>
                <button 
                  onClick={() => setShowAddMemberSearch(!showAddMemberSearch)} 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--popup-btn-bg)', border: 'var(--popup-btn-border)', color: 'var(--popup-text-main)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                >
                  <UserPlus size={14} /> Add Member
                </button>
              </div>

              {/* Member Search & Select Dropdown */}
              {showAddMemberSearch && (
                <div ref={memberSearchWrapRef} style={{ position: 'relative', marginBottom: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--popup-text-muted)' }} />
                    <input
                      type="text"
                      className="popup-mini-input"
                      style={{ width: '100%', paddingLeft: '32px', paddingRight: memberSearch ? '32px' : '10px', fontSize: '13px', height: '34px', boxSizing: 'border-box' }}
                      placeholder="Search existing members by name or role..."
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      autoFocus
                    />
                    {memberSearch && (
                      <button
                        type="button"
                        onClick={() => setMemberSearch('')}
                        style={{ position: 'absolute', right: '10px', top: '9px', background: 'transparent', border: 'none', color: 'var(--popup-text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {availableMembers.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
                      maxHeight: '160px', overflowY: 'auto',
                      background: theme === 'light' ? '#ffffff' : '#1a1a24',
                      border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.18)',
                      borderRadius: '8px', boxShadow: '0 12px 32px rgba(0,0,0,0.7)', marginTop: '4px'
                    }}>
                      {availableMembers.map(emp => (
                        <div
                          key={emp.id || emp.name}
                          onClick={() => addMemberToProject(emp)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', cursor: 'pointer',
                            borderBottom: theme === 'light' ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.06)'
                          }}
                        >
                          <div style={{
                            width: '26px', height: '26px', borderRadius: '50%',
                            background: emp.bg || '#3b82f6', color: '#fff',
                            fontSize: '10px', fontWeight: '700',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden'
                          }}>
                            {emp.avatar ? <img src={emp.avatar} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : emp.initials}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>{emp.name}</span>
                            <span style={{ fontSize: '11px', color: theme === 'light' ? '#64748b' : '#94a3b8' }}>{emp.role}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {memberSearch && availableMembers.length === 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99,
                      background: 'var(--popup-card-bg)', border: 'var(--popup-card-border)',
                      borderRadius: '8px', padding: '8px 12px', marginTop: '4px',
                      fontSize: '12px', color: 'var(--popup-text-muted)', textAlign: 'center'
                    }}>
                      No matching team members found
                    </div>
                  )}
                </div>
              )}

              {project.members.map((m, idx) => {
                const norm = normalizeMember(m);
                return (
                  <div key={norm.name || idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--popup-card-bg)', border: 'var(--popup-card-border)', borderRadius: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: norm.bg || COLOR_HEX.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                      {norm.avatar ? <img src={norm.avatar} alt={norm.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (norm.initials || norm.name.substring(0, 2))}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--popup-text-main)' }}>{norm.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--popup-text-muted)' }}>{project.owner === norm.name ? 'Owner' : norm.role || 'Member'}</div>
                    </div>
                    {project.owner !== norm.name && (
                      <button 
                        onClick={() => removeMember(idx)}
                        style={{ background: 'var(--popup-btn-bg)', border: 'var(--popup-btn-border)', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex' }}
                        title="Remove member"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
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