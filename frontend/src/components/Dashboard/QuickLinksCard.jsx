import { useState } from 'react';
import { useRecentProjects } from '../../hooks/useDashboardData';
import { Loader2, AlertCircle } from 'lucide-react';
import { getInitials } from '../../mock/mockMembers';
import './QuickLinksCard.css';

export default function QuickLinksCard() {
  const [activeCategory, setActiveCategory] = useState('All projects');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isGridView, setIsGridView] = useState(false);
  
  const { data: response, loading, error, refetch } = useRecentProjects();
  const projectFiles = response?.data || [];

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
            <button className="category-select-btn" onClick={() => setIsCategoryOpen(!isCategoryOpen)}>
              <span>{activeCategory}</span>
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" className="chevron" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {isCategoryOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: '8px', padding: '8px 0', 
                background: 'rgba(24, 24, 27, 0.95)', border: '1px solid #2d2f36', 
                borderRadius: '8px', zIndex: 10, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                minWidth: '150px', backdropFilter: 'blur(10px)'
              }}>
                {['All projects', 'Active', 'Completed', 'Archived'].map(cat => (
                  <div key={cat} style={{ padding: '8px 16px', fontSize: '13px', color: '#d1d5db', cursor: 'pointer', transition: 'background 0.2s' }} 
                       onClick={() => { setActiveCategory(cat); setIsCategoryOpen(false); }}
                       onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                       onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button className="grid-toggle-btn" aria-label="Toggle layout" onClick={() => setIsGridView(!isGridView)}>
          {isGridView ? (
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"></rect>
              <rect x="14" y="3" width="7" height="7" rx="1"></rect>
              <rect x="3" y="14" width="7" height="7" rx="1"></rect>
              <rect x="14" y="14" width="7" height="7" rx="1"></rect>
            </svg>
          )}
        </button>
      </div>

      {loading ? (
        <div className="quick-links-list" style={{ minHeight: '150px', display: isGridView ? 'grid' : 'flex', gridTemplateColumns: isGridView ? '1fr 1fr' : 'none' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="project-card">
              <div className="project-card-header">
                <div className="project-card-title-group">
                  <div className="skeleton-box file-icon-badge" style={{ border: 'none' }} />
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
        <div className="quick-links-list" style={{ minHeight: '150px', display: isGridView ? 'grid' : 'flex', gridTemplateColumns: isGridView ? '1fr 1fr' : 'none' }}>
          {projectFiles.slice(0, 3).map((project) => (
            <div key={project.id} className="project-card" onClick={() => console.log('Selected project:', project.id)}>
              <div className="project-card-header">
                <div className="project-card-title-group">
                  <div className="file-icon-badge">
                    {getProjectIcon(project.type, project.color)}
                  </div>
                  <span className="project-card-title">{project.name}</span>
                </div>
              </div>
              
              <div className="project-card-footer">
                 <span className={`project-card-status ${project.status === 'active' ? 'active' : 'completed'}`}>
                    {project.status === 'active' ? 'In Progress' : 'Completed'}
                  </span>
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
