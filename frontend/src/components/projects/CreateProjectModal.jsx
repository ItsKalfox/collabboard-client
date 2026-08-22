import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Trash2, Calendar, Search, AlertCircle } from 'lucide-react';
import { normalizeMember } from '../../mock/mockMembers';
import { createProject, uploadCoverImage, uploadAttachment, searchUsers } from '../../services/projectService';
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
  const [imageFile, setImageFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docFiles, setDocFiles] = useState([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const imageInputRef = useRef();
  const docInputRef = useRef();

  // Member search state connected to API
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [members, setMembers] = useState([]); // List of normalized member objects
  const memberSearchWrapRef = useRef(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [tasks, setTasks] = useState([]);

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setDueDate('');
    setProjectImage(null);
    setImageFile(null);
    setDocuments([]);
    setDocFiles([]);
    setMemberSearch('');
    setSearchResults([]);
    setSearchError('');
    setMembers([]);
    setNewTaskTitle('');
    setTasks([]);
    setError('');
    setIsSubmitting(false);
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

  // Debounced search for users via GET /api/users/search?q={query}
  useEffect(() => {
    if (!memberSearch || !memberSearch.trim()) {
      setSearchResults([]);
      setIsSearchingUsers(false);
      setSearchError('');
      return;
    }

    let isMounted = true;
    setIsSearchingUsers(true);
    setSearchError('');

    const searchTimer = setTimeout(() => {
      searchUsers(memberSearch)
        .then(users => {
          if (isMounted) {
            setSearchResults(users || []);
          }
        })
        .catch(err => {
          if (isMounted) {
            console.warn('User search error:', err.message);
            setSearchError(err.message || 'Failed to search users');
            setSearchResults([]);
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsSearchingUsers(false);
          }
        });
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(searchTimer);
    };
  }, [memberSearch]);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setProjectImage(imageUrl);
    }
  };

  const handleDocUpload = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setDocFiles(prev => [...prev, ...filesArray]);
      const newDocs = filesArray.map(f => ({
        name: f.name,
        size: (f.size / 1024 / 1024).toFixed(2) + ' MB'
      }));
      setDocuments(prev => [...prev, ...newDocs]);
    }
  };

  // Filter API search results based on existing selected members
  const availableMembers = searchResults.filter(user => 
    !members.some(existing => 
      (existing.id && String(existing.id) === String(user.id)) ||
      (existing.userId && String(existing.userId) === String(user.id)) ||
      (existing.name && user.name && existing.name.toLowerCase() === user.name.toLowerCase()) ||
      (existing.email && user.email && existing.email.toLowerCase() === user.email.toLowerCase())
    )
  );

  const addMember = (memberObj) => {
    const normalized = normalizeMember(memberObj);
    if (!members.some(m => (m.id && m.id === normalized.id) || m.name === normalized.name)) {
      setMembers(prev => [...prev, normalized]);
    }
    setMemberSearch('');
    setShowMemberDropdown(false);
  };

  const removeMember = (memberName) => {
    setMembers(members.filter(m => m.name !== memberName));
  };

  const getTodayYYYYMMDD = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    if (!name.trim() || isSubmitting) return;

    const todayStr = getTodayYYYYMMDD();
    if (dueDate && dueDate < todayStr) {
      setError('Due date cannot precede the creation date.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Owner is automatically current logged-in user
      const ownerName = typeof currentUser === 'string' ? currentUser : (currentUser?.name || 'Alex Johnson');
      const ownerMember = normalizeMember(ownerName);

      // Ensure owner is included in members list
      let finalMembers = [...members];
      if (!finalMembers.some(m => m.name === ownerName)) {
        finalMembers.unshift(ownerMember);
      }

      // Auto-commit any pending task title in newTaskTitle field
      let finalTasks = [...tasks];
      if (newTaskTitle.trim()) {
        finalTasks.push({ id: `t-${Date.now()}`, title: newTaskTitle.trim(), subtasks: [] });
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

      // Prepare project data for backend API POST /projects
      const projectPayload = {
        name: name.trim(),
        description: description.trim(),
        status: 'active',
        dueDate: dueDate || null,
        members: finalMembers.map(m => ({
          userId: m.id || m.userId || (m.name === ownerName ? (currentUser?.id || undefined) : undefined),
          name: m.name,
          email: m.email || undefined,
          role: m.role || 'member'
        })),
        tasks: finalTasks.map(t => ({
          title: t.title,
          status: 'todo',
          subtasks: t.subtasks || []
        }))
      };

      // Call backend API POST /projects
      const createdProject = await createProject(projectPayload);

      let finalCoverImage = createdProject?.coverImage || null;

      // If a cover image file was selected, upload it to /api/projects/:id/cover-image
      if (imageFile && createdProject?.id) {
        try {
          finalCoverImage = await uploadCoverImage(createdProject.id, imageFile);
        } catch (imgErr) {
          console.warn('Cover image upload warning:', imgErr.message);
        }
      }

      // If document attachments were selected, upload them to /api/projects/:id/attachments
      if (docFiles.length > 0 && createdProject?.id) {
        for (const docFile of docFiles) {
          try {
            await uploadAttachment(createdProject.id, docFile);
          } catch (docErr) {
            console.warn('Attachment upload warning:', docErr.message);
          }
        }
      }

      const createdToday = new Date(createdProject?.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      // Assemble final project with backend response as the base
      const projectForUI = {
        ...createdProject,
        id: createdProject?.id || `proj-${Date.now()}`,
        name: createdProject?.name || name.trim(),
        description: createdProject?.description || description.trim(),
        owner: ownerName,
        ownerId: createdProject?.ownerId || currentUser?.id,
        members: finalMembers,
        createdDate: createdToday,
        dueDate: formattedDueDate || undefined,
        rawDueDate: dueDate,
        coverImage: finalCoverImage || projectImage,
        image: finalCoverImage || projectImage,
        documents: documents,
        status: createdProject?.status || 'active',
        progress: 0,
        tasks: finalTasks
      };

      onCreate(projectForUI);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: theme === 'light' ? '#b91c1c' : '#fca5a5',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

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
                  min={getTodayYYYYMMDD()}
                  onChange={e => {
                    setDueDate(e.target.value);
                    if (error) setError('');
                  }}
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

              {showMemberDropdown && memberSearch.trim() && (
                <div className="member-dropdown" style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0, right: 0,
                  zIndex: 999,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  background: theme === 'light' ? '#ffffff' : '#1a1a24',
                  border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.18)',
                  borderRadius: '8px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
                  marginTop: '4px'
                }}>
                  {isSearchingUsers ? (
                    <div style={{ padding: '12px', fontSize: '13px', color: 'var(--popup-text-muted)', textAlign: 'center' }}>
                      Searching users...
                    </div>
                  ) : availableMembers.length === 0 ? (
                    <div style={{ padding: '12px', fontSize: '13px', color: 'var(--popup-text-muted)', textAlign: 'center' }}>
                      No matching users found
                    </div>
                  ) : (
                    availableMembers.map(emp => (
                      <div
                        key={emp.id || emp._id || emp.email}
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
                          color: '#fff', fontSize: '11px', fontWeight: '700', overflow: 'hidden', flexShrink: 0
                        }}>
                          {emp.avatar ? <img src={emp.avatar} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (emp.initials || (emp.name ? emp.name.slice(0, 2).toUpperCase() : 'U'))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: theme === 'light' ? '#0f172a' : '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{emp.name}</span>
                          <span style={{ fontSize: '11px', color: theme === 'light' ? '#64748b' : '#94a3b8' }}>{emp.role || emp.email}</span>
                        </div>
                      </div>
                    ))
                  )}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tasks.map(t => (
                  <div key={t.id} style={{ background: 'var(--popup-card-bg)', border: 'var(--popup-card-border)', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--popup-text-main)' }}>{t.title}</span>
                    <button 
                      type="button"
                      onClick={() => removeTask(t.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      title="Remove task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: 'var(--popup-divider)' }}>
          <button className="popup-cancel-btn" onClick={handleClose} disabled={isSubmitting}>Cancel</button>
          <button className="popup-save-btn" onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>
            {isSubmitting ? 'Creating Project...' : 'Create Project'}
          </button>
        </div>

      </div>
    </div>
  );
}