import { useState, useEffect } from 'react';
import ProjectsSidebar from '../components/Board/ProjectsSidebar';
import BoardHeader from '../components/Board/BoardHeader';
import KanbanBoard from '../components/Board/KanbanBoard';
import './Board.css';

export default function Board() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        if (data.status === 'success' && data.data && data.data.projects) {
          setProjects(data.data.projects);
          if (data.data.projects.length > 0) {
            setSelectedProjectId(data.data.projects[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
  };

  const currentProject = projects.find((p) => p.id === selectedProjectId) || null;

  return (
    <div className="board-page-container">
      {/* Left side: Projects Preview Sidebar */}
      <ProjectsSidebar
        projects={projects}
        activeProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
      />

      {/* Right side: Main Board Workspace */}
      <div className="board-main-view">
        {/* Top Header & Navigation */}
        {currentProject && <BoardHeader project={currentProject} />}

        {/* Kanban Board Columns */}
        <div className="board-content-area">
          {loading ? (
            <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading projects...</div>
          ) : error ? (
            <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Error: {error}</div>
          ) : selectedProjectId ? (
            <KanbanBoard projectId={selectedProjectId} />
          ) : (
            <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>No projects found. Please create a project.</div>
          )}
        </div>
      </div>
    </div>
  );
}
