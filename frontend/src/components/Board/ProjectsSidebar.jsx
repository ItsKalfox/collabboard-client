import './ProjectsSidebar.css';
import { isProjectOwner, isProjectMember } from '../../utils/projectUtils';

const ChevronDown = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export default function ProjectsSidebar({ projects = [], activeProjectId, onSelectProject, currentUser }) {
  const handleSelect = (id) => {
    if (onSelectProject) {
      onSelectProject(id);
    }
  };

  const ownedProjects = projects.filter(p => isProjectOwner(p, currentUser));
  const partOfProjects = projects.filter(p => !isProjectOwner(p, currentUser) && isProjectMember(p, currentUser));

  return (
    <aside className="projects-preview-sidebar">
      <div className="projects-sidebar-header">
        <h2 className="projects-sidebar-title">Projects</h2>
      </div>

      <div className="projects-list-container">
        {ownedProjects.length > 0 && (
          <div className="sidebar-project-category">
            <div className="sidebar-category-header">
              <h3 className="sidebar-category-title">My Projects</h3>
              <div className="sidebar-category-divider"></div>
              <div className="sidebar-category-chevron"><ChevronDown /></div>
            </div>
            <ul className="projects-list">
              {ownedProjects.map((proj) => {
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
        )}

        {partOfProjects.length > 0 && (
          <div className="sidebar-project-category">
            <div className="sidebar-category-header">
              <h3 className="sidebar-category-title">Team Projects</h3>
              <div className="sidebar-category-divider"></div>
              <div className="sidebar-category-chevron"><ChevronDown /></div>
            </div>
            <ul className="projects-list">
              {partOfProjects.map((proj) => {
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
        )}

        {ownedProjects.length === 0 && partOfProjects.length === 0 && (
          <p className="sidebar-empty-text">No projects found.</p>
        )}
      </div>
    </aside>
  );
}
