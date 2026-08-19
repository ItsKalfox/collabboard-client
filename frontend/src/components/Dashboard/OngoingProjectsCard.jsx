import { useOngoingProjects } from '../../hooks/useDashboardData';
import { Loader2, AlertCircle } from 'lucide-react';
import './OngoingProjectsCard.css';

const CATEGORY_COLORS = ['#111827', '#4b5563', '#9ca3af', '#6b7280', '#374151'];

export default function OngoingProjectsCard() {
  const { data: response, loading, error, refetch } = useOngoingProjects();
  const data = response?.data;

  // Fallback if loading to prevent layout shift
  if (loading) {
    return (
      <div className="ongoing-projects-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Loader2 className="animate-spin" style={{ color: '#6b7280' }} />
      </div>
    );
  }

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

  return (
    <div className="ongoing-projects-card">
      {/* Top Header */}
      <div className="ongoing-header">
        <h3 className="ongoing-title">Ongoing projects</h3>
        <button className="ongoing-grid-icon" aria-label="View options">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1"></rect>
          </svg>
        </button>
      </div>

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
    </div>
  );
}
