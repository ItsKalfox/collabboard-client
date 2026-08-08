import React, { useState } from 'react';
import { initialProjects } from './mockData';
import ProjectCard from './ProjectCard';
import CreateProjectModal from './CreateProjectModal';
import EditProjectModal from './EditProjectModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import ProjectDetailsModal from './ProjectDetailsModal';
import { Plus } from 'lucide-react';
import './projects.css';

export default function ProjectsPage({ theme = 'dark', toggleTheme, onOpenBoard = () => {} }) {
  const isDark = theme !== 'light';
  const lightCls = isDark ? '' : ' light';

  const [projects, setProjects] = useState(initialProjects);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [selectedDetailsProject, setSelectedDetailsProject] = useState(null);

  const handleCreateProject = (newProject) => {
    setProjects([newProject, ...projects]);
  };

  const handleSaveEdit = (updatedProject) => {
    setProjects(projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
  };

  const handleDeleteConfirm = (projectId) => {
    setProjects(projects.filter((p) => p.id !== projectId));
  };

  return (
    <div className="projects-page">
      <div className={`projects-header${lightCls}`}>
        <div>
          <h2 className={`projects-title${lightCls}`}>Active Projects</h2>
          <p className={`projects-subtitle${lightCls}`}>
            Select a project board to view or create a new project
          </p>
        </div>

        <button onClick={() => setIsCreateOpen(true)} className="btn-primary" id="create-project-btn">
          <Plus size={16} strokeWidth={3} />
          <span>New Project</span>
        </button>
      </div>

      {projects.length > 0 ? (
        <div className="projects-grid">
          {projects.map((project) => (
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
      ) : (
        <div className={`${isDark ? 'glass-card' : 'glass-card-light'} empty-state${lightCls}`}>
          <p className={`empty-state-title${lightCls}`}>No projects found</p>
          <p className={`empty-state-sub${lightCls}`}>Click below to create your first project.</p>
          <button onClick={() => setIsCreateOpen(true)} className="btn-primary">
            <Plus size={14} strokeWidth={3} />
            <span>New Project</span>
          </button>
        </div>
      )}

      <CreateProjectModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreate={handleCreateProject} theme={theme} />
      <EditProjectModal isOpen={!!editingProject} onClose={() => setEditingProject(null)} project={editingProject} onSave={handleSaveEdit} theme={theme} />
      <DeleteConfirmModal isOpen={!!deletingProject} onClose={() => setDeletingProject(null)} project={deletingProject} onDeleteConfirm={handleDeleteConfirm} theme={theme} />
      <ProjectDetailsModal isOpen={!!selectedDetailsProject} onClose={() => setSelectedDetailsProject(null)} project={selectedDetailsProject} onOpenBoard={onOpenBoard} theme={theme} /></div>
  );
}