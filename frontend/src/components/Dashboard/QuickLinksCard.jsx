import { useState } from 'react';
import { useRecentFiles } from '../../hooks/useDashboardData';
import { Loader2, AlertCircle } from 'lucide-react';
import './QuickLinksCard.css';

export default function QuickLinksCard() {
  const [activeCategory] = useState('All files');
  const { data: response, loading, error, refetch } = useRecentFiles();
  const filesData = response?.data || [];

  const getFileDetails = (filename) => {
    const lowerName = filename.toLowerCase();
    if (lowerName.endsWith('.pdf')) {
      return { type: 'pdf', color: '#ef4444' };
    } else if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) {
      return { type: 'word', color: '#3b82f6' };
    } else if (lowerName.endsWith('.fig')) {
      return { type: 'figma', color: '#a855f7' };
    } else {
      return { type: 'other', color: '#6b7280' };
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        );
      case 'word':
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        );
      case 'figma':
      default:
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M12 2H2v10h10V2z"></path>
            <path d="M22 2h-10v10h10V2z"></path>
            <path d="M12 12H2v10h10V12z"></path>
            <path d="M22 12h-10v10h10V12z"></path>
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
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <button className="category-select-btn">
            <span>{activeCategory}</span>
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" className="chevron">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>

        <button className="grid-toggle-btn" aria-label="Toggle layout">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1"></rect>
          </svg>
        </button>
      </div>

      {/* File Quick Link Items */}
      <div className="quick-links-list" style={{ minHeight: '150px', position: 'relative' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', position: 'absolute' }}>
            <Loader2 className="animate-spin" style={{ color: '#9ca3af' }} />
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', position: 'absolute', color: '#ef4444' }}>
            <AlertCircle style={{ marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>{error}</p>
            <button 
              onClick={refetch} 
              style={{ marginTop: '8px', padding: '4px 8px', backgroundColor: '#e5e7eb', borderRadius: '4px', color: '#374151', cursor: 'pointer', border: 'none', fontSize: '12px' }}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {filesData.map((file) => {
              const details = getFileDetails(file.filename);
              return (
                <a 
                  key={file.id} 
                  href={file.url || '#'} 
                  target={file.url ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="quick-file-pill">
                    <div className="file-icon-badge" style={{ color: details.color }}>
                      {getFileIcon(details.type)}
                    </div>
                    <span className="file-title">{file.filename}</span>
                  </div>
                </a>
              );
            })}
            {filesData.length === 0 && (
               <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', width: '100%' }}>
                 No recent files.
               </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
