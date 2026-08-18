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
                <span className="project-name">{proj.name}</span>
              </li>
            );
          })}
        </ul>
      </div>


    </aside>
  );
}
