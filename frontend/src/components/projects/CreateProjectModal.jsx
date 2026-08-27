import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Trash2, Calendar, Search, AlertCircle } from 'lucide-react';
import { normalizeMember, getInitials } from '../../utils/memberUtils';
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
  const [validationErrors, setValidationErrors] = useState({});
  
  const imageInputRef = useRef();
  const docInputRef = useRef();
  const titleInputRef = useRef();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (titleInputRef.current) titleInputRef.current.focus();
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  // Member search state connected to API
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [members, setMembers] = useState([]); // List of normalized member objects
  const memberSearchWrapRef = useRef(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('low');
  const [newTaskAssignee, setNewTaskAssignee] = useState(''); // Stores assignee ID or name
  const [showTaskAssigneeDropdown, setShowTaskAssigneeDropdown] = useState(false);
  const taskAssigneeDropdownRef = useRef(null);
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
    setNewTaskDescription('');
    setNewTaskPriority('low');
    setNewTaskAssignee('');
    setTasks([]);
    setError('');
    setValidationErrors({});
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (taskAssigneeDropdownRef.current && !taskAssigneeDropdownRef.current.contains(e.target)) {
        setShowTaskAssigneeDropdown(false);
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

  const ownerName = typeof currentUser === 'string' ? currentUser : (currentUser?.name || 'Alex Johnson');

  // Filter API search results based on existing selected members
  const availableMembers = searchResults.filter(user => {
    // Exclude owner
    if (user.name && user.name.toLowerCase() === ownerName.toLowerCase()) return false;
    if (user.email && currentUser?.email && user.email.toLowerCase() === currentUser.email.toLowerCase()) return false;
    
    // Exclude already added members
    return !members.some(existing => 
      (existing.id && String(existing.id) === String(user.id)) ||
      (existing.userId && String(existing.userId) === String(user.id)) ||
      (existing.name && user.name && existing.name.toLowerCase() === user.name.toLowerCase()) ||
      (existing.email && user.email && existing.email.toLowerCase() === user.email.toLowerCase())
    )
  });

  const addMember = (memberObj) => {
    const normalized = normalizeMember(memberObj);
    if (!members.some(m => (m.id && m.id === normalized.id) || m.name === normalized.name)) {
      setMembers(prev => [...prev, { ...normalized, reviewAccess: false }]);
    }
    setMemberSearch('');
    setShowMemberDropdown(false);
  };

  const removeMember = (memberName) => {
    setMembers(members.filter(m => m.name !== memberName));
  };

  const toggleReviewAccess = (memberName) => {
    setMembers(members.map(m => m.name === memberName ? { ...m, reviewAccess: !m.reviewAccess } : m));
  };

  const getTodayYYYYMMDD = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const errors = {};
    if (!name.trim()) errors.name = 'Required';
    if (!description.trim()) errors.description = 'Required';
    if (!dueDate) errors.dueDate = 'Required';
    const hasPendingTask = newTaskTitle.trim() || newTaskDescription.trim();
    if (tasks.length === 0 && !hasPendingTask) {
      errors.tasks = 'At least 1 initial task with title and description is required';
    } else if (hasPendingTask) {
      if (!newTaskTitle.trim() || !newTaskDescription.trim()) {
        errors.tasks = 'Both title and description are required for a task';
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});

    const todayStr = getTodayYYYYMMDD();
    if (dueDate && dueDate < todayStr) {
      setError('Due date cannot precede the creation date.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const ownerMember = normalizeMember(ownerName);

      // Ensure owner is included in members list
      let finalMembers = [...members];
      if (!finalMembers.some(m => m.name === ownerName)) {
        finalMembers.unshift(ownerMember);
      }

      // Auto-commit any pending task in fields
      let finalTasks = [...tasks];
      if (newTaskTitle.trim() && newTaskDescription.trim()) {
        finalTasks.push({ id: `t-${Date.now()}`, title: newTaskTitle.trim(), description: newTaskDescription.trim(), priority: newTaskPriority, assigneeId: newTaskAssignee, subtasks: [] });
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
          role: m.name === ownerName ? 'owner' : 'member'
        })),
        tasks: finalTasks.map(t => ({
          title: t.title,
          description: t.description || '',
          priority: t.priority || 'medium',
          status: 'todo',
          assigneeId: t.assigneeId || undefined,
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
    const description = newTaskDescription.trim();
    if (!title || !description) {
      setValidationErrors(prev => ({ ...prev, tasks: 'Both task title and description are required' }));
      return;
    }
    
    // Default assignee to currentUser if none selected
    const finalAssigneeId = newTaskAssignee || currentUser?.id;
    
    setTasks([...tasks, { id: `t-${Date.now()}`, title, description, priority: newTaskPriority, assigneeId: finalAssigneeId, subtasks: [] }]);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('low');
    setNewTaskAssignee('');
    if (validationErrors.tasks) setValidationErrors(prev => ({ ...prev, tasks: null }));
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
            {validationErrors.name && <span style={{color: '#ef4444', fontSize: '11px', fontWeight: '600', alignSelf: 'flex-start', marginLeft: '4px'}}>* Required</span>}
            <input
              ref={titleInputRef}
              className="popup-title-input"
              placeholder="Project Name..."
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (validationErrors.name) setValidationErrors(prev => ({ ...prev, name: null }));
              }}
              style={{ marginBottom: 0, textAlign: 'center', borderColor: validationErrors.name ? '#ef4444' : undefined }}
            />
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
            {validationErrors.description && <span style={{color: '#ef4444', fontSize: '11px', fontWeight: '600', alignSelf: 'flex-start', marginLeft: '4px'}}>* Required</span>}
            <textarea
              className="popup-desc-textarea"
              placeholder="Add a detailed description..."
              value={description}
              onChange={e => {
                setDescription(e.target.value);
                if (validationErrors.description) setValidationErrors(prev => ({ ...prev, description: null }));
              }}
              style={{ marginBottom: 0, minHeight: '90px', borderColor: validationErrors.description ? '#ef4444' : undefined }}
            />
          </div>

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
              <div className="popup-meta-val" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="date"
                  className="popup-mini-input popup-mini-input--wide"
                  value={dueDate}
                  min={getTodayYYYYMMDD()}
                  onChange={e => {
                    setDueDate(e.target.value);
                    if (error) setError('');
                    if (validationErrors.dueDate) setValidationErrors(prev => ({ ...prev, dueDate: null }));
                  }}
                  style={{ colorScheme: theme === 'light' ? 'light' : 'dark', borderColor: validationErrors.dueDate ? '#ef4444' : undefined }}
                />
                {validationErrors.dueDate && <span style={{color: '#ef4444', fontSize: '11px', fontWeight: '600'}}>* Required</span>}
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
                          {emp.avatar ? <img src={emp.avatar} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (emp.initials || getInitials(emp.name))}
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

            {/* Selected Members Cards / List */}
            {members.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', marginTop: '8px' }}>
                {members.map(m => (
                  <div key={m.name} className="member-card">
                    <div className="member-card-left">
                      <div className="member-card-avatar" style={{ background: m.bg || '#3b82f6' }}>
                        {m.avatar ? <img src={m.avatar} alt={m.name} /> : m.initials}
                      </div>
                      <div className="member-card-info">
                        <span className="member-card-name">{m.name}</span>
                        <span className="member-card-role">{m.role || 'Member'}</span>
                      </div>
                    </div>
                    <div className="member-card-right">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="review-access-label">Review Access</span>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={!!m.reviewAccess}
                            onChange={() => toggleReviewAccess(m.name)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeMember(m.name)}
                        className="member-card-remove"
                        title="Remove Member"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="popup-divider" style={{ margin: '0 -20px 24px' }}/>

          {/* Initial Tasks Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '14px', color: 'var(--popup-text-heading)', margin: 0, fontWeight: '600' }}>Initial Tasks</h4>
              {validationErrors.tasks && <span style={{color: '#ef4444', fontSize: '11px', fontWeight: '600'}}>* {validationErrors.tasks}</span>}
            </div>
            
            <div className="popup-add-subtask-bar" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px', padding: '12px', background: 'var(--bg-sec)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <input
                  className="popup-add-subtask-input"
                  placeholder="Task title…"
                  value={newTaskTitle}
                  onChange={e => {
                    setNewTaskTitle(e.target.value);
                    if (validationErrors.tasks) setValidationErrors(prev => ({ ...prev, tasks: null }));
                  }}
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'inherit', textAlign: 'left', fontFamily: 'inherit' }}
                />
              </div>
              <textarea
                placeholder="Task description…"
                value={newTaskDescription}
                onChange={e => {
                  setNewTaskDescription(e.target.value);
                  if (validationErrors.tasks) setValidationErrors(prev => ({ ...prev, tasks: null }));
                }}
                style={{ width: '100%', minHeight: '60px', background: 'var(--popup-input-bg)', border: 'var(--popup-input-border)', borderRadius: '6px', padding: '10px', color: 'var(--popup-input-text)', resize: 'vertical', fontFamily: 'inherit', textAlign: 'left', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setNewTaskPriority('low')} style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '12px', border: newTaskPriority === 'low' ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--popup-btn-border)', background: newTaskPriority === 'low' ? 'rgba(16, 185, 129, 0.15)' : 'transparent', color: newTaskPriority === 'low' ? '#10b981' : 'var(--popup-text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>Low Priority</button>
                  <button type="button" onClick={() => setNewTaskPriority('medium')} style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '12px', border: newTaskPriority === 'medium' ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--popup-btn-border)', background: newTaskPriority === 'medium' ? 'rgba(245, 158, 11, 0.15)' : 'transparent', color: newTaskPriority === 'medium' ? '#f59e0b' : 'var(--popup-text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>Medium Priority</button>
                  <button type="button" onClick={() => setNewTaskPriority('high')} style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '12px', border: newTaskPriority === 'high' ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--popup-btn-border)', background: newTaskPriority === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'transparent', color: newTaskPriority === 'high' ? '#ef4444' : 'var(--popup-text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>High Priority</button>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }} ref={taskAssigneeDropdownRef}>
                    <div 
                      onClick={() => setShowTaskAssigneeDropdown(!showTaskAssigneeDropdown)}
                      style={{ background: 'var(--popup-btn-bg)', border: 'var(--popup-btn-border)', color: 'var(--popup-text-main)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px' }}
                    >
                      {(() => {
                        const currentUserName = typeof currentUser === 'string' ? currentUser : currentUser?.name || 'You';
                        const currentUserId = typeof currentUser === 'object' && currentUser?.id ? currentUser.id : currentUserName;
                        
                        if (!newTaskAssignee) return <span>Assignee (Default: You)</span>;
                        const isOwner = String(newTaskAssignee) === String(currentUserId);
                        if (isOwner) {
                          return (
                            <>
                              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '8px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                                {currentUser?.avatar ? <img src={currentUser.avatar} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : getInitials(currentUserName)}
                              </div>
                              <span>{currentUserName} (You)</span>
                            </>
                          );
                        }
                        const assignee = members.find(m => String(m.id || m.userId || m.name) === String(newTaskAssignee));
                        if (assignee) {
                          return (
                            <>
                              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: assignee.bg || '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '8px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                                {assignee.avatar ? <img src={assignee.avatar} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : assignee.initials || getInitials(assignee.name)}
                              </div>
                              <span>{assignee.name}</span>
                            </>
                          );
                        }
                        return <span>Assignee (Default: You)</span>;
                      })()}
                    </div>
                    {showTaskAssigneeDropdown && (
                      <div style={{ position: 'absolute', bottom: '100%', left: 0, width: '220px', background: document.documentElement.getAttribute('data-theme') !== 'light' ? '#101016' : '#ffffff', border: '1px solid var(--popup-border, #cbd5e1)', borderRadius: '8px', boxShadow: 'var(--popup-shadow, 0 -4px 12px rgba(0,0,0,0.3))', zIndex: 999, marginBottom: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                        <div 
                          onClick={() => { 
                            const currentUserName = typeof currentUser === 'string' ? currentUser : currentUser?.name || 'You';
                            const currentUserId = typeof currentUser === 'object' && currentUser?.id ? currentUser.id : currentUserName;
                            setNewTaskAssignee(currentUserId); 
                            setShowTaskAssigneeDropdown(false); 
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--popup-divider, #cbd5e1)', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--popup-btn-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                            {currentUser?.avatar ? <img src={currentUser.avatar} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : getInitials(typeof currentUser === 'string' ? currentUser : currentUser?.name || 'You')}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--popup-text-main, #1e293b)' }}>{typeof currentUser === 'string' ? currentUser : currentUser?.name || 'You'} (You)</span>
                          </div>
                        </div>
                        {members.map(m => (
                          <div 
                            key={m.id || m.userId || m.name}
                            onClick={() => { setNewTaskAssignee(m.id || m.userId || m.name); setShowTaskAssigneeDropdown(false); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--popup-divider, #cbd5e1)', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--popup-btn-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: m.bg || '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                              {m.avatar ? <img src={m.avatar} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : m.initials || getInitials(m.name)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--popup-text-main, #1e293b)' }}>{m.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="button" className="popup-add-subtask-btn" onClick={handleAddTask} style={{ background: 'var(--popup-btn-bg)', border: 'var(--popup-btn-border)', color: 'var(--popup-text-main)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    Add Task
                  </button>
                </div>
              </div>
            </div>

            {tasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tasks.map(t => (
                  <div key={t.id} style={{ background: 'var(--popup-card-bg)', border: 'var(--popup-card-border)', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, paddingRight: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--popup-text-main)' }}>{t.title}</span>
                        {t.priority && (
                          <span style={{
                            padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
                            background: t.priority === 'low' ? 'rgba(16, 185, 129, 0.15)' : t.priority === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: t.priority === 'low' ? '#10b981' : t.priority === 'high' ? '#ef4444' : '#f59e0b',
                            border: t.priority === 'low' ? '1px solid rgba(16, 185, 129, 0.3)' : t.priority === 'high' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                          }}>
                            {t.priority}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--popup-text-muted)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{t.description}</span>
                      {t.assigneeId && (
                        <div style={{ fontSize: '11px', color: 'var(--popup-text-muted)', marginTop: '4px' }}>
                          Assigned to: {t.assigneeId === (typeof currentUser === 'object' ? currentUser?.id : (typeof currentUser === 'string' ? currentUser : 'You')) ? 'You' : members.find(m => m.id === t.assigneeId || m.userId === t.assigneeId || m.name === t.assigneeId)?.name || 'Unknown'}
                        </div>
                      )}
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeTask(t.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', marginTop: '2px' }}
                      title="Remove task"
                    >
                      <Trash2 size={16} />
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
          <button className="popup-save-btn" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating Project...' : 'Create Project'}
          </button>
        </div>

      </div>
    </div>
  );
}