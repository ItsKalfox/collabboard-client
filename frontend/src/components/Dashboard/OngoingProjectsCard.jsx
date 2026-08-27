import { useOngoingProjects } from '../../hooks/useDashboardData';
import { Loader2, AlertCircle } from 'lucide-react';
import './OngoingProjectsCard.css';

export default function OngoingProjectsCard() {
  const { data: response, loading, error, refetch } = useOngoingProjects();
  const data = response?.data;

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
  
  const statusStats = data?.statusStats || { todo: 0, in_progress: 0, review: 0, completed: 0 };
  const totalTasks = statusStats.todo + statusStats.in_progress + statusStats.review + statusStats.completed;
  
  const todoPct = totalTasks ? (statusStats.todo / totalTasks) * 100 : 0;
  const inProgressPct = totalTasks ? (statusStats.in_progress / totalTasks) * 100 : 0;
  const reviewPct = totalTasks ? (statusStats.review / totalTasks) * 100 : 0;
  const completedPct = totalTasks ? (statusStats.completed / totalTasks) * 100 : 0;

  return (
    <div className="ongoing-projects-card">
      {/* Top Header */}
      <div className="ongoing-header">
        <h3 className="ongoing-title">Ongoing projects</h3>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px 0', flex: 1 }}>
          <div className="ongoing-stat-section" style={{ alignItems: 'flex-start', paddingBottom: '0' }}>
            <div className="skeleton-box" style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
            <div className="skeleton-box" style={{ width: '80px', height: '40px' }} />
          </div>
          <div className="ongoing-chart-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="skeleton-box" style={{ width: '140px', height: '14px' }} />
              <div className="skeleton-box" style={{ width: '100px', height: '14px' }} />
            </div>
            <div className="skeleton-box" style={{ width: '100%', height: '12px', borderRadius: '6px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'max-content max-content', gap: '12px 40px', marginTop: '12px', justifyContent: 'center' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="skeleton-box" style={{ width: '10px', height: '10px', borderRadius: '50%' }} />
                  <div className="skeleton-box" style={{ width: '80px', height: '14px' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Main Stat Section */}
          <div className="ongoing-stat-section">
            <span className="ongoing-subtitle">Overall Progress</span>
            <div className="ongoing-percentage">{overallProgress}%</div>
          </div>

          {/* Chart Section */}
          <div className="ongoing-chart-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
              <span>Task Status Breakdown</span>
              <span>{totalTasks} Total Tasks</span>
            </div>
            
            <div style={{ display: 'flex', height: '12px', width: '100%', borderRadius: '6px', overflow: 'hidden', background: '#e5e7eb' }}>
              <div style={{ width: `${completedPct}%`, background: '#10b981', transition: 'width 0.5s ease' }} title={`Completed: ${statusStats.completed}`} />
              <div style={{ width: `${reviewPct}%`, background: '#f59e0b', transition: 'width 0.5s ease' }} title={`Review: ${statusStats.review}`} />
              <div style={{ width: `${inProgressPct}%`, background: '#3b82f6', transition: 'width 0.5s ease' }} title={`In Progress: ${statusStats.in_progress}`} />
              <div style={{ width: `${todoPct}%`, background: '#9ca3af', transition: 'width 0.5s ease' }} title={`To Do: ${statusStats.todo}`} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'max-content max-content', gap: '12px 40px', fontSize: '13px', color: 'var(--text-secondary, #9ca3af)', marginTop: '12px', justifyContent: 'center' }}>
              {/* Top Left: To Do */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9ca3af' }} />
                <span>To Do ({statusStats.todo})</span>
              </div>
              {/* Top Right: In Progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} />
                <span>In Progress ({statusStats.in_progress})</span>
              </div>
              {/* Bottom Left: Review */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <span>Review ({statusStats.review})</span>
              </div>
              {/* Bottom Right: Completed */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                <span>Completed ({statusStats.completed})</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
