import './ProjectsSidebar.css';

export default function ProjectsSidebar({ projects = [], activeProjectId, onSelectProject }) {
  const handleSelect = (id) => {
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
          {projects.map((proj) => {
            const isSelected = activeProjectId === proj.id;
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
