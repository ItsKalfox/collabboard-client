import './OngoingProjectsCard.css';

export default function OngoingProjectsCard() {
  const categories = [
    { label: 'Finance', value: '148,800', color: '#111827' },
    { label: 'Design Reviews', value: '15,200', color: '#4b5563' },
    { label: 'Other', value: '00,00', color: '#9ca3af' },
  ];

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
        <span className="ongoing-subtitle">Sales trend</span>
        <div className="ongoing-percentage">68,5%</div>
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
        {categories.map((cat) => (
          <div key={cat.label} className="ongoing-category-item">
            <div className="ongoing-cat-left">
              <span className="ongoing-cat-dot" style={{ backgroundColor: cat.color }} />
              <span className="ongoing-cat-label">{cat.label}</span>
            </div>
            <span className="ongoing-cat-value">{cat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
