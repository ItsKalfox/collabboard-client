import './TeamCard.css';

export default function TeamCard({ data }) {
  const badge = data?.badge || '+5';
  const stats = data?.stats || [
    { type: "members", number: 1240, change: 124 },
    { type: "hours", number: 562, change: 124 },
    { type: "activity", number: 25 }
  ];
  const departments = data?.departments || [
    {
      name: "UX UI Design",
      subtitle: "Design and creative",
      avatars: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      ],
      progressPercent: 68
    },
    {
      name: "Marketing",
      subtitle: "Design and creative",
      avatars: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
      ],
      progressPercent: 45
    },
    {
      name: "Development",
      subtitle: "Tech & Engineering",
      barHeights: [35, 55, 40, 70, 60, 90, 75, 100]
    }
  ];

  const membersStat = stats.find(s => s.type === 'members') || { number: 1240, change: 124 };
  const hoursStat = stats.find(s => s.type === 'hours') || { number: 562, change: 124 };
  const activityStat = stats.find(s => s.type === 'activity') || { number: 25 };

  const uxDept = departments.find(d => d.name === 'UX UI Design') || departments[0];
  const mktDept = departments.find(d => d.name === 'Marketing') || departments[1] || departments[0];
  const devDept = departments.find(d => d.name === 'Development') || departments[2] || departments[0];

  const devBarHeights = devDept?.barHeights || [35, 55, 40, 70, 60, 90, 75, 100];

  return (
    <div className="team-card">
      {/* Outer Card Header */}
      <div className="team-card-header">
        <div className="team-header-left">
          <h3 className="team-title">Team</h3>
          <span className="team-badge">{badge}</span>
        </div>

        {/* Header Stats */}
        <div className="team-stats-group">
          {/* Stat 1 */}
          <div className="team-stat-item">
            <div className="stat-icon-circle">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <span className="stat-number">{membersStat.number}</span>
            {membersStat.change && (
              <div className="stat-change positive">
                <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="3" fill="none">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
                <span>+{membersStat.change}</span>
              </div>
            )}
          </div>

          {/* Stat 2 */}
          <div className="team-stat-item">
            <div className="stat-icon-circle">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <span className="stat-number">{hoursStat.number}</span>
            {hoursStat.change && (
              <div className="stat-change positive">
                <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="3" fill="none">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
                <span>+{hoursStat.change}</span>
              </div>
            )}
          </div>

          {/* Stat 3 */}
          <div className="team-stat-item">
            <div className="stat-icon-circle">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <span className="stat-number">{activityStat.number}</span>
            <div className="stat-sparkline">
              <svg viewBox="0 0 50 16" width="40" height="14">
                <path
                  d="M 2 10 Q 12 2, 22 12 T 42 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Inner Dark Panel */}
      <div className="team-dark-panel">
        <div className="team-columns-grid">
          {/* Column 1: UX UI Design */}
          <div className="team-dept-col">
            <div className="dept-info">
              <h4 className="dept-name">{uxDept?.name || 'UX UI Design'}</h4>
              <span className="dept-sub">{uxDept?.subtitle || 'Design and creative'}</span>
            </div>

            <div className="dept-avatars">
              {(uxDept?.avatars || []).map((url, i) => (
                <img key={i} src={url} alt="Team member" className="dept-avatar" />
              ))}
            </div>

            <div className="dept-progress-block">
              <div className="progress-labels">
                <span>PROGRESS</span>
                <span>GOAL</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${uxDept?.progressPercent || 68}%` }} />
              </div>
            </div>

            <div className="dept-actions">
              <button className="dept-action-btn">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
              <button className="dept-action-btn">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
              </button>
            </div>
          </div>

          {/* Column 2: Marketing */}
          <div className="team-dept-col">
            <div className="dept-info">
              <h4 className="dept-name">{mktDept?.name || 'Marketing'}</h4>
              <span className="dept-sub">{mktDept?.subtitle || 'Design and creative'}</span>
            </div>

            <div className="dept-avatars">
              {(mktDept?.avatars || []).map((url, i) => (
                <img key={i} src={url} alt="Team member" className="dept-avatar" />
              ))}
            </div>

            <div className="dept-progress-block">
              <div className="progress-labels">
                <span>PROGRESS</span>
                <span>GOAL</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${mktDept?.progressPercent || 45}%` }} />
              </div>
            </div>

            <div className="dept-actions">
              <button className="dept-action-btn">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
              <button className="dept-action-btn">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
              </button>
            </div>
          </div>

          {/* Column 3: Development / Activity Chart */}
          <div className="team-dept-col chart-col">
            <div className="dept-info">
              <h4 className="dept-name">{devDept?.name || 'Development'}</h4>
              <span className="dept-sub">{devDept?.subtitle || 'Tech & Engineering'}</span>
            </div>

            <div className="dev-chart-container">
              {devBarHeights.map((h, i) => (
                <div key={i} className="dev-chart-bar-wrapper">
                  <div className="dev-chart-bar" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
