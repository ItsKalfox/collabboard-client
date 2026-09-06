import { useState, useEffect } from 'react';
import ProjectCard from './ProjectCard';
import CreateProjectModal from './CreateProjectModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import ProjectDetailsModal from './ProjectDetailsModal';
import { Plus, Search } from 'lucide-react';
import { normalizeMember } from '../../utils/memberUtils';
import { calculateProjectProgress, isProjectOwner, isProjectMember } from '../../utils/projectUtils';
import { getProjects } from '../../services/projectService';
import './projects.css';

export default function ProjectsPage({ theme = 'dark', currentUser, onOpenBoard = () => {} }) {
  const isDark = theme !== 'light';
  const lightCls = isDark ? '' : ' light';

  // Active user object or fallback
  const activeUser = currentUser || { name: 'Alex Johnson', email: 'alex.dev@collabboard.com' };

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(null);
  const [selectedDetailsProject, setSelectedDetailsProject] = useState(null);
  const [detailsInitialEditMode, setDetailsInitialEditMode] = useState(false);

  useEffect(() => {
    const fetchApiProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const apiProjects = await getProjects();
        if (apiProjects && Array.isArray(apiProjects)) {
          const formatted = apiProjects.map(p => ({
            ...p,
            owner: p.owner || (p.ownerId === activeUser.id ? (activeUser.name || 'Me') : (p.ownerName || 'Unknown Owner')),
            createdDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (p.createdDate || '—'),
            progress: calculateProjectProgress(p)
          }));
          
          setProjects(formatted);

          const openId = localStorage.getItem('openProjectModalId');
          if (openId) {
            const projToOpen = formatted.find(p => p._id === openId || p.id === openId);
            if (projToOpen) {
              setSelectedDetailsProject(projToOpen);
              localStorage.removeItem('openProjectModalId');
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch projects from API:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiProjects();
  }, [currentUser]);

  const handleCreateProject = (newProject) => {
    const computed = {
      ...newProject,
      progress: calculateProjectProgress(newProject)
    };
    setProjects(prev => [computed, ...prev]);
  };

  const handleSaveEdit = (updatedProject) => {
    const computed = {
      ...updatedProject,
      progress: calculateProjectProgress(updatedProject)
    };
    setProjects(projects.map((p) => (p.id === computed.id ? computed : p)));
    if (selectedDetailsProject && selectedDetailsProject.id === computed.id) {
      setSelectedDetailsProject(computed);
    }
  };

  const handleDeleteConfirm = (projectId) => {
    setProjects(prev => prev.filter((p) => p.id !== projectId));
    if (selectedDetailsProject && selectedDetailsProject.id === projectId) {
      setSelectedDetailsProject(null);
    }
  };

  const filteredBySearch = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  let ownedProjects = filteredBySearch.filter(p => isProjectOwner(p, activeUser));
  let partOfProjects = filteredBySearch.filter(p => 
    !isProjectOwner(p, activeUser) && 
    isProjectMember(p, activeUser)
  );

  // Fallback: If ownership filtering returns empty (e.g. offline user ID mismatch), display all projects
  if (ownedProjects.length === 0 && partOfProjects.length === 0 && filteredBySearch.length > 0) {
    ownedProjects = filteredBySearch;
  }

  return (
    <div className={`projects-page${lightCls}`}>
      <div className={`projects-header${lightCls}`}>
        <div className={`projects-search-bar${lightCls}`}>
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="projects-header-actions">
          <button onClick={() => setIsCreateOpen(true)} className="btn-primary" id="create-project-btn">
            <Plus size={16} strokeWidth={3} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="projects-sections">
          <div className="projects-category-section">
            <h3 className={`projects-category-title${lightCls}`}>Loading Projects</h3>
            <div className="projects-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="pc-list-card" style={{ cursor: 'default' }}>
                  <div className="skeleton-box skeleton-image" />
                  <div className="pc-list-info">
                    <div className="skeleton-box skeleton-title" />
                    <div className="skeleton-box skeleton-desc" />
                  </div>
                  <div className="pc-list-progress-section" style={{ flex: 1 }}>
                    <div className="pc-list-progress-header">
                      <div className="skeleton-box skeleton-progress-label" />
                      <div className="skeleton-box skeleton-progress-label" />
                    </div>
                    <div className="skeleton-box skeleton-progress" />
                  </div>
                  <div className="pc-list-meta" style={{ flex: 0.5 }}>
                    <div className="skeleton-box skeleton-meta-label" />
                    <div className="skeleton-box skeleton-meta-value" />
                  </div>
                  <div className="pc-list-members">
                    <div className="skeleton-avatar" />
                    <div className="skeleton-avatar" />
                    <div className="skeleton-avatar" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className={`${isDark ? 'glass-card' : 'glass-card-light'} empty-state${lightCls}`}>
          <p className={`empty-state-title${lightCls}`}>No projects found</p>
          <p className={`empty-state-sub${lightCls}`}>Click below to create your first project.</p>
          <button onClick={() => setIsCreateOpen(true)} className="btn-primary">
            <Plus size={14} strokeWidth={3} />
            <span>New Project</span>
          </button>
        </div>
      ) : (
        <div className="projects-sections">
          
          {/* Section 1: My Projects */}
          {ownedProjects.length > 0 && (
            <div className="projects-category-section">
              <h3 className={`projects-category-title${lightCls}`}>My Projects</h3>
              <div className="projects-grid">
                {ownedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    theme={theme}
                    onEdit={(p) => {
                      setSelectedDetailsProject(p);
                      setDetailsInitialEditMode(true);
                    }}
                    onDelete={(p) => setDeletingProject(p)}
                    onViewDetails={(p) => setSelectedDetailsProject(p)}
                    onOpenBoard={onOpenBoard}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Divider if both exist */}
          {ownedProjects.length > 0 && partOfProjects.length > 0 && (
            <div className={`projects-category-divider${lightCls}`} />
          )}

          {/* Section 2: Team Projects */}
          {partOfProjects.length > 0 && (
            <div className="projects-category-section">
              <h3 className={`projects-category-title${lightCls}`}>Team Projects</h3>
              <div className="projects-grid">
                {partOfProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    theme={theme}
                    onEdit={(p) => {
                      setSelectedDetailsProject(p);
                      setDetailsInitialEditMode(true);
                    }}
                    onDelete={(p) => setDeletingProject(p)}
                    onViewDetails={(p) => setSelectedDetailsProject(p)}
                    onOpenBoard={onOpenBoard}
                  />
                ))}
              </div>
            </div>
          )}
          
        </div>
      )}

      <ProjectDetailsModal 
        isOpen={!!selectedDetailsProject} 
        onClose={() => {
          setSelectedDetailsProject(null);
          setDetailsInitialEditMode(false);
        }} 
        project={selectedDetailsProject} 
        onSaveProject={handleSaveEdit}
        onDeleteProject={handleDeleteConfirm}
        onOpenBoard={onOpenBoard} 
        theme={theme} 
        currentUser={activeUser}
        initialEditMode={detailsInitialEditMode}
      />
      <CreateProjectModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onCreate={handleCreateProject} 
        theme={theme} 
        currentUser={currentUser}
      />
      <DeleteConfirmModal 
        isOpen={!!deletingProject} 
        onClose={() => setDeletingProject(null)} 
        project={deletingProject} 
        onDeleteConfirm={handleDeleteConfirm} 
        theme={theme} 
      />
    </div>
  );
}