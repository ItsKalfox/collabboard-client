import { useRecentProjects } from '../../hooks/useDashboardData';
import { Loader2, AlertCircle } from 'lucide-react';
import './QuickLinksCard.css';

const getInitials = (name) => {
  if (!name) return '';
  const parts = name.split(' ');
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
};

export default function QuickLinksCard() {
  const { data: response, loading, error, refetch } = useRecentProjects();
  const projectFiles = response?.data || [];

  const handleProjectClick = (projectId) => {
    localStorage.setItem('openProjectModalId', projectId);
    window.history.pushState({}, '', '/projects');
    window.dispatchEvent(new Event('popstate'));
  };

  const getProjectIcon = (type, color) => {
    switch (type) {
      case 'pdf':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        );
      case 'figma':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"></path>
            <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"></path>
            <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"></path>
            <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"></path>
            <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"></path>
          </svg>
        );
      case 'code':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        );
      case 'doc':
      default:
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        );
    }
  };

  if (error) {
    return (
      <div className="quick-links-card" style={{ justifyContent: 'center', alignItems: 'center', color: '#ef4444' }}>
        <AlertCircle style={{ marginBottom: '8px' }} />
        <p style={{ margin: 0, fontSize: '0.875rem' }}>{error}</p>
        <button onClick={refetch} style={{ marginTop: '12px', padding: '6px 12px', backgroundColor: '#e5e7eb', borderRadius: '4px', color: '#374151', cursor: 'pointer', border: 'none' }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="quick-links-card">
      <div className="quick-links-header">
        <div className="quick-links-header-left">
          <div className="folder-icon-circle">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
              All projects
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="quick-links-list" style={{ minHeight: '150px', display: 'flex', flexDirection: 'column' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="project-card">
              <div className="project-card-header">
                <div className="project-card-title-group">
                  <div className="skeleton-box" style={{ width: '100px', height: '16px', borderRadius: '4px' }} />
                </div>
              </div>
              <div className="project-card-footer">
                 <div className="skeleton-box" style={{ width: '60px', height: '20px', borderRadius: '12px' }} />
                 <div className="project-avatars">
                   <div className="skeleton-box" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                   <div className="skeleton-box" style={{ width: '24px', height: '24px', borderRadius: '50%', marginLeft: '-8px' }} />
                 </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="quick-links-list" style={{ minHeight: '150px', display: 'flex', flexDirection: 'column' }}>
          {projectFiles.slice(0, 3).map((project) => (
            <div key={project.id} className="project-card" onClick={() => handleProjectClick(project._id || project.id)}>
              <div className="project-card-header">
                <div className="project-card-title-group">
                  <span className="project-card-title" style={{ marginLeft: 0 }}>{project.name}</span>
                </div>
              </div>
              
              <div className="project-card-footer">
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>Team members</span>
                  <div className="project-avatars">
                    {project.members && project.members.map((member, i) => (
                      member.avatar ? (
                        <img key={i} src={member.avatar} alt={member.name} className="project-avatar" title={member.name} />
                      ) : (
                        <div key={i} className="project-avatar" title={member.name} style={{ backgroundColor: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                          {getInitials(member.name)}
                        </div>
                      )
                    ))}
                  </div>
              </div>
            </div>
          ))}
          {projectFiles.length === 0 && (
            <div style={{ textAlign: 'center', color: '#9ca3af', width: '100%' }}>No projects found.</div>
          )}
        </div>
      )}
    </div>
  );
}
