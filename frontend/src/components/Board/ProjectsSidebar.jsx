import { useState } from 'react';
import './ProjectsSidebar.css';

const HARDCODED_PROJECTS = [
  { id: '1', name: 'Finance apps' },
  { id: '2', name: 'Travel apps' },
  { id: '3', name: 'E-Commerce apps' },
  { id: '4', name: 'Education' },
  { id: '5', name: 'Village Tourism' },
  { id: '6', name: 'Real Estate' },
  { id: '7', name: 'Job Finder' },
  { id: '8', name: 'Rent a Car' },
  { id: '9', name: 'Portfolio' },
];

export default function ProjectsSidebar({ activeProjectId, onSelectProject }) {
  const [selectedId, setSelectedId] = useState(activeProjectId || '2');

  const handleSelect = (id) => {
    setSelectedId(id);
    if (onSelectProject) {
      onSelectProject(id);
    }
  };

  return (
    <aside className="projects-preview-sidebar">
      <div className="projects-sidebar-header">
        <h2 className="projects-sidebar-title">All Project</h2>
      </div>

      <div className="projects-list-container">
        <ul className="projects-list">
          {HARDCODED_PROJECTS.map((proj) => {
            const isSelected = selectedId === proj.id;
            return (
              <li
                key={proj.id}
                className={`project-item ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelect(proj.id)}
              >
                <span className="project-bullet">•</span>
                <span className="project-name">{proj.name}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="projects-sidebar-footer">
        <button className="add-project-btn">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add a project</span>
        </button>
      </div>
    </aside>
  );
}
