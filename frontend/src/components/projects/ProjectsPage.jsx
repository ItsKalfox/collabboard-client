import { useState } from 'react';
import ProjectCard from './ProjectCard';
import CreateProjectModal from './CreateProjectModal';
import EditProjectModal from './EditProjectModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import ProjectDetailsModal from './ProjectDetailsModal';
import { Plus, Search } from 'lucide-react';
import { normalizeMember } from '../../mock/mockMembers';
import { INITIAL_PROJECTS } from '../../mock/mockProjects';
import { calculateProjectProgress, isProjectOwner, isProjectMember } from '../../utils/projectUtils';
import './projects.css';

export default function ProjectsPage({ theme = 'dark', currentUser, onOpenBoard = () => {} }) {
  const isDark = theme !== 'light';
  const lightCls = isDark ? '' : ' light';

  // Active user object or fallback
  const activeUser = currentUser || { name: 'Alex Johnson', email: 'alex.dev@collabboard.com' };

  const [projects, setProjects] = useState(() => {
    return INITIAL_PROJECTS.map(p => ({
      ...p,
      progress: calculateProjectProgress(p)
    }));
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [selectedDetailsProject, setSelectedDetailsProject] = useState(null);

  const handleCreateProject = (newProject) => {
    const computed = {
      ...newProject,
      progress: calculateProjectProgress(newProject)
    };
    setProjects([computed, ...projects]);
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
    const idx = INITIAL_PROJECTS.findIndex(p => p.id === projectId);
    if (idx !== -1) {
      INITIAL_PROJECTS.splice(idx, 1);
    }
    setProjects(projects.filter((p) => p.id !== projectId));
    if (selectedDetailsProject && selectedDetailsProject.id === projectId) {
      setSelectedDetailsProject(null);
    }
  };

  const filteredBySearch = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const ownedProjects = filteredBySearch.filter(p => isProjectOwner(p, activeUser));
  const partOfProjects = filteredBySearch.filter(p => 
    !isProjectOwner(p, activeUser) && 
    isProjectMember(p, activeUser)
  );

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

      {projects.length === 0 ? (
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
                    onEdit={(p) => setEditingProject(p)}
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
                    onEdit={(p) => setEditingProject(p)}
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

      <CreateProjectModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onCreate={handleCreateProject} 
        theme={theme} 
        currentUser={currentUser}
      />
      <EditProjectModal 
        isOpen={!!editingProject} 
        onClose={() => setEditingProject(null)} 
        project={editingProject} 
        onSave={handleSaveEdit} 
        theme={theme} 
      />
      <DeleteConfirmModal 
        isOpen={!!deletingProject} 
        onClose={() => setDeletingProject(null)} 
        project={deletingProject} 
        onDeleteConfirm={handleDeleteConfirm} 
        theme={theme} 
      />
      <ProjectDetailsModal 
        isOpen={!!selectedDetailsProject} 
        onClose={() => setSelectedDetailsProject(null)} 
        project={selectedDetailsProject} 
        onSaveProject={handleSaveEdit}
        onDeleteProject={handleDeleteConfirm}
        onOpenBoard={onOpenBoard} 
        theme={theme} 
      />
    </div>
  );
}