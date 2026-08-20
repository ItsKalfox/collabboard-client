import { useState, useEffect } from 'react';
import ProjectsSidebar from '../components/Board/ProjectsSidebar';
import BoardHeader from '../components/Board/BoardHeader';
import KanbanBoard from '../components/Board/KanbanBoard';
import ActionModal from '../components/Board/ActionModal';

import { INITIAL_PROJECTS } from '../mock/mockProjects';
import './Board.css';

export default function Board({ initialProjectId, selectedProject, onSelectProject, currentUser }) {
  const [projects, setProjects] = useState(() => {
    const list = [];
    if (selectedProject && typeof selectedProject === 'object') {
      list.push(selectedProject);
    }
    return list;
  });

  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    if (selectedProject) return typeof selectedProject === 'object' ? selectedProject.id : selectedProject;
    if (initialProjectId) return typeof initialProjectId === 'object' ? initialProjectId.id : initialProjectId;
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
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
              // Fallback to mock initial projects only if API returns no projects
              if (apiProjects.length === 0) {
                INITIAL_PROJECTS.forEach(p => {
                  if (!map.has(p.id)) map.set(p.id, p);
                });
              }
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
            }
          }
        }
      } catch (err) {
        console.error('Error fetching projects from API:', err);

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

        body: JSON.stringify({ title: newTaskTitle, status: 'todo' })

      });
      if (res.ok) {
        setRefreshKey(k => k + 1); // trigger task refetch
        setIsAddTaskModalOpen(false);
        setNewTaskTitle('');

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

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !newMemberEmail.trim()) return;
    
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
        body: JSON.stringify({ email: newMemberEmail, role: 'member' })
      });
      if (res.ok) {
        // Trigger a re-render of BoardHeader to fetch new members
        setProjects([...projects]); 
        setIsAddMemberModalOpen(false);
        setNewMemberEmail('');
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
      <ProjectsSidebar 
        projects={projects} 
        activeProjectId={selectedProjectId} 
        onSelectProject={handleSelectProject} 
        currentUser={currentUser}
      />

      {/* Right side: Main Board Workspace */}
      <div className="board-main-view">
        {/* Top Header & Navigation */}
        {currentProject && (
          <BoardHeader 
            project={currentProject} 
            onAddTask={() => setIsAddTaskModalOpen(true)} 
            onAddMember={() => setIsAddMemberModalOpen(true)} 
            onAddTag={() => setIsAddTagModalOpen(true)}
          />
        )}

        {/* Kanban Board Columns */}
        <div className="board-content-area">
          {loading ? (
            <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading projects...</div>
          ) : error ? (
            <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Error: {error}</div>
          ) : selectedProjectId ? (
            <KanbanBoard projectId={selectedProjectId} refreshKey={refreshKey} />
          ) : (
            <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>No projects found. Please create a project.</div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      <ActionModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        title="Add New Task"
        onSubmit={handleAddTaskSubmit}
        submitText="Add Task"
        loading={isSubmitting}
      >
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

      </ActionModal>

      {/* Add Member Modal */}
      <ActionModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title="Invite Team Member"
        onSubmit={handleAddMemberSubmit}
        submitText="Send Invite"
        loading={isSubmitting}
      >
        <div className="auth-input-group">
          <label className="auth-label">Email Address</label>
          <div className="auth-input-wrapper">
            <input
              type="email"
              className="auth-input"
              placeholder="alex.morgan@company.com"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              required
              autoFocus
            />
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
    </div>
  );
}
