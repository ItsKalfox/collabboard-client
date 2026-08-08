import { useState } from 'react';
import ProjectsSidebar from '../components/Board/ProjectsSidebar';
import './Board.css';

export default function Board() {
  const [selectedProjectId, setSelectedProjectId] = useState('2');

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
  };

  return (
    <div className="board-page-container">
      {/* Left side: Projects Preview Sidebar */}
      <ProjectsSidebar
        activeProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
      />

      {/* Right side: Main Board Workspace */}
      <div className="board-main-view">
        <div className="board-workspace-placeholder">
          <div className="board-placeholder-header">
            <h2>Board Workspace</h2>
            <p>Select a project from the left preview sidebar to manage its boards.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
