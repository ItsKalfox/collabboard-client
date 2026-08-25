import { useState } from 'react';
import { useOngoingProjects } from '../../hooks/useDashboardData';
import { Loader2, AlertCircle } from 'lucide-react';
import './OngoingProjectsCard.css';

const CATEGORY_COLORS = ['#111827', '#4b5563', '#9ca3af', '#6b7280', '#374151'];

export default function OngoingProjectsCard() {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { data: response, loading, error, refetch } = useOngoingProjects();
  const data = response?.data;

  // The card shell is always returned to maintain layout

  // Error state
  if (error) {
    return (
      <div className="ongoing-projects-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#ef4444', minHeight: '400px' }}>
        <AlertCircle style={{ marginBottom: '8px' }} />
        <p style={{ margin: 0, fontSize: '0.875rem' }}>{error}</p>
        <button 
          onClick={refetch} 
          style={{ marginTop: '12px', padding: '6px 12px', backgroundColor: '#e5e7eb', borderRadius: '4px', color: '#374151', cursor: 'pointer', border: 'none' }}
        >
          Retry
        </button>
      </div>
    );
  }

  const overallProgress = data?.overallProgress ?? 0;
  const categories = data?.categories || [];

  const handleExportData = () => {
    const dataStr = JSON.stringify(categories, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project_summary.json';
    a.click();
    URL.revokeObjectURL(url);
    alert('Project summary downloaded successfully!');
  };

  return (
    <>
      <div className="ongoing-projects-card">
        {/* Top Header */}
        <div className="ongoing-header">
          <h3 className="ongoing-title">Ongoing projects</h3>
          <div style={{ position: 'relative' }}>
            <button className="ongoing-grid-icon" aria-label="View options" onClick={() => setIsOptionsOpen(!isOptionsOpen)}>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                <rect x="14" y="14" width="7" height="7" rx="1"></rect>
              </svg>
            </button>
            {isOptionsOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '8px', padding: '8px 0', 
                background: 'rgba(31, 41, 55, 0.95)', border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '8px', zIndex: 10, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                minWidth: '150px', backdropFilter: 'blur(10px)'
              }}>
                <div style={{ padding: '8px 16px', fontSize: '13px', color: '#d1d5db', cursor: 'pointer' }} 
                     onClick={() => { setIsOptionsOpen(false); setIsDetailsModalOpen(true); }}
                     onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                     onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  View Details
                </div>
                <div style={{ padding: '8px 16px', fontSize: '13px', color: '#d1d5db', cursor: 'pointer' }} 
                     onClick={() => { setIsOptionsOpen(false); handleExportData(); }}
                     onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                     onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Export Data
                </div>
                <div style={{ padding: '8px 16px', fontSize: '13px', color: '#d1d5db', cursor: 'pointer' }} 
                     onClick={() => { setIsOptionsOpen(false); alert('Settings configuration opened'); }}
                     onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                     onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Settings
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px 0', flex: 1 }}>
            <div className="ongoing-stat-section" style={{ alignItems: 'flex-start', paddingBottom: '0' }}>
              <div className="skeleton-box" style={{ width: '100px', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton-box" style={{ width: '80px', height: '40px', marginBottom: '8px' }} />
              <div className="skeleton-box" style={{ width: '140px', height: '12px' }} />
            </div>
            <div className="ongoing-chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px' }}>
              <div className="skeleton-box" style={{ width: '100%', height: '100%', borderRadius: '8px', opacity: 0.5 }} />
            </div>
            <div className="ongoing-categories-list">
              {[1, 2, 3].map(i => (
                <div key={i} className="ongoing-category-item" style={{ padding: '8px 0' }}>
                  <div className="ongoing-cat-left" style={{ width: '60%' }}>
                    <div className="skeleton-box" style={{ width: '10px', height: '10px', borderRadius: '50%' }} />
                    <div className="skeleton-box" style={{ width: '80%', height: '14px' }} />
                  </div>
                  <div className="skeleton-box" style={{ width: '25%', height: '14px' }} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Main Stat Section */}
        <div className="ongoing-stat-section">
          <span className="ongoing-subtitle">Overall Progress</span>
          <div className="ongoing-percentage">{overallProgress}%</div>
          <span className="ongoing-compare">Compared to last month</span>
        </div>

        {/* Chart Section */}
        <div className="ongoing-chart-container">
          <svg viewBox="0 0 300 80" className="ongoing-sparkline">
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#111827" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6b7280" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <path
              d="M 10 50 Q 60 10, 110 55 T 210 25 T 290 40"
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 10 65 Q 70 30, 140 60 T 250 45 T 290 55"
              fill="none"
              stroke="rgba(0, 0, 0, 0.15)"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Breakdown Category List */}
        <div className="ongoing-categories-list">
          {categories.map((cat, idx) => (
            <div key={cat.name} className="ongoing-category-item">
              <div className="ongoing-cat-left">
                <span className="ongoing-cat-dot" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                <span className="ongoing-cat-label">{cat.name}</span>
              </div>
              <span className="ongoing-cat-value">{cat.completedTasks}/{cat.totalTasks} Tasks</span>
            </div>
          ))}
          {categories.length === 0 && (
             <div className="ongoing-category-item" style={{ justifyContent: 'center', color: '#9ca3af' }}>
               No data available
             </div>
          )}
        </div>
      </>
        )}
      </div>

      {isDetailsModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }} onClick={() => setIsDetailsModalOpen(false)}>
          <div style={{
            background: 'var(--bg-color, #1f2937)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '500px',
            color: 'var(--text-primary, #fff)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Project Details</h2>
              <button onClick={() => setIsDetailsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary, #aaa)', marginBottom: '24px' }}>Detailed breakdown of ongoing tasks and overall progress metrics.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{overallProgress}%</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Overall Completion</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{categories.reduce((acc, cat) => acc + cat.totalTasks, 0)}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Total Tasks</div>
              </div>
            </div>
            <button onClick={() => setIsDetailsModalOpen(false)} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
