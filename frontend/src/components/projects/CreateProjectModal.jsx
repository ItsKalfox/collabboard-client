import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Trash2, Calendar, Search } from 'lucide-react';
import { MOCK_MEMBERS, normalizeMember } from '../../mock/mockMembers';
import '../TaskPopup/TaskPopup.css';
import './projects.css';

export default function CreateProjectModal({ 
  isOpen, 
  onClose, 
  onCreate, 
  theme = 'dark',
  currentUser = 'Alex Johnson'
}) {
  const lightCls = theme === 'light' ? ' light' : '';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [projectImage, setProjectImage] = useState(null);
  const [documents, setDocuments] = useState([]);
  
  const imageInputRef = useRef();
  const docInputRef = useRef();

  // Member search state
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [members, setMembers] = useState([]); // List of normalized member objects
  const memberSearchWrapRef = useRef(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newSubtaskTitles, setNewSubtaskTitles] = useState({});

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setDueDate('');
    setProjectImage(null);
    setDocuments([]);
    setMemberSearch('');
    setMembers([]);
    setNewTaskTitle('');
    setTasks([]);
    setNewSubtaskTitles({});
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (memberSearchWrapRef.current && !memberSearchWrapRef.current.contains(e.target)) {
        setShowMemberDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setProjectImage(imageUrl);
    }
  };

  const handleDocUpload = (e) => {
    if (e.target.files) {
      const newDocs = Array.from(e.target.files).map(f => ({
        name: f.name,
        size: (f.size / 1024 / 1024).toFixed(2) + ' MB'
      }));
      setDocuments([...documents, ...newDocs]);
    }
  };

  // Filter available members based on search and existing selected members
  const availableMembers = MOCK_MEMBERS.filter(m => 
    !members.some(existing => existing.name === m.name) &&
    (m.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
     m.role.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const addMember = (memberObj) => {
    const normalized = normalizeMember(memberObj);
    if (!members.some(m => m.name === normalized.name)) {
      setMembers([...members, normalized]);
    }
    setMemberSearch('');
    setShowMemberDropdown(false);
  };

  const removeMember = (memberName) => {
    setMembers(members.filter(m => m.name !== memberName));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    // Owner is automatically current logged-in user
    const ownerName = typeof currentUser === 'string' ? currentUser : (currentUser?.name || 'Alex Johnson');
    const ownerMember = normalizeMember(ownerName);

    // Ensure owner is included in members list
    let finalMembers = [...members];
    if (!finalMembers.some(m => m.name === ownerName)) {
      finalMembers.unshift(ownerMember);
    }

    // Format display date if date picker date is provided (e.g. YYYY-MM-DD -> DD MMM YYYY)
    let formattedDueDate = dueDate;
    if (dueDate && dueDate.includes('-')) {
      const parts = dueDate.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(d.getTime())) {
        formattedDueDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }

    const createdToday = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const newProject = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      owner: ownerName,
      members: finalMembers,
      createdDate: createdToday,
      dueDate: formattedDueDate || undefined,
      rawDueDate: dueDate,
      coverImage: projectImage,
      image: projectImage,
      documents,
      status: 'Planning',
      progress: 0,
      tasks: tasks
    };

    onCreate(newProject);
    resetForm();
    onClose();
  };

  // Task Handlers
  const handleAddTask = (e) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (title) {
      setTasks([...tasks, { id: `t-${Date.now()}`, title, subtasks: [] }]);
      setNewTaskTitle('');
    }
  };

  const removeTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    const newSubTitles = { ...newSubtaskTitles };
    delete newSubTitles[taskId];
    setNewSubtaskTitles(newSubTitles);
  };

  const handleAddSubtask = (e, taskId) => {
    e.preventDefault();
    const title = (newSubtaskTitles[taskId] || '').trim();
    if (title) {
      setTasks(tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, subtasks: [...t.subtasks, { id: `s-${Date.now()}`, title }] };
        }
        return t;
      }));
      setNewSubtaskTitles({ ...newSubtaskTitles, [taskId]: '' });
    }
  };

  const removeSubtask = (taskId, subtaskId) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) };
      }
      return t;
    }));
  };

  return (
    <div className="popup-backdrop" onClick={handleClose}>
      <div className={`popup-panel${lightCls}`} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="popup-header">
          <button className="popup-close-btn" onClick={handleClose} aria-label="Close">
            <X size={16} strokeWidth={2.5} />
          </button>
          <div className="popup-header-actions">
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--popup-text-muted)' }}>Create Project</span>
          </div>
        </div>

        <div className="popup-content" style={{ overflowY: 'auto', padding: '0 20px 20px', maxHeight: 'calc(100vh - 140px)' }}>
          {/* Title */}
          <input
            className="popup-title-input"
            placeholder="Project Name..."
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ marginBottom: '16px', textAlign: 'center' }}
            autoFocus
          />

          {/* Description */}
          <textarea
            className="popup-desc-textarea"
            placeholder="Add a detailed description..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ marginBottom: '24px', minHeight: '90px' }}
          />

          {/* Image Preview if available */}
          {projectImage && (
            <div style={{ marginBottom: '20px', textAlign: 'center', position: 'relative' }}>
              <div style={{
                position: 'relative',
                width: '100%',
                maxHeight: '180px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                <img 
                  src={projectImage} 
                  alt="Project Preview" 
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                />
                <button
                  onClick={() => setProjectImage(null)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.7)',
                    border: 'none',
                    borderRadius: '50%',
                    color: '#fff',
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex'
                  }}
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Meta Grid for Due Date, Image, and Docs */}
          <div className="popup-meta-grid" style={{ marginBottom: '24px' }}>
            {/* Due Date with Calendar Date Picker */}
            <div className="popup-meta-row">
              <div className="popup-meta-label">
                <Calendar size={14} style={{ marginRight: '6px' }} />
                Due date
              </div>
              <div className="popup-meta-val">
                <input 
                  type="date"
                  className="popup-mini-input popup-mini-input--wide"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  style={{ colorScheme: theme === 'light' ? 'light' : 'dark' }}
                />
              </div>
            </div>
            
            {/* Project Image */}
            <div className="popup-meta-row">
              <div className="popup-meta-label">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" style={{ marginRight: '6px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                Project Image
              </div>
              <div className="popup-meta-val">
                <input type="file" hidden ref={imageInputRef} onChange={handleImageUpload} accept="image/*" />
                <button 
                  type="button"
                  className="popup-save-btn" 
                  onClick={() => imageInputRef.current.click()}
                  style={{ padding: '4px 10px', fontSize: '12px', background: 'var(--popup-btn-bg)', color: 'var(--popup-text-main)', border: 'var(--popup-btn-border)' }}
                >
                  {projectImage ? 'Change Image' : 'Upload Image'}
                </button>
              </div>
            </div>

            {/* Documents */}
            <div className="popup-meta-row">
              <div className="popup-meta-label">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" style={{ marginRight: '6px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                Documents
              </div>
              <div className="popup-meta-val" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="file" hidden ref={docInputRef} onChange={handleDocUpload} multiple />
                <button 
                  type="button"
                  className="popup-save-btn" 
                  onClick={() => docInputRef.current.click()}
                  style={{ padding: '4px 10px', fontSize: '12px', background: 'var(--popup-btn-bg)', color: 'var(--popup-text-main)', border: 'var(--popup-btn-border)' }}
                >
                  Upload Docs
                </button>
                {documents.length > 0 && <span style={{ fontSize: '12px', color: 'var(--popup-text-muted)' }}>{documents.length} added</span>}
              </div>
            </div>
          </div>

          <hr className="popup-divider" style={{ margin: '0 -20px 24px' }}/>

          {/* Team Members Section - Search & Select from Existing Members */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', color: 'var(--popup-text-heading)', marginBottom: '12px', fontWeight: '600' }}>Add Team Members</h4>
            
            <div className="member-picker" ref={memberSearchWrapRef} style={{ position: 'relative', marginBottom: '16px' }}>
              <div className="member-search-wrap" style={{ position: 'relative' }}>
                <Search size={14} className="member-search-icon" style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--popup-text-muted)' }} />
                <input
                  type="text"
                  className="popup-mini-input"
                  style={{ width: '100%', paddingLeft: '32px', paddingRight: memberSearch ? '32px' : '10px', fontSize: '13px', height: '34px', boxSizing: 'border-box' }}
                  placeholder="Search existing members by name or role..."
                  value={memberSearch}
                  onChange={e => {
                    setMemberSearch(e.target.value);
                    setShowMemberDropdown(true);
                  }}
                  onFocus={() => setShowMemberDropdown(true)}
                />
                {memberSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setMemberSearch('');
                      setShowMemberDropdown(false);
                    }}
                    style={{ position: 'absolute', right: '10px', top: '9px', background: 'transparent', border: 'none', color: 'var(--popup-text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {showMemberDropdown && availableMembers.length > 0 && (
                <div className="member-dropdown" style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0, right: 0,
                  zIndex: 999,
                  maxHeight: '180px',
                  overflowY: 'auto',
                  background: theme === 'light' ? '#ffffff' : '#1a1a24',
                  border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.18)',
                  borderRadius: '8px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
                  marginTop: '4px'
                }}>
                  {availableMembers.map(emp => (
                    <div
                      key={emp.id}
                      onClick={() => addMember(emp)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: theme === 'light' ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.06)',
                        transition: 'background 0.15s'
                      }}
                      className="member-dropdown-item"
                    >
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: emp.bg || '#3b82f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '11px', fontWeight: '700', overflow: 'hidden'
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

              {showMemberDropdown && memberSearch && availableMembers.length === 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
                  background: theme === 'light' ? '#ffffff' : '#1a1a24',
                  border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.18)',
                  borderRadius: '8px', padding: '10px 12px', marginTop: '4px',
                  fontSize: '12px', color: theme === 'light' ? '#64748b' : '#94a3b8', textAlign: 'center',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.7)'
                }}>
                  No matching team members found
                </div>
              )}
            </div>

            {/* Selected Members Chips / List */}
            {members.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {members.map(m => (
                  <div key={m.name} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'var(--popup-card-bg)', padding: '4px 10px 4px 6px',
                    borderRadius: '20px', border: 'var(--popup-card-border)'
                  }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: m.bg || '#3b82f6', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '10px', fontWeight: '700', overflow: 'hidden'
                    }}>
                      {m.avatar ? <img src={m.avatar} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.initials}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--popup-text-main)', fontWeight: '500' }}>{m.name}</span>
                    <button 
                      type="button"
                      onClick={() => removeMember(m.name)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', display: 'flex' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="popup-divider" style={{ margin: '0 -20px 24px' }}/>

          {/* Initial Tasks Section */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', color: 'var(--popup-text-heading)', marginBottom: '12px', fontWeight: '600' }}>Initial Tasks</h4>
            <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
              <input
                className="popup-mini-input"
                style={{ fontSize: '13px', padding: '0 12px', flex: 1, fontWeight: '400', height: '34px', margin: 0, boxSizing: 'border-box' }}
                placeholder="Task title..."
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
              />
              <button 
                type="submit" 
                className="popup-save-btn" 
                style={{ padding: '0 16px', background: 'var(--popup-btn-bg)', color: 'var(--popup-text-main)', border: 'var(--popup-btn-border)', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
                disabled={!newTaskTitle.trim()}
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </form>

            {tasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {tasks.map(t => (
                  <div key={t.id} style={{ background: 'var(--popup-card-bg)', border: 'var(--popup-card-border)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--popup-text-main)' }}>{t.title}</span>
                      <button 
                        type="button"
                        onClick={() => removeTask(t.id)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Subtasks */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px', paddingLeft: '12px', borderLeft: '2px solid var(--popup-divider)' }}>
                      {t.subtasks.map(s => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: 'var(--popup-text-muted)' }}>{s.title}</span>
                          <button 
                            type="button"
                            onClick={() => removeSubtask(t.id, s.id)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      
                      <form onSubmit={(e) => handleAddSubtask(e, t.id)} style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                        <input
                          className="popup-mini-input"
                          style={{ fontSize: '12px', padding: '0 8px', flex: 1, fontWeight: '400', height: '30px', margin: 0, boxSizing: 'border-box' }}
                          placeholder="Add subtask..."
                          value={newSubtaskTitles[t.id] || ''}
                          onChange={e => setNewSubtaskTitles({ ...newSubtaskTitles, [t.id]: e.target.value })}
                        />
                        <button 
                          type="submit" 
                          className="popup-save-btn"
                          style={{ background: 'var(--popup-btn-bg)', border: 'var(--popup-btn-border)', color: 'var(--popup-text-main)', cursor: 'pointer', padding: '0 12px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
                          disabled={!(newSubtaskTitles[t.id] || '').trim()}
                        >
                          <Plus size={14} strokeWidth={2.5} />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: 'var(--popup-divider)' }}>
          <button className="popup-cancel-btn" onClick={handleClose}>Cancel</button>
          <button className="popup-save-btn" onClick={handleSubmit} disabled={!name.trim()}>
            Create Project
          </button>
        </div>

      </div>
    </div>
  );
}