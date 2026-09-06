import { useState, useEffect, useRef } from 'react';
import ProjectsSidebar from '../components/Board/ProjectsSidebar';
import BoardHeader from '../components/Board/BoardHeader';
import KanbanBoard from '../components/Board/KanbanBoard';
import ProjectTimeline from '../components/Board/ProjectTimeline';
import ProjectActivity from '../components/Board/ProjectActivity';
import ActionModal from '../components/Board/ActionModal';
import ProjectDetailsModal from '../components/projects/ProjectDetailsModal';

import { Search, X } from 'lucide-react';
import { getProjects, createProject, addProjectMember } from '../services/projectService';
import { getProjectsFromDB } from '../services/dbService';

import { normalizeMember } from '../utils/memberUtils';
import './Board.css';

export default function Board({ initialProjectId, selectedProject, onSelectProject, currentUser, theme = 'dark' }) {
  const [projects, setProjects] = useState(() => {
    const list = [];
    if (selectedProject && typeof selectedProject === 'object') {
      list.push(selectedProject);
    }
    return list;
  });

  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    // If we're coming from the projects page and a project was selected
    if (selectedProject && typeof selectedProject === 'object') {
      return selectedProject.id;
    }
    // If an ID was explicitly passed
    if (initialProjectId) {
      return initialProjectId;
    }
    // Default fallback
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState('Board');

  useEffect(() => {
    const target = selectedProject || initialProjectId;
    const targetId = typeof target === 'object' ? target?.id : target;
    if (targetId) {
      setSelectedProjectId(targetId);
      if (typeof target === 'object' && target !== null) {
        setProjects(prev => {
          if (!prev.some(p => p.id === targetId)) {
            return [target, ...prev];
          }
          return prev.map(p => p.id === targetId ? { ...p, ...target } : p);
        });
      }
    }
  }, [initialProjectId, selectedProject]);


  // Modal states
  const [isProjectDetailsOpen, setIsProjectDetailsOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newSubtasks, setNewSubtasks] = useState([]);
  const [activeTaskTab, setActiveTaskTab] = useState('main');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDesc, setNewSubtaskDesc] = useState('');
  const [newTaskAttachments, setNewTaskAttachments] = useState([]);
  const [isUploadingNewTaskAtt, setIsUploadingNewTaskAtt] = useState(false);

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search member states
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const memberSearchWrapRef = useRef(null);
  const [showTaskAssigneeDropdown, setShowTaskAssigneeDropdown] = useState(false);
  const taskAssigneeDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (taskAssigneeDropdownRef.current && !taskAssigneeDropdownRef.current.contains(e.target)) {
        setShowTaskAssigneeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        const response = await fetch(`${apiUrl}/projects`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });


        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.data && data.data.projects) {
            const apiProjects = data.data.projects;
            setProjects(prev => {
              const map = new Map();
              // Add API projects
              apiProjects.forEach(p => map.set(p.id, p));
              // Fallback removed to ensure true empty state when no projects exist
              // Add any dynamically selected project
              prev.forEach(p => {
                if (!map.has(p.id)) map.set(p.id, p);
              });
              const target = selectedProject || initialProjectId;
              if (typeof target === 'object' && target !== null) {
                map.set(target.id, { ...map.get(target.id), ...target });
              }
              return Array.from(map.values());
            });

            const target = selectedProject || initialProjectId;
            const targetId = typeof target === 'object' ? target?.id : target;
            if (targetId) {
              setSelectedProjectId(targetId);
            } else if (apiProjects.length > 0) {
              setSelectedProjectId(prev => {
                if (!prev || !apiProjects.some(p => p.id === prev)) {
                  return apiProjects[0].id;
                }
                return prev;
              });
            } else {
              setSelectedProjectId(null);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching projects from API:', err);
        const dbProjects = await getProjectsFromDB();
        if (dbProjects && dbProjects.length > 0) {
          setProjects(dbProjects);
          setSelectedProjectId(prev => {
            if (!prev || !dbProjects.some(p => p.id === prev)) {
              return dbProjects[0].id;
            }
            return prev;
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();

  }, [initialProjectId, selectedProject]);


  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    if (onSelectProject) {
      onSelectProject(projectId);
    }
  };

  // Close member dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (memberSearchWrapRef.current && !memberSearchWrapRef.current.contains(e.target)) {
        setShowMemberDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced user search
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
    const timer = setTimeout(() => {
      searchUsers(memberSearch)
        .then(users => { if (isMounted) setSearchResults(users || []); })
        .catch(err => { if (isMounted) { setSearchError(err.message || 'Failed to search'); setSearchResults([]); } })
        .finally(() => { if (isMounted) setIsSearchingUsers(false); });
    }, 400);
    return () => { isMounted = false; clearTimeout(timer); };
  }, [memberSearch]);

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const subtask = {
      id: `st-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      description: newSubtaskDesc.trim(),
      completed: false
    };
    setNewSubtasks(prev => [...prev, subtask]);
    setNewSubtaskTitle('');
    setNewSubtaskDesc('');
  };

  const handleRemoveSubtask = (id) => {
    setNewSubtasks(prev => prev.filter(s => s.id !== id));
  };

  const activeProjectData = projects.find(p => p.id === selectedProjectId);
  const minDate = new Date().toISOString().split('T')[0];
  const maxDate = activeProjectData?.dueDate ? new Date(activeProjectData.dueDate).toISOString().split('T')[0] : '';


  const handleAddTaskSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !newTaskTitle.trim()) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/projects/${selectedProjectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },

        body: JSON.stringify({ 
          title: newTaskTitle, 
          status: 'todo',
          description: newTaskDescription,
          dueDate: newTaskDueDate || null,
          assigneeId: newTaskAssignee || undefined,
          subtasks: newSubtasks
        })

      });
      if (res.ok) {
        const data = await res.json();
        const newTaskId = data.data.task.id;

        if (newTaskAttachments.length > 0) {
          const uploadPromises = newTaskAttachments.map(async (f) => {
            const formData = new FormData();
            formData.append('file', f);
            await fetch(`${apiUrl}/tasks/${newTaskId}/attachments`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
            });
          });
          await Promise.all(uploadPromises);
        }

        setRefreshKey(k => k + 1); // trigger task refetch
        setIsAddTaskModalOpen(false);
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskDueDate('');
        setNewTaskAssignee('');
        setNewSubtasks([]);
        setNewTaskAttachments([]);
        setActiveTaskTab('main');

      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to add task');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMemberDirectly = async (memberObj) => {
    if (!selectedProjectId) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/projects/${selectedProjectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: memberObj.email, role: 'member' })
      });
      if (res.ok) {
        setProjects(prev => {
          const newProjects = [...prev];
          const projIndex = newProjects.findIndex(p => p.id === selectedProjectId);
          if (projIndex !== -1) {
            newProjects[projIndex] = {
              ...newProjects[projIndex],
              members: [...(newProjects[projIndex].members || []), memberObj]
            };
          }
          return newProjects;
        });
        setMemberSearch('');
        setShowMemberDropdown(false);
        setIsAddMemberModalOpen(false);
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to add member');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTagSubmit = async (e) => {
    e.preventDefault();
    const currentProject = projects.find((p) => p.id === selectedProjectId) || null;
    if (!currentProject || !newTag.trim()) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      const existingTags = currentProject.tags || [];
      const updatedTags = [...existingTags, newTag.trim()];
      
      const res = await fetch(`${apiUrl}/projects/${selectedProjectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tags: updatedTags })
      });
      
      if (res.ok) {
        const data = await res.json();
        setProjects(projects.map(p => p.id === selectedProjectId ? data.data.project : p));
        setIsAddTagModalOpen(false);
        setNewTag('');
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to add tag');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentProject = projects.find((p) => p.id === selectedProjectId) || null;

  return (
    <div className="board-page-container">
      {/* Left side: Projects Preview Sidebar */}
      {loading ? (
        <div className="projects-preview-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div className="skeleton-box" style={{ height: '16px', width: '50%', borderRadius: '4px', marginBottom: '16px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton-box" style={{ height: '36px', width: '100%', borderRadius: '8px' }} />
              ))}
            </div>
          </div>
          <div>
            <div className="skeleton-box" style={{ height: '16px', width: '60%', borderRadius: '4px', marginBottom: '16px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2].map(i => (
                <div key={i} className="skeleton-box" style={{ height: '36px', width: '100%', borderRadius: '8px' }} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <ProjectsSidebar 
          projects={projects} 
          activeProjectId={selectedProjectId} 
          onSelectProject={handleSelectProject} 
          currentUser={currentUser}
        />
      )}

      {/* Right side: Main Board Workspace */}
      <div className="board-main-view">
        {loading ? (
          <>
            <div className="board-header-container" style={{ padding: '16px 24px', paddingBottom: '0' }}>
              {/* TOP ROW: Title & Deadline/Avatars */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 0 0' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '40%' }}>
                  <div className="skeleton-box" style={{ height: '36px', width: '80%', borderRadius: '8px' }} />
                  <div className="skeleton-box" style={{ height: '26px', width: '26px', borderRadius: '50%' }} />
                </div>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div className="skeleton-box" style={{ height: '16px', width: '100px', borderRadius: '4px' }} />
                  <div style={{ display: 'flex' }}>
                    <div className="skeleton-avatar" style={{ marginLeft: '0', zIndex: 4 }} />
                    <div className="skeleton-avatar" style={{ marginLeft: '-10px', zIndex: 3 }} />
                    <div className="skeleton-avatar" style={{ marginLeft: '-10px', zIndex: 2 }} />
                    <div className="skeleton-avatar" style={{ marginLeft: '-10px', zIndex: 1 }} />
                  </div>
                </div>
              </div>

              {/* SECOND ROW: Description & Add Task Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '16px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, paddingRight: '16px' }}>
                  <div className="skeleton-box" style={{ height: '14px', width: '100%', borderRadius: '4px' }} />
                  <div className="skeleton-box" style={{ height: '14px', width: '95%', borderRadius: '4px' }} />
                  <div className="skeleton-box" style={{ height: '14px', width: '80%', borderRadius: '4px' }} />
                </div>
                <div className="skeleton-box" style={{ height: '36px', width: '130px', borderRadius: '6px', flexShrink: 0 }} />
              </div>

              {/* THIRD ROW: Subtabs */}
              <div style={{ display: 'flex', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color, #e5e7eb)', marginTop: '16px' }}>
                <div className="skeleton-box" style={{ height: '24px', width: '60px', borderRadius: '4px' }} />
                <div className="skeleton-box" style={{ height: '24px', width: '80px', borderRadius: '4px' }} />
                <div className="skeleton-box" style={{ height: '24px', width: '90px', borderRadius: '4px' }} />
              </div>
            </div>
            <div className="board-content-area" style={{ padding: '24px' }}>
              <div className="kanban-board-container" style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
                {[{id: 'todo', title: 'To Do'}, {id: 'in_progress', title: 'In Progress'}, {id: 'review', title: 'Need Review'}, {id: 'completed', title: 'Done'}].map(col => (
                  <div key={col.id} className="kanban-column" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="kanban-column-header">
                      <div className="column-header-left">
                        <h3 className="column-title">{col.title}</h3>
                        <span className="column-count-badge">0</span>
                      </div>
                    </div>
                    <div className="kanban-tasks-list" style={{ minHeight: '150px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="skeleton-box" style={{ height: '140px', width: '100%', borderRadius: '16px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Top Header & Navigation */}
            {currentProject && (
              <BoardHeader 
                project={currentProject} 
                onAddTask={() => setIsAddTaskModalOpen(true)} 
                onAddMember={() => setIsAddMemberModalOpen(true)} 
                onAddTag={() => setIsAddTagModalOpen(true)}
                onInfoClick={() => setIsProjectDetailsOpen(true)}
                activeSubTab={activeSubTab}
                onSubTabChange={setActiveSubTab}
              />
            )}

            {/* Kanban Board Columns */}
            <div className="board-content-area">
              {error ? (
                <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Error: {error}</div>
              ) : selectedProjectId ? (
                <>
                  {activeSubTab === 'Board' && <KanbanBoard projectId={selectedProjectId} currentProject={currentProject} refreshKey={refreshKey} currentUser={currentUser} />}
                  {activeSubTab === 'Timeline' && <ProjectTimeline project={currentProject} />}
                  {activeSubTab === 'Activity' && <ProjectActivity projectId={selectedProjectId} />}
                </>
              ) : (
                <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>No projects found. Please create a project.</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Task Modal */}
      <ActionModal
        isOpen={isAddTaskModalOpen}
        onClose={() => {
          setIsAddTaskModalOpen(false);
          setActiveTaskTab('main');
        }}
        title="Add New Task"
        onSubmit={handleAddTaskSubmit}
        submitText="Add Task"
        loading={isSubmitting}
      >
        <div className="popup-tabs" style={{ marginBottom: '16px', display: 'flex', width: '100%' }}>
          <button
            type="button"
            className={`popup-tab ${activeTaskTab === 'main' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setActiveTaskTab('main')}
          >
            Main Details
          </button>
          <button
            type="button"
            className={`popup-tab ${activeTaskTab === 'subtasks' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setActiveTaskTab('subtasks')}
          >
            Subtasks
          </button>
          <button
            type="button"
            className={`popup-tab ${activeTaskTab === 'attachments' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setActiveTaskTab('attachments')}
          >
            Attachments
          </button>
        </div>

        <div style={{ minHeight: '280px' }}>
          {activeTaskTab === 'main' && (
          <>
            <div className="auth-input-group">
              <label className="auth-label">Task Title</label>
              <div className="auth-input-wrapper">
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Design homepage wireframes"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
            
            <div className="auth-input-group" style={{ marginTop: '16px' }}>
              <label className="auth-label">Description</label>
              <div className="auth-input-wrapper">
                <textarea
                  className="auth-input"
                  style={{ minHeight: '80px', padding: '10px 14px', resize: 'vertical' }}
                  placeholder="Enter task description..."
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-input-group" style={{ marginTop: '16px' }}>
              <label className="auth-label">Due Date</label>
              <div className="auth-input-wrapper">
                <input
                  type="date"
                  className="auth-input"
                  value={newTaskDueDate}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-input-group" style={{ marginTop: '16px' }}>
              <label className="auth-label">Assign To</label>
              <div className="auth-input-wrapper" style={{ position: 'relative' }} ref={taskAssigneeDropdownRef}>
                <div 
                  onClick={() => setShowTaskAssigneeDropdown(!showTaskAssigneeDropdown)}
                  className="auth-input"
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', minHeight: '42px', color: 'var(--text-primary)' }}
                >
                  {(() => {
                    const getInitials = (name) => {
                      if (!name) return 'U';
                      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    };
                    const currentUserName = typeof currentUser === 'string' ? currentUser : currentUser?.name || 'You';
                    const currentUserId = typeof currentUser === 'object' && currentUser?.id ? currentUser.id : currentUserName;
                    
                    if (!newTaskAssignee) return <span>Assignee (Default: You)</span>;
                    const isOwner = String(newTaskAssignee) === String(currentUserId);
                    if (isOwner) {
                      return (
                        <>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                            {currentUser?.avatar ? <img src={currentUser.avatar} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : getInitials(currentUserName)}
                          </div>
                          <span>{currentUserName} (You)</span>
                        </>
                      );
                    }
                    const assignee = (activeProjectData?.members || []).find(m => String(m.id || m.userId || m.name) === String(newTaskAssignee));
                    if (assignee) {
                      return (
                        <>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: assignee.bg || '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
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
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: document.documentElement.getAttribute('data-theme') !== 'light' ? '#101016' : '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 -4px 12px rgba(0,0,0,0.5)', zIndex: 999, marginBottom: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                    <div 
                      onClick={() => { 
                        const currentUserName = typeof currentUser === 'string' ? currentUser : currentUser?.name || 'You';
                        const currentUserId = typeof currentUser === 'object' && currentUser?.id ? currentUser.id : currentUserName;
                        setNewTaskAssignee(currentUserId); 
                        setShowTaskAssigneeDropdown(false); 
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--menu-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                        {currentUser?.avatar ? <img src={currentUser.avatar} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : (() => {
                          const name = typeof currentUser === 'string' ? currentUser : currentUser?.name || 'You';
                          return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                        })()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{typeof currentUser === 'string' ? currentUser : currentUser?.name || 'You'} (You)</span>
                      </div>
                    </div>
                    {(activeProjectData?.members || []).filter(m => {
                      const currentUserName = typeof currentUser === 'string' ? currentUser : currentUser?.name || 'You';
                      const currentUserId = typeof currentUser === 'object' && currentUser?.id ? currentUser.id : currentUserName;
                      return String(m.id || m.userId || m.name) !== String(currentUserId);
                    }).map(m => (
                      <div 
                        key={m.id || m.userId || m.name}
                        onClick={() => { setNewTaskAssignee(m.id || m.userId || m.name); setShowTaskAssigneeDropdown(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--menu-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: m.bg || '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                          {m.avatar ? <img src={m.avatar} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : m.initials || (() => {
                            const name = m.name || 'U';
                            return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                          })()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{m.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTaskTab === 'subtasks' && (
          <div className="add-task-subtasks-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {newSubtasks.length > 0 && (
              <div className="subtasks-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                {newSubtasks.map(st => (
                  <div key={st.id} className="subtask-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--menu-bg, rgba(255,255,255,0.1))', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ flex: 1, marginRight: '10px' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{st.title}</div>
                      {st.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{st.description}</div>}
                    </div>
                    <button type="button" onClick={() => handleRemoveSubtask(st.id)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px' }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="add-subtask-form" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', background: 'var(--window-bg, rgba(255,255,255,0.05))', borderRadius: '8px' }}>
              <div className="auth-input-wrapper">
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Subtask Title"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                />
              </div>
              <div className="auth-input-wrapper">
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Subtask Description (optional)"
                  value={newSubtaskDesc}
                  onChange={(e) => setNewSubtaskDesc(e.target.value)}
                />
              </div>
              <button type="button" className="btn-secondary" onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()} style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '13px' }}>
                Add Subtask
              </button>
            </div>
            </div>
          )}

        {activeTaskTab === 'attachments' && (
          <div className="add-task-attachments-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Attachments will be uploaded automatically when you create the task.
            </div>
            
            {newTaskAttachments.length > 0 && (
              <div className="attachments-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {newTaskAttachments.map((file, idx) => (
                  <div key={idx} className="attachment-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--menu-bg, rgba(255,255,255,0.1))', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </div>
                    <button type="button" onClick={() => setNewTaskAttachments(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px' }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="add-attachment-action">
              <input
                type="file"
                multiple
                id="new-task-file-upload"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files.length > 0) {
                    setIsUploadingNewTaskAtt(true);
                    const selected = Array.from(e.target.files);
                    // Simulate upload delay for immediate visual feedback
                    setTimeout(() => {
                      setNewTaskAttachments(prev => [...prev, ...selected]);
                      setIsUploadingNewTaskAtt(false);
                    }, 1200);
                  }
                  e.target.value = '';
                }}
              />
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => !isUploadingNewTaskAtt && document.getElementById('new-task-file-upload').click()}
                disabled={isUploadingNewTaskAtt}
                style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isUploadingNewTaskAtt ? (
                  <span>Uploading...</span>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Select Files
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        </div>
      </ActionModal>

      {/* Add Member Modal */}
      <ActionModal
        isOpen={isAddMemberModalOpen}
        onClose={() => {
          setIsAddMemberModalOpen(false);
          setMemberSearch('');
          setShowMemberDropdown(false);
        }}
        title="Add Team Member"
        onSubmit={(e) => e.preventDefault()}
        hideFooter={true}
      >
        <div className="auth-input-group" ref={memberSearchWrapRef}>
          <label className="auth-label">Search Member</label>
          <div className="auth-input-wrapper" style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="auth-input"
              style={{ paddingLeft: '38px', paddingRight: memberSearch ? '38px' : '12px' }}
              placeholder="Search by name or email..."
              value={memberSearch}
              onChange={e => {
                setMemberSearch(e.target.value);
                setShowMemberDropdown(true);
              }}
              onFocus={() => setShowMemberDropdown(true)}
              autoFocus
            />
            {memberSearch && (
              <button
                type="button"
                onClick={() => { setMemberSearch(''); setShowMemberDropdown(false); }}
                style={{ position: 'absolute', right: '12px', top: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Inline results — always takes up space so modal doesn't jump */}
          <div style={{ marginTop: '8px', minHeight: '240px', borderRadius: '10px', border: '1px solid var(--border-color, rgba(255,255,255,0.10))', overflow: 'hidden', background: 'var(--window-bg, rgba(255,255,255,0.04))' }}>
            {!memberSearch.trim() ? (
              <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <Search size={28} style={{ opacity: 0.3, marginBottom: '10px', display: 'block', margin: '0 auto 10px' }} />
                Start typing to search for a team member
              </div>
            ) : isSearchingUsers ? (
              <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Searching users...
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No users found for "{memberSearch}"
              </div>
            ) : (
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {searchResults.map(empRaw => {
                  const emp = normalizeMember(empRaw);
                  return (
                    <div
                      key={emp.id || emp._id || emp.email}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 14px', cursor: 'pointer',
                        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                        background: emp.avatar ? 'transparent' : (emp.bg || '#3b82f6'), color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 'bold', overflow: 'hidden'
                      }}>
                        {emp.avatar ? (
                          <img src={emp.avatar} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          emp.initials || emp.name?.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
                        )}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {emp.name || emp.username || 'Unknown'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {emp.email}
                        </span>
                      </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleAddMemberDirectly(emp)}
                      disabled={isSubmitting}
                      style={{ padding: '5px 12px', fontSize: '12px', flexShrink: 0 }}
                    >
                      {isSubmitting ? '...' : 'Add'}
                    </button>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ActionModal>

      {/* Add Tag Modal */}
      <ActionModal
        isOpen={isAddTagModalOpen}
        onClose={() => setIsAddTagModalOpen(false)}
        title="Add New Tag"
        onSubmit={handleAddTagSubmit}
        submitText="Add Tag"
        loading={isSubmitting}
      >
        <div className="auth-input-group">
          <label className="auth-label">Tag Name</label>
          <div className="auth-input-wrapper">
            <input
              type="text"
              className="auth-input"
              placeholder="e.g. High Priority, Frontend"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              required
              autoFocus
            />
          </div>
        </div>
      </ActionModal>

      <ProjectDetailsModal
        isOpen={isProjectDetailsOpen}
        onClose={() => setIsProjectDetailsOpen(false)}
        project={currentProject}
        currentUser={currentUser}
        theme={theme}
        hideActions={true}
        onSaveProject={(updated) => {
          setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
        }}
      />
    </div>
  );
}
