import { useState } from 'react';
import ProjectCard from './ProjectCard';
import CreateProjectModal from './CreateProjectModal';
import EditProjectModal from './EditProjectModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import ProjectDetailsModal from './ProjectDetailsModal';
import { Plus, Search } from 'lucide-react';
import { normalizeMember } from '../../mock/mockMembers';
import { calculateProjectProgress } from '../../utils/projectUtils';
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
      normalizeMember('Alex Johnson'),
      normalizeMember('Sara Smith'),
      normalizeMember('David W')
    ],
    createdDate: '06 Aug 2026',
    dueDate: '30 Sep 2026',
    status: 'In Progress',
    progress: 75,
    tasks: [
      {
        id: 't1-1', title: 'Header & Navigation UX', completed: true,
        subtasks: [
          { id: 'st1', label: 'Navbar Responsiveness', done: true },
          { id: 'st2', label: 'Dark Mode Switcher', done: true },
          { id: 'st3', label: 'Mobile Drawer Menu', done: true }
        ]
      },
      {
        id: 't1-2', title: 'Landing Page Hero Section', completed: false,
        subtasks: [
          { id: 'st4', label: 'Hero Copy & Headlines', done: true },
          { id: 'st5', label: 'CTA Button Micro-animations', done: false }
        ]
      }
    ]
  },
  {
    id: 'proj-2',
    name: 'Inventory System',
    description: 'Warehouse Management application for tracking real-time stock levels.',
    color: 'green',
    coverImage: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=500&auto=format&fit=crop&q=80',
    owner: 'Sara Smith',
    members: [
      normalizeMember('Sara Smith'),
      normalizeMember('Alex Johnson')
    ],
    createdDate: '04 Aug 2026',
    dueDate: '15 Oct 2026',
    status: 'In Progress',
    progress: 40,
    tasks: [
      {
        id: 't2-1', title: 'Barcode Scanner Module', completed: false,
        subtasks: [
          { id: 'st2-1', label: 'Camera API Integration', done: true },
          { id: 'st2-2', label: 'Batch Item Lookup', done: false }
        ]
      }
    ]
  },
  {
    id: 'proj-3',
    name: 'Mobile App Launch',
    description: 'Field Service Mobile App for technicians to report on-site issues.',
    color: 'purple',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    owner: 'Alex Johnson',
    members: [
      normalizeMember('Alex Johnson'),
      normalizeMember('Elena V')
    ],
    createdDate: '01 Aug 2026',
    dueDate: '20 Nov 2026',
    status: 'Planning',
    progress: 15,
    tasks: [
      {
        id: 't3-1', title: 'Offline Mode Synchronization', completed: false,
        subtasks: [
          { id: 'st3-1', label: 'IndexedDB Storage Setup', done: false },
          { id: 'st3-2', label: 'Background Sync Worker', done: false }
        ]
      }
    ]
  },
  {
    id: 'proj-4',
    name: 'Customer Portal',
    description: 'Self-Service Support Hub for clients to manage their subscriptions.',
    color: 'yellow',
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500&auto=format&fit=crop&q=80',
    owner: 'John Doe',
    members: [
      normalizeMember('John Doe'),
      normalizeMember('Alex Johnson')
    ],
    createdDate: '28 Jul 2026',
    dueDate: '10 Aug 2026',
    status: 'Completed',
    progress: 100,
    tasks: [
      {
        id: 't4-1', title: 'Billing History & Invoices', completed: true,
        subtasks: [
          { id: 'st4-1', label: 'PDF Invoice Generation', done: true },
          { id: 'st4-2', label: 'Stripe Receipt Webhook', done: true }
        ]
      }
    ]
  },
  {
    id: 'proj-5',
    name: 'Marketing Campaign',
    description: 'Q4 Digital Marketing Campaign targeting enterprise customers.',
    color: 'red',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=80',
    owner: 'Elena V',
    members: [
      normalizeMember('Elena V'),
      normalizeMember('Alex Johnson')
    ],
    createdDate: '15 Jul 2026',
    dueDate: '01 Nov 2026',
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
      normalizeMember('Alex Johnson'),
      normalizeMember('Sara Smith')
    ],
    createdDate: '10 Jul 2026',
    dueDate: '05 Aug 2026',
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
      normalizeMember('Alex Johnson'),
      normalizeMember('David W')
    ],
    createdDate: '02 Jul 2026',
    dueDate: '15 Dec 2026',
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
      normalizeMember('Sara Smith'),
      normalizeMember('Alex Johnson'),
      normalizeMember('Elena V')
    ],
    createdDate: '20 Jun 2026',
    dueDate: '25 Jul 2026',
    status: 'Completed',
    progress: 100
  }
];

export default function ProjectsPage({ theme = 'dark', currentUser, onOpenBoard = () => {} }) {
  const isDark = theme !== 'light';
  const lightCls = isDark ? '' : ' light';

  // Current logged in user name
  const currentUserName = typeof currentUser === 'string' 
    ? currentUser 
    : (currentUser?.name || 'Alex Johnson');

  const [projects, setProjects] = useState(() => {
    return initialProjects.map(p => ({
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
    setProjects(projects.filter((p) => p.id !== projectId));
    if (selectedDetailsProject && selectedDetailsProject.id === projectId) {
      setSelectedDetailsProject(null);
    }
  };

  const filteredBySearch = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const ownedProjects = filteredBySearch.filter(p => p.owner === currentUserName);
  const partOfProjects = filteredBySearch.filter(p => 
    p.owner !== currentUserName && 
    Array.isArray(p.members) && 
    p.members.some(m => (typeof m === 'string' ? m : m.name) === currentUserName)
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
        onOpenBoard={onOpenBoard} 
        theme={theme} 
      />
    </div>
  );
}