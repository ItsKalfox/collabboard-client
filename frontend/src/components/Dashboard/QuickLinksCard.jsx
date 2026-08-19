import { useState } from 'react';
import './QuickLinksCard.css';

export default function QuickLinksCard() {
  const [activeCategory, setActiveCategory] = useState('All projects');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isGridView, setIsGridView] = useState(false);
  
  const [projectFiles] = useState([
    { id: '1', name: 'project_requirements.docx', type: 'doc', color: '#60a5fa' },
    { id: '2', name: 'design_brief.pdf', type: 'pdf', color: '#fb7185' }
  ]);

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

  return (
    <div className="quick-links-card">
      {/* Header */}
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

      {/* Project Items List */}
      <div className="quick-links-list" style={{ minHeight: '150px', display: isGridView ? 'grid' : 'flex', gridTemplateColumns: isGridView ? '1fr 1fr' : 'none' }}>
        {projectFiles.map((file) => (
          <div 
            key={file.id} 
            className="quick-file-pill"
            onClick={() => console.log('Selected file:', file.id)}
          >
            <div className="file-icon-badge">
              {getProjectIcon(file.type, file.color)}
            </div>
            <span className="file-title">{file.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
