import { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ChevronDown, ChevronRight, UserPlus, Trash2, Calendar, Search, AlertCircle, Loader2, RefreshCw, Clock, CheckSquare } from 'lucide-react';
import { MOCK_MEMBERS, normalizeMember } from '../../mock/mockMembers';
import { uploadCoverImage, getAttachments, uploadAttachment, deleteAttachment, getProjectMembers, searchUsers, addProjectMember, removeProjectMember, getProjectTasks, getProjectTimeline, refreshProjectTimeline, downloadAttachment } from '../../services/projectService';
import DeleteConfirmModal from './DeleteConfirmModal';
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
  onDeleteProject,
  onOpenBoard, 
  onEdit,
  theme = 'dark' 
}) {
  const lightCls = theme === 'light' ? ' light' : '';
  const fileInputRef = useRef();
  const coverImageInputRef = useRef();

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState('');
  const [isUploadingAtt, setIsUploadingAtt] = useState(false);
  const [deletingAttId, setDeletingAttId] = useState(null);
  const [downloadingAttId, setDownloadingAttId] = useState(null);
  const [attachmentError, setAttachmentError] = useState('');

  const formatAttachment = (att) => {
    const filename = att.filename || att.name || 'document';
    const ext = att.ext || (filename.includes('.') ? filename.split('.').pop().toUpperCase() : 'FILE');
    const name = att.filename ? filename.replace(/\.[^.]+$/, '') : (att.name || filename);
    let sizeStr = '—';
    if (typeof att.size === 'number') {
      sizeStr = att.size > 1024 * 1024 
        ? (att.size / (1024 * 1024)).toFixed(2) + ' MB' 
        : (att.size / 1024).toFixed(1) + ' KB';
    } else if (typeof att.size === 'string') {
      sizeStr = att.size;
    }

    return {
      id: att.id,
      name,
      ext,
      size: sizeStr,
      url: att.url,
      filename: filename
    };
  };

  // Local state initialized from props
  const [project, setProject] = useState(() => ({
    ...propProject,
    members: Array.isArray(propProject?.members) ? propProject.members.map(normalizeMember) : [],
    attachments: Array.isArray(propProject?.attachments) ? propProject.attachments.map(formatAttachment) : []
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

  // API State for members loading, user search, and member removal
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [membersError, setMembersError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState('');

  // API State for Tasks and Activity Timeline
  const [apiTasks, setApiTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState('');

  const [apiTimeline, setApiTimeline] = useState([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [isRefreshingTimeline, setIsRefreshingTimeline] = useState(false);
  const [timelineError, setTimelineError] = useState('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (propProject && isOpen) {
      setProject({
        ...propProject,
        members: Array.isArray(propProject.members) ? propProject.members.map(normalizeMember) : [],
        attachments: Array.isArray(propProject.attachments) ? propProject.attachments.map(formatAttachment) : []
      });
      setIsEditing(false);
      setAttachmentError('');
      setCoverError('');
      setMembersError('');
      setSearchError('');
      setMemberSearch('');
      setSearchResults([]);

      setTasksError('');
      setTimelineError('');
      setApiTasks([]);
      setApiTimeline([]);
      setLastRefreshedAt(null);

      // Fetch live attachments from backend API
      if (propProject.id) {
        getAttachments(propProject.id)
          .then(apiAtts => {
            if (Array.isArray(apiAtts)) {
              const formatted = apiAtts.map(formatAttachment);
              setProject(prev => ({
                ...prev,
                attachments: formatted
              }));
            }
          })
          .catch(err => {
            console.warn('Could not fetch attachments from API:', err.message);
          });

        // Fetch live project members via GET /api/projects/:id/members
        setIsLoadingMembers(true);
        getProjectMembers(propProject.id)
          .then(membersData => {
            if (Array.isArray(membersData)) {
              const formatted = membersData.map(normalizeMember);
              setProject(prev => ({
                ...prev,
                members: formatted
              }));
            }
          })
          .catch(err => {
            console.warn('Could not fetch members from API:', err.message);
            setMembersError(err.message || 'Failed to load project members');
          })
          .finally(() => {
            setIsLoadingMembers(false);
          });

        // Fetch live project tasks via GET /api/projects/:id/tasks
        setIsLoadingTasks(true);
        getProjectTasks(propProject.id)
          .then(tasksData => {
            if (Array.isArray(tasksData)) {
              setApiTasks(tasksData);
            }
          })
          .catch(err => {
            console.warn('Could not fetch tasks from API:', err.message);
            setTasksError(err.message || 'Failed to load project tasks');
          })
          .finally(() => {
            setIsLoadingTasks(false);
          });

        // Fetch live project timeline via GET /api/projects/:id/timeline
        setIsLoadingTimeline(true);
        getProjectTimeline(propProject.id)
          .then(timelineData => {
            if (Array.isArray(timelineData)) {
              setApiTimeline(timelineData);
              if (timelineData.length > 0) {
                setLastRefreshedAt(timelineData[0].timestamp || new Date().toISOString());
              }
            }
          })
          .catch(err => {
            console.warn('Could not fetch timeline from API:', err.message);
            setTimelineError(err.message || 'Failed to load activity timeline');
          })
          .finally(() => {
            setIsLoadingTimeline(false);
          });
      }
    }
  }, [propProject, isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Search users via GET /api/users/search?q={query}
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
  const handleFileAdd = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingAtt(true);
    setAttachmentError('');

    try {
      const newFormattedList = [];
      for (const file of files) {
        const uploaded = await uploadAttachment(project.id, file);
        if (uploaded) {
          newFormattedList.push(formatAttachment(uploaded));
        }
      }

      const updated = {
        ...project,
        attachments: [...(project.attachments || []), ...newFormattedList]
      };

      setProject(updated);
      if (onSaveProject) {
        onSaveProject(updated);
      }
    } catch (err) {
      console.error('Failed to upload attachment:', err);
      setAttachmentError(err.message || 'Failed to upload attachment. Please try again.');
    } finally {
      setIsUploadingAtt(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeAttachment = async (attId, e) => {
    e.stopPropagation();
    if (deletingAttId) return;

    setDeletingAttId(attId);
    setAttachmentError('');

    try {
      // Send DELETE /projects/:id/attachments/:attachmentId
      await deleteAttachment(project.id, attId);

      // Only remove from UI if backend deletion succeeds
      const updated = {
        ...project,
        attachments: (project.attachments || []).filter(a => a.id !== attId)
      };
      setProject(updated);
      if (onSaveProject) {
        onSaveProject(updated);
      }
    } catch (err) {
      console.error('Failed to delete attachment:', err);
      setAttachmentError(err.message || 'Failed to delete attachment. Please try again.');
      // Do NOT remove attachment from UI if backend fails
    } finally {
      setDeletingAttId(null);
    }
  };

  const downloadAtt = async (att) => {
    if (!project?.id || downloadingAttId) return;

    const attachmentId = att.id || att._id;
    if (!attachmentId) {
      setAttachmentError('Attachment ID is missing');
      return;
    }

    setDownloadingAttId(attachmentId);
    setAttachmentError('');

    try {
      // Send GET /api/projects/:id/attachments/:attachmentId/download
      const { blob, filename } = await downloadAttachment(project.id, attachmentId);
      const downloadUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename || att.filename || att.name || `attachment_${attachmentId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (err) {
      console.error('Failed to download attachment:', err);
      // Display error message from backend without removing attachment from UI
      setAttachmentError(err.message || 'Failed to download attachment. Please try again.');
    } finally {
      setDownloadingAttId(null);
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

  const addMemberToProject = async (userObj) => {
    if (!project?.id || isAddingMember) return;

    const userId = userObj.id || userObj._id || userObj.userId;
    const userEmail = userObj.email;

    // Check if already a member locally to prevent duplicate calls
    const alreadyExists = (project.members || []).some(
      m => (userId && (m.userId === userId || m.id === userId)) ||
           (userEmail && m.email && m.email.toLowerCase() === userEmail.toLowerCase())
    );

    if (alreadyExists) {
      setMembersError('User is already a member of this project');
      return;
    }

    setIsAddingMember(true);
    setMembersError('');

    try {
      // POST /api/projects/:id/members
      const newMemberData = await addProjectMember(project.id, {
        userId: userId,
        email: userEmail,
        role: userObj.role || 'member'
      });

      const normalized = normalizeMember(newMemberData || {
        userId: userId,
        name: userObj.name,
        email: userEmail,
        role: userObj.role || 'member'
      });

      const updated = {
        ...project,
        members: [...(project.members || []), normalized]
      };

      setProject(updated);
      if (onSaveProject) onSaveProject(updated);

      setMemberSearch('');
      setSearchResults([]);
      setShowAddMemberSearch(false);
    } catch (err) {
      console.error('Failed to add project member:', err);
      // Display backend error message without modifying project members in UI
      setMembersError(err.message || 'Failed to add project member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !project?.id || isRemovingMember) return;

    const targetUserId = memberToRemove.userId || memberToRemove.id || memberToRemove._id;
    setIsRemovingMember(true);
    setMembersError('');

    try {
      // DELETE /api/projects/:id/members/:userId
      await removeProjectMember(project.id, targetUserId);

      // On backend API success, update UI list immediately
      const updatedMembers = (project.members || []).filter(m => {
        const norm = normalizeMember(m);
        const normTarget = normalizeMember(memberToRemove);
        const mId = norm.userId || norm.id;
        const targetId = normTarget.userId || normTarget.id;
        if (mId && targetId && mId === targetId) return false;
        return norm.name !== normTarget.name;
      });

      const updated = {
        ...project,
        members: updatedMembers
      };

      setProject(updated);
      if (onSaveProject) onSaveProject(updated);
      setMemberToRemove(null);
    } catch (err) {
      console.error('Failed to remove project member:', err);
      // Display error message from backend without removing member from UI
      setMembersError(err.message || 'Failed to remove project member');
      setMemberToRemove(null);
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleRefreshTimeline = async () => {
    if (!project?.id || isRefreshingTimeline) return;

    setIsRefreshingTimeline(true);
    setTimelineError('');

    try {
      const sinceParam = lastRefreshedAt || (apiTimeline.length > 0 ? apiTimeline[0].timestamp : undefined);
      const resData = await refreshProjectTimeline(project.id, sinceParam);
      const newActivities = resData.newActivities || [];

      if (newActivities.length > 0) {
        setApiTimeline(prev => {
          const existingIds = new Set(prev.map(item => item.id || `${item.timestamp}-${item.action}`));
          const uniqueNew = newActivities.filter(item => !existingIds.has(item.id || `${item.timestamp}-${item.action}`));
          return [...uniqueNew, ...prev];
        });
      }

      if (resData.lastRefreshedAt) {
        setLastRefreshedAt(resData.lastRefreshedAt);
      }
    } catch (err) {
      console.warn('Failed to refresh timeline:', err.message);
      setTimelineError(err.message || 'Failed to refresh activity timeline');
    } finally {
      setIsRefreshingTimeline(false);
    }
  };

  const handleCoverImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setCoverError('');

    try {
      const uploadedUrl = await uploadCoverImage(project.id, file);

      const updated = {
        ...project,
        coverImage: uploadedUrl,
        image: uploadedUrl
      };

      setProject(updated);
      if (onSaveProject) {
        onSaveProject(updated);
      }
    } catch (err) {
      console.error('Cover image upload failed:', err);
      setCoverError(err.message || 'Failed to upload cover image. Please try again.');
    } finally {
      setIsUploadingCover(false);
      if (e.target) e.target.value = '';
    }
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
              <button 
                className="popup-icon-btn" 
                onClick={() => {
                  if (onEdit) {
                    onEdit(project);
                  } else {
                    startEdit();
                  }
                }} 
                aria-label="Edit"
                title="Edit Project"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Error message */}
        {coverError && (
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
            <span>{coverError}</span>
          </div>
        )}

        {/* Cover Image Banner if present */}
        {(project.coverImage || project.image) && (
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            maxHeight: '180px', 
            borderRadius: '12px', 
            overflow: 'hidden', 
            marginBottom: '20px', 
            border: theme === 'light' ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.12)' 
          }}>
            <img 
              src={project.coverImage || project.image} 
              alt={project.name} 
              style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
            />
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '8px' }}>
              <input 
                type="file" 
                hidden 
                ref={coverImageInputRef} 
                onChange={handleCoverImageChange} 
                accept="image/*" 
              />
              <button
                type="button"
                className="popup-save-btn"
                onClick={() => coverImageInputRef.current?.click()}
                disabled={isUploadingCover}
                style={{ 
                  padding: '5px 12px', 
                  fontSize: '12px', 
                  background: 'rgba(0,0,0,0.75)', 
                  color: '#ffffff', 
                  border: '1px solid rgba(255,255,255,0.25)', 
                  backdropFilter: 'blur(6px)',
                  cursor: isUploadingCover ? 'not-allowed' : 'pointer'
                }}
              >
                {isUploadingCover ? 'Uploading...' : 'Change Cover'}
              </button>
            </div>
          </div>
        )}

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

          {/* Cover Image row in meta-grid (if not yet uploaded or to upload easily) */}
          <div className="popup-meta-row">
            <div className="popup-meta-label">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" style={{ marginRight: '6px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              Cover Image
            </div>
            <div className="popup-meta-val" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="file" 
                hidden 
                ref={coverImageInputRef} 
                onChange={handleCoverImageChange} 
                accept="image/*" 
              />
              <button 
                type="button"
                className="popup-save-btn" 
                onClick={() => coverImageInputRef.current?.click()}
                disabled={isUploadingCover}
                style={{ padding: '4px 10px', fontSize: '12px', background: 'var(--popup-btn-bg)', color: 'var(--popup-text-main)', border: 'var(--popup-btn-border)' }}
              >
                {isUploadingCover ? 'Uploading...' : ((project.coverImage || project.image) ? 'Change Image' : 'Upload Image')}
              </button>
              {isUploadingCover && <span style={{ fontSize: '12px', color: 'var(--popup-text-muted)' }}>Uploading...</span>}
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

          {/* Attachment Error message */}
          {attachmentError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: theme === 'light' ? '#b91c1c' : '#fca5a5',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{attachmentError}</span>
            </div>
          )}

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
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadAtt(att);
                    }}
                    disabled={downloadingAttId === att.id}
                    style={{ background: 'transparent', border: 'none', color: 'var(--popup-text-muted)', cursor: downloadingAttId === att.id ? 'not-allowed' : 'pointer', padding: '4px', display: 'flex' }}
                    title="Download attachment"
                  >
                    {downloadingAttId === att.id ? (
                      <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => removeAttachment(att.id, e)}
                    disabled={deletingAttId === att.id}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: deletingAttId === att.id ? 'not-allowed' : 'pointer', padding: '4px', display: 'flex' }}
                    title="Delete attachment"
                  >
                    {deletingAttId === att.id ? (
                      <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </div>
              </div>
            ))}

            {/* Add file button */}
            <button
              className="popup-att-add-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAtt}
              title={isUploadingAtt ? 'Uploading...' : 'Add attachment'}
              style={{ opacity: isUploadingAtt ? 0.6 : 1, cursor: isUploadingAtt ? 'not-allowed' : 'pointer' }}
            >
              {isUploadingAtt ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              )}
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
              {t === 'tasks' ? 'Tasks & Subtasks' : t === 'members' ? 'Team Members' : 'Activity Timeline'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="popup-content" style={{ paddingBottom: '20px' }}>
          
          {/* Tasks & Subtasks Tab */}
          {activeTab === 'tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tasksError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: theme === 'light' ? '#b91c1c' : '#fca5a5', padding: '8px 12px',
                  borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{tasksError}</span>
                </div>
              )}

              {isLoadingTasks ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--popup-text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Loading project tasks...</span>
                </div>
              ) : (apiTasks.length > 0 ? apiTasks : (project.tasks || [])).length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--popup-text-muted)', fontSize: '13px' }}>
                  No tasks recorded for this project yet. Open the Project Board to create and manage tasks.
                </div>
              ) : (
                (apiTasks.length > 0 ? apiTasks : (project.tasks || [])).map(t => {
                  const isExpanded = expandedTasks[t.id];
                  const subtasks = t.subtasks || [];
                  const isCompleted = t.completed || t.status === 'Completed' || t.status === 'Done';
                  return (
                    <div key={t.id} style={{ border: 'var(--popup-card-border)', background: 'var(--popup-card-bg)', borderRadius: '12px', overflow: 'hidden' }}>
                      <div 
                        onClick={() => toggleTask(t.id)}
                        style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: 'var(--popup-checkbox-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isCompleted ? '#6366f1' : 'transparent' }}>
                            {isCompleted && <svg viewBox="0 0 24 24" width={10} height={10} stroke="#fff" strokeWidth="3" fill="none"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <span style={{ fontSize: '14px', color: 'var(--popup-text-main)', textDecoration: isCompleted ? 'line-through' : 'none' }}>
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

          {/* Activity Timeline Tab */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--popup-text-main)', fontWeight: '600' }}>
                  {apiTimeline.length} Activities
                </span>
                <button
                  type="button"
                  onClick={handleRefreshTimeline}
                  disabled={isRefreshingTimeline}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'var(--popup-btn-bg)', border: 'var(--popup-btn-border)',
                    color: 'var(--popup-text-main)', padding: '6px 12px', borderRadius: '8px',
                    cursor: isRefreshingTimeline ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '500'
                  }}
                  title="Check for new activity"
                >
                  <RefreshCw size={13} style={{ animation: isRefreshingTimeline ? 'spin 1s linear infinite' : 'none' }} />
                  <span>{isRefreshingTimeline ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>

              {timelineError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: theme === 'light' ? '#b91c1c' : '#fca5a5', padding: '8px 12px',
                  borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{timelineError}</span>
                </div>
              )}

              {isLoadingTimeline ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--popup-text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Loading activity timeline...</span>
                </div>
              ) : apiTimeline.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--popup-text-muted)', fontSize: '13px' }}>
                  No timeline history recorded for this project yet.
                </div>
              ) : (
                apiTimeline.map((item, idx) => {
                  const actorName = typeof item.actor === 'string' ? item.actor : (item.actor?.name || item.user || 'Team Member');
                  const timeFormatted = item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Just now';
                  return (
                    <div key={item.id || idx} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'var(--popup-card-bg)', border: 'var(--popup-card-border)', borderRadius: '12px', alignItems: 'flex-start' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                        <Clock size={15} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--popup-text-main)' }}>
                          <strong style={{ fontWeight: '600' }}>{actorName}</strong> {item.action || 'updated project'} {item.target ? <span style={{ color: '#6366f1' }}>"{item.target}"</span> : ''}
                        </div>
                        {item.details && <div style={{ fontSize: '12px', color: 'var(--popup-text-muted)' }}>{item.details}</div>}
                        <div style={{ fontSize: '11px', color: 'var(--popup-text-muted)', marginTop: '2px' }}>{timeFormatted}</div>
                      </div>
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

              {/* Members Loading Error message */}
              {membersError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: theme === 'light' ? '#b91c1c' : '#fca5a5',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{membersError}</span>
                </div>
              )}

              {/* Member Search & Select Dropdown */}
              {showAddMemberSearch && (
                <div ref={memberSearchWrapRef} style={{ position: 'relative', marginBottom: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--popup-text-muted)' }} />
                    <input
                      type="text"
                      className="popup-mini-input"
                      style={{ width: '100%', paddingLeft: '32px', paddingRight: (memberSearch || isSearchingUsers) ? '32px' : '10px', fontSize: '13px', height: '34px', boxSizing: 'border-box' }}
                      placeholder="Search users by name or email..."
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      autoFocus
                    />
                    {isSearchingUsers ? (
                      <Loader2 size={14} style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--popup-text-muted)', animation: 'spin 1s linear infinite' }} />
                    ) : memberSearch ? (
                      <button
                        type="button"
                        onClick={() => setMemberSearch('')}
                        style={{ position: 'absolute', right: '10px', top: '9px', background: 'transparent', border: 'none', color: 'var(--popup-text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      >
                        <X size={14} />
                      </button>
                    ) : null}
                  </div>

                  {searchError && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99,
                      background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '8px', padding: '8px 12px', marginTop: '4px',
                      fontSize: '12px', color: theme === 'light' ? '#b91c1c' : '#fca5a5', textAlign: 'center'
                    }}>
                      {searchError}
                    </div>
                  )}

                  {memberSearch && !isSearchingUsers && searchResults.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
                      maxHeight: '160px', overflowY: 'auto',
                      background: theme === 'light' ? '#ffffff' : '#1a1a24',
                      border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.18)',
                      borderRadius: '8px', boxShadow: '0 12px 32px rgba(0,0,0,0.7)', marginTop: '4px'
                    }}>
                      {searchResults.map(user => {
                        const emp = normalizeMember(user);
                        return (
                          <div
                            key={user.id || user._id || emp.name}
                            onClick={() => addMemberToProject(emp)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '10px 12px', cursor: 'pointer',
                              borderBottom: theme === 'light' ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.06)'
                            }}
                          >
                            <div style={{
                              width: '26px', height: '26px', borderRadius: '50%',
                              background: emp.bg || COLOR_HEX.blue, color: '#fff',
                              fontSize: '10px', fontWeight: '700',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              overflow: 'hidden', flexShrink: 0
                            }}>
                              {emp.avatar ? <img src={emp.avatar} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : emp.initials}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '13px', fontWeight: '600', color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>{emp.name}</span>
                              <span style={{ fontSize: '11px', color: theme === 'light' ? '#64748b' : '#94a3b8' }}>{user.email || emp.role || 'User'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {memberSearch && !isSearchingUsers && searchResults.length === 0 && !searchError && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99,
                      background: 'var(--popup-card-bg)', border: 'var(--popup-card-border)',
                      borderRadius: '8px', padding: '8px 12px', marginTop: '4px',
                      fontSize: '12px', color: 'var(--popup-text-muted)', textAlign: 'center'
                    }}>
                      No matching registered users found
                    </div>
                  )}
                </div>
              )}

              {isLoadingMembers ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--popup-text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Loading project members...</span>
                </div>
              ) : project.members.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--popup-text-muted)', fontSize: '13px' }}>
                  No members found in this project.
                </div>
              ) : (
                project.members.map((m, idx) => {
                  const norm = normalizeMember(m);
                  return (
                    <div key={norm.userId || norm.name || idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--popup-card-bg)', border: 'var(--popup-card-border)', borderRadius: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: norm.bg || COLOR_HEX.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                        {norm.avatar ? <img src={norm.avatar} alt={norm.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (norm.initials || (norm.name && norm.name.substring(0, 2)) || 'U')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--popup-text-main)' }}>{norm.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--popup-text-muted)' }}>{project.owner === norm.name ? 'Owner' : norm.role || 'Member'}</div>
                      </div>
                      {project.owner !== norm.name && (
                        <button 
                          onClick={() => setMemberToRemove(norm)}
                          style={{ background: 'var(--popup-btn-bg)', border: 'var(--popup-btn-border)', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex' }}
                          title="Remove member"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingTop: '16px', 
          borderTop: 'var(--popup-divider)' 
        }}>
          <button
            type="button"
            className="popup-delete-btn"
            onClick={() => setIsDeleteConfirmOpen(true)}
            title="Delete Project"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#ef4444',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            <Trash2 size={15} />
            <span>Delete Project</span>
          </button>

          <button className="popup-save-btn" onClick={handleOpenBoard} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Open Project Board</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Removing Project Member */}
      {memberToRemove && (
        <div 
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }} 
          onClick={() => !isRemovingMember && setMemberToRemove(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme === 'light' ? '#ffffff' : '#1a1a24',
              border: theme === 'light' ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.15)',
              borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
              maxWidth: '400px', width: '100%', padding: '24px', textAlign: 'center',
              color: theme === 'light' ? '#111827' : '#ffffff'
            }}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px'
            }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>
              Remove Member?
            </h3>
            
            <p style={{ fontSize: '13px', color: theme === 'light' ? '#4b5563' : '#9ca3af', lineHeight: '1.5', marginBottom: '20px' }}>
              Are you sure you want to remove <strong>"{memberToRemove.name}"</strong> from this project?
            </p>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                disabled={isRemovingMember}
                style={{
                  flex: 1, padding: '9px 14px',
                  background: theme === 'light' ? '#f3f4f6' : 'rgba(255, 255, 255, 0.08)',
                  border: theme === 'light' ? '1px solid #e5e7eb' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: theme === 'light' ? '#374151' : '#e5e7eb',
                  borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveMember}
                disabled={isRemovingMember}
                style={{
                  flex: 1, padding: '9px 14px', background: '#ef4444', color: '#ffffff',
                  border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px',
                  cursor: isRemovingMember ? 'not-allowed' : 'pointer', opacity: isRemovingMember ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                {isRemovingMember ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                <span>{isRemovingMember ? 'Removing...' : 'Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        project={project}
        onDeleteConfirm={(projectId) => {
          setIsDeleteConfirmOpen(false);
          if (onDeleteProject) {
            onDeleteProject(projectId);
          }
          onClose();
        }}
        theme={theme}
      />
    </div>
  );
}