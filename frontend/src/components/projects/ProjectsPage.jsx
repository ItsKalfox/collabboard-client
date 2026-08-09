import React, { useState } from 'react';
import ProjectCard from './ProjectCard';
import CreateProjectModal from './CreateProjectModal';
import EditProjectModal from './EditProjectModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import ProjectDetailsModal from './ProjectDetailsModal';
import { Plus, Search } from 'lucide-react';
import './projects.css';

const initialProjects = [
  {
    id: 'proj-1',
    name: 'Website Redesign',
    description: 'Company Website overhaul with new branding and improved user experience.',
    color: 'blue',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80',
    owner: 'Alex Johnson',
    members: [
      { name: 'Alex Johnson', initials: 'AJ', bg: '#3b82f6', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
      { name: 'Sara Smith', initials: 'SS', bg: '#10b981', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
      { name: 'David W', initials: 'DW', bg: '#f59e0b', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80' }
    ],
    createdDate: '06 Aug 2026',
    status: 'In Progress',
    progress: 75
  },
  {
    id: 'proj-2',
    name: 'Inventory System',
    description: 'Warehouse Management application for tracking real-time stock levels.',
    color: 'green',
    coverImage: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=500&auto=format&fit=crop&q=80',
    owner: 'Sara Smith',
    members: [
      { name: 'Sara Smith', initials: 'SS', bg: '#10b981', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
      { name: 'Alex Johnson', initials: 'AJ', bg: '#3b82f6', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }
    ],
    createdDate: '04 Aug 2026',
    status: 'In Progress',
    progress: 40
  },
  {
    id: 'proj-3',
    name: 'Mobile App Launch',
    description: 'Field Service Mobile App for technicians to report on-site issues.',
    color: 'purple',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    owner: 'Alex Johnson',
    members: [
      { name: 'Alex Johnson', initials: 'AJ', bg: '#3b82f6', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
      { name: 'Elena V', initials: 'EV', bg: '#f43f5e', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80' }
    ],
    createdDate: '01 Aug 2026',
    status: 'Planning',
    progress: 15
  },
  {
    id: 'proj-4',
    name: 'Customer Portal',
    description: 'Self-Service Support Hub for clients to manage their subscriptions.',
    color: 'yellow',
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500&auto=format&fit=crop&q=80',
    owner: 'John Doe',
    members: [
      { name: 'John Doe', initials: 'JD', bg: '#8b5cf6', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
      { name: 'Alex Johnson', initials: 'AJ', bg: '#3b82f6', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
    ],
    createdDate: '28 Jul 2026',
    status: 'Completed',
    progress: 100
  },
  {
    id: 'proj-5',
    name: 'Marketing Campaign',
    description: 'Q4 Digital Marketing Campaign targeting enterprise customers.',
    color: 'red',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=80',
    owner: 'Elena V',
    members: [
      { name: 'Elena V', initials: 'EV', bg: '#f43f5e', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80' },
      { name: 'Alex Johnson', initials: 'AJ', bg: '#3b82f6', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }
    ],
    createdDate: '15 Jul 2026',
    status: 'In Progress',
    progress: 60
  },
  {
    id: 'proj-6',
    name: 'Data Analytics Dashboard',
    description: 'Internal dashboard for visualizing sales metrics.',
    color: 'blue',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80',
    owner: 'Alex Johnson',
    members: [
      { name: 'Alex Johnson', initials: 'AJ', bg: '#3b82f6', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
      { name: 'Sara Smith', initials: 'SS', bg: '#10b981', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' }
    ],
    createdDate: '10 Jul 2026',
    status: 'Completed',
    progress: 100
  },
  {
    id: 'proj-7',
    name: 'Authentication Service',
    description: 'Migrating legacy auth to standard OAuth2 and SSO.',
    color: 'purple',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=80',
    owner: 'Alex Johnson',
    members: [
      { name: 'Alex Johnson', initials: 'AJ', bg: '#3b82f6', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
      { name: 'David W', initials: 'DW', bg: '#f59e0b', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80' }
    ],
    createdDate: '02 Jul 2026',
    status: 'In Progress',
    progress: 30
  },
  {
    id: 'proj-8',
    name: 'User Research Q3',
    description: 'Interviewing power users to understand feature gaps.',
    color: 'green',
    coverImage: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=80',
    owner: 'Sara Smith',
    members: [
      { name: 'Sara Smith', initials: 'SS', bg: '#10b981', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
      { name: 'Alex Johnson', initials: 'AJ', bg: '#3b82f6', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
      { name: 'Elena V', initials: 'EV', bg: '#f43f5e', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80' }
    ],
    createdDate: '20 Jun 2026',
    status: 'Completed',
    progress: 100
  }
];

export default function ProjectsPage({ theme = 'dark', toggleTheme, onOpenBoard = () => {} }) {
  const isDark = theme !== 'light';
  const lightCls = isDark ? '' : ' light';

  const [projects, setProjects] = useState(initialProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [selectedDetailsProject, setSelectedDetailsProject] = useState(null);

  const currentUser = 'Alex Johnson';

  const handleCreateProject = (newProject) => {
    setProjects([newProject, ...projects]);
  };

  const handleSaveEdit = (updatedProject) => {
    setProjects(projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
  };

  const handleDeleteConfirm = (projectId) => {
    setProjects(projects.filter((p) => p.id !== projectId));
  };

  const filteredBySearch = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ownedProjects = filteredBySearch.filter(p => p.owner === currentUser);
  const partOfProjects = filteredBySearch.filter(p => p.owner !== currentUser && p.members.some(m => m.name === currentUser));

  return (
    <div className={`projects-page${lightCls}`}>
      <div className={`projects-header${lightCls}`}>
        <div>
          <h2 className={`projects-title${lightCls}`}>Active Projects</h2>
          <p className={`projects-subtitle${lightCls}`}>
            Select a project board to view or create a new project
          </p>
        </div>

        <div className="projects-header-actions">
          <div className={`projects-search-bar${lightCls}`}>
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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

      <CreateProjectModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreate={handleCreateProject} theme={theme} />
      <EditProjectModal isOpen={!!editingProject} onClose={() => setEditingProject(null)} project={editingProject} onSave={handleSaveEdit} theme={theme} />
      <DeleteConfirmModal isOpen={!!deletingProject} onClose={() => setDeletingProject(null)} project={deletingProject} onDeleteConfirm={handleDeleteConfirm} theme={theme} />
      <ProjectDetailsModal isOpen={!!selectedDetailsProject} onClose={() => setSelectedDetailsProject(null)} project={selectedDetailsProject} onOpenBoard={onOpenBoard} theme={theme} />
    </div>
  );
}