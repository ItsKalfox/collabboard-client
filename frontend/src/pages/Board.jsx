import { useState } from 'react';
import ProjectsSidebar from '../components/Board/ProjectsSidebar';
import BoardHeader from '../components/Board/BoardHeader';
import KanbanBoard from '../components/Board/KanbanBoard';
import './Board.css';

const PROJECTS_MAP = {
  '1': 'Finance apps',
  '2': 'Travel apps',
  '3': 'E-Commerce apps',
  '4': 'Education',
  '5': 'Village Tourism',
  '6': 'Real Estate',
  '7': 'Job Finder',
  '8': 'Rent a Car',
  '9': 'Portfolio',
};

export default function Board() {
  const [selectedProjectId, setSelectedProjectId] = useState('2');

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
  };

  const currentProjectName = PROJECTS_MAP[selectedProjectId] || 'Travel apps';

  return (
    <div className="board-page-container">
      {/* Left side: Projects Preview Sidebar */}
      <ProjectsSidebar
        activeProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
      />

      {/* Right side: Main Board Workspace */}
      <div className="board-main-view">
        {/* Top Header & Navigation */}
        <BoardHeader projectName={currentProjectName} />

        {/* Kanban Board Columns */}
        <div className="board-content-area">
          <KanbanBoard />
        </div>
      </div>
    </div>
  );
}
