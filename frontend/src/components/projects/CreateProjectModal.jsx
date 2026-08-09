import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar } from 'lucide-react';
import '../TaskPopup/TaskPopup.css'; // Inherit styling from TaskPopup
import './projects.css';

const COLOR_OPTIONS = [
  { key: 'blue', hex: '#3b82f6' },
  { key: 'green', hex: '#10b981' },
  { key: 'yellow', hex: '#f59e0b' },
  { key: 'red', hex: '#f43f5e' },
  { key: 'purple', hex: '#a855f7' },
];

function formatToday() {
  const d = new Date();
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CreateProjectModal({ isOpen, onClose, onCreate, theme = 'dark' }) {
  const lightCls = theme === 'light' ? ' light' : '';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [projectImage, setProjectImage] = useState(null);
  const [documents, setDocuments] = useState([]);
  
  const imageInputRef = React.useRef();
  const docInputRef = React.useRef();

  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState([]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [tasks, setTasks] = useState([]); // { id, title, subtasks: [{ id, title }] }
  const [newSubtaskTitles, setNewSubtaskTitles] = useState({}); // { taskId: 'subtask title' }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setDescription('');
    setDueDate('');
    setProjectImage(null);
    setDocuments([]);
    setMemberEmail('');
    setMembers([]);
    setNewTaskTitle('');
    setTasks([]);
    setNewSubtaskTitles({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProjectImage(URL.createObjectURL(e.target.files[0]));
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

  const handleSubmit = () => {
    if (!name.trim()) return;

    // A real app would get owner from auth context
    const owner = 'Me';

    const newProject = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      owner,
      members: members.length > 0 ? members : [owner],
      createdDate: formatToday(),
      dueDate: dueDate.trim() || undefined,
      image: projectImage,
      documents,
      status: 'Planning',
      progress: 0,
      tasks: tasks // Add tasks if the backend/store supports it
    };

    onCreate(newProject);
    resetForm();
    onClose();
  };

  // --- Member Handlers ---
  const handleAddMember = (e) => {
    e.preventDefault();
    const email = memberEmail.trim();
    if (email && !members.includes(email)) {
      setMembers([...members, email]);
      setMemberEmail('');
    }
  };

  const removeMember = (email) => {
    setMembers(members.filter(m => m !== email));
  };

  // --- Task Handlers ---
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
          />

          {/* Description */}
          <textarea
            className="popup-desc-textarea"
            placeholder="Add a detailed description..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ marginBottom: '24px', minHeight: '100px' }}
          />

          {/* Meta Grid for Due Date, Image, and Docs */}
          <div className="popup-meta-grid" style={{ marginBottom: '32px' }}>
            <div className="popup-meta-row">
              <div className="popup-meta-label">
                <Calendar size={14} style={{ marginRight: '6px' }} />
                Due date
              </div>
              <div className="popup-meta-val">
                <input 
                  className="popup-mini-input popup-mini-input--wide"
                  placeholder="e.g. 30 Aug 2026"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="popup-meta-row">
              <div className="popup-meta-label">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" style={{ marginRight: '6px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                Project Image
              </div>
              <div className="popup-meta-val">
                <input type="file" hidden ref={imageInputRef} onChange={handleImageUpload} accept="image/*" />
                <button 
                  className="popup-save-btn" 
                  onClick={() => imageInputRef.current.click()}
                  style={{ padding: '4px 10px', fontSize: '12px', background: 'var(--popup-btn-bg)', color: 'var(--popup-text-main)', border: 'var(--popup-btn-border)' }}
                >
                  {projectImage ? 'Change Image' : 'Upload Image'}
                </button>
              </div>
            </div>

            <div className="popup-meta-row">
              <div className="popup-meta-label">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" style={{ marginRight: '6px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                Documents
              </div>
              <div className="popup-meta-val" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="file" hidden ref={docInputRef} onChange={handleDocUpload} multiple />
                <button 
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

          {/* Team Members Section */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '14px', color: 'var(--popup-text-heading)', marginBottom: '12px', fontWeight: '600' }}>Team Members</h4>
            <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
              <input
                className="popup-mini-input"
                style={{ fontSize: '13px', padding: '0 12px', flex: 1, fontWeight: '400', height: '34px', margin: 0, boxSizing: 'border-box' }}
                placeholder="Enter email address..."
                value={memberEmail}
                onChange={e => setMemberEmail(e.target.value)}
                type="email"
              />
              <button 
                type="submit" 
                className="popup-save-btn" 
                style={{ padding: '0 16px', background: 'var(--popup-btn-bg)', color: 'var(--popup-text-main)', border: 'var(--popup-btn-border)', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
                disabled={!memberEmail.trim()}
              >
                Add
              </button>
            </form>
            
            {members.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {members.map(m => (
                  <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--popup-card-bg)', padding: '8px 12px', borderRadius: '8px', border: 'var(--popup-card-border)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--popup-text-main)' }}>{m}</span>
                    <button 
                      onClick={() => removeMember(m)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="popup-divider" style={{ margin: '0 -20px 24px' }}/>

          {/* Tasks & Subtasks Section */}
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