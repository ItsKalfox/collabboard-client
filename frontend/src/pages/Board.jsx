import { useState } from 'react';
import ProjectsSidebar from '../components/Board/ProjectsSidebar';
import BoardHeader from '../components/Board/BoardHeader';
import KanbanBoard from '../components/Board/KanbanBoard';
import './Board.css';

const PROJECTS = [
  { id: '1', name: 'Finance apps', description: 'Financial tracking and management.', members: [{ initials: 'SC' }], priority: 'High', deadline: '12 Dec 2023', tags: ['Fintech'] },
  { id: '2', name: 'Travel apps', description: 'Explore the world with our new app.', members: [{ initials: 'SC' }, { initials: 'JD' }, { initials: 'AK' }], priority: 'Normal', deadline: '30 Dec 2023', tags: ['UI Design', 'UX Design'] },
  { id: '3', name: 'E-Commerce apps', description: 'Online shopping platform.', members: [{ initials: 'JD' }, { initials: 'AK' }], priority: 'High', deadline: '15 Jan 2024', tags: ['E-Commerce'] },
  { id: '4', name: 'Education', description: 'Learning management system.', members: [{ initials: 'SC' }], priority: 'Low', deadline: '20 Jan 2024', tags: ['EdTech'] },
  { id: '5', name: 'Village Tourism', description: 'Promoting local tourism.', members: [{ initials: 'JD' }], priority: 'Normal', deadline: '05 Feb 2024', tags: ['Travel'] },
  { id: '6', name: 'Real Estate', description: 'Property listing and management.', members: [{ initials: 'AK' }], priority: 'High', deadline: '10 Feb 2024', tags: ['Real Estate'] },
  { id: '7', name: 'Job Finder', description: 'Connect job seekers and employers.', members: [{ initials: 'SC' }, { initials: 'AK' }], priority: 'Normal', deadline: '25 Feb 2024', tags: ['Jobs'] },
  { id: '8', name: 'Rent a Car', description: 'Car rental services.', members: [{ initials: 'JD' }], priority: 'Low', deadline: '01 Mar 2024', tags: ['Automotive'] },
  { id: '9', name: 'Portfolio', description: 'Personal portfolio website.', members: [{ initials: 'SC' }], priority: 'Normal', deadline: '15 Mar 2024', tags: ['Portfolio'] },
];

export default function Board() {
  const [selectedProjectId, setSelectedProjectId] = useState('2');

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
  };

  const currentProject = PROJECTS.find((p) => p.id === selectedProjectId) || PROJECTS[1];

  return (
    <div className="board-page-container">
      {/* Left side: Projects Preview Sidebar */}
      <ProjectsSidebar
        projects={PROJECTS}
        activeProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
      />

      {/* Right side: Main Board Workspace */}
      <div className="board-main-view">
        {/* Top Header & Navigation */}
        <BoardHeader project={currentProject} />

        {/* Kanban Board Columns */}
        <div className="board-content-area">
          <KanbanBoard />
        </div>
      </div>
    </div>
  );
}
