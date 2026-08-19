import { useState } from 'react';
import { useTeamProgress } from '../../hooks/useDashboardData';
import { Loader2, AlertCircle } from 'lucide-react';
import './TeamCard.css';

export default function TeamCard() {
  const [activeAvatar, setActiveAvatar] = useState(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const { data: response, loading, error, refetch } = useTeamProgress();
  const teamsData = response?.data || [];

  const devBarHeights = [35, 55, 40, 70, 60, 90, 75, 100];

  return (
    <>
      <div className="team-card">
        {/* Outer Card Header */}
        <div className="team-card-header">
          <div className="team-header-left">
            <h3 className="team-title">Team</h3>
            <span className="team-badge">+5</span>
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
              <span className="stat-number">1240</span>
              <div className="stat-change positive">
                <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="3" fill="none">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
                <span>+124</span>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="team-stat-item">
              <div className="stat-icon-circle">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <span className="stat-number">562</span>
              <div className="stat-change positive">
                <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="3" fill="none">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
                <span>+124</span>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="team-stat-item">
              <div className="stat-icon-circle">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <span className="stat-number">25</span>
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
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <Loader2 className="animate-spin" style={{ color: '#9ca3af' }} />
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#ef4444', minHeight: '200px' }}>
              <AlertCircle style={{ marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>{error}</p>
              <button 
                onClick={refetch} 
                style={{ marginTop: '12px', padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', color: '#f3f4f6', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="team-columns-grid">
              {teamsData.map((team) => {
                const isDev = team.teamName.toLowerCase().includes('development') || team.teamName.toLowerCase().includes('tech');

                return (
                  <div key={team.teamName} className={`team-dept-col ${isDev ? 'chart-col' : ''}`}>
                    <div className="dept-info">
                      <h4 className="dept-name">{team.teamName}</h4>
                      <span className="dept-sub">{isDev ? 'Tech & Engineering' : 'Design and creative'}</span>
                    </div>

                    {!isDev && (
                      <div className="dept-avatars">
                        {team.members?.map((member) => (
                          <div key={member.id} style={{ position: 'relative', display: 'inline-block' }}>
                            <img 
                              src={member.avatar} 
                              alt={member.name} 
                              className="dept-avatar" 
                              style={{ cursor: 'pointer' }}
                              onClick={() => setActiveAvatar(activeAvatar?.id === member.id ? null : member)}
                            />
                            {activeAvatar?.id === member.id && (
                              <div style={{
                                position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px',
                                background: 'rgba(31, 41, 55, 0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px',
                                borderRadius: '8px', zIndex: 50, width: '150px', backdropFilter: 'blur(10px)',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', color: '#fff', textAlign: 'center'
                              }}>
                                <img src={member.avatar} alt={member.name} style={{ width: '40px', height: '40px', borderRadius: '50%', marginBottom: '8px' }} />
                                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{member.name}</div>
                                <div style={{ fontSize: '11px', color: '#9ca3af' }}>{team.teamName}</div>
                                <div style={{ fontSize: '10px', color: '#10b981', marginTop: '4px' }}>● Online</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {!isDev ? (
                      <div className="dept-progress-block">
                        <div className="progress-labels">
                          <span>PROGRESS</span>
                          <span>GOAL</span>
                        </div>
                        <div className="progress-bar-track">
                          <div className="progress-bar-fill" style={{ width: `${team.progress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <div className="dev-chart-container">
                        {devBarHeights.map((h, i) => (
                          <div key={i} className="dev-chart-bar-wrapper" style={{ position: 'relative' }}
                               onMouseEnter={() => setHoveredBarIndex(i)} onMouseLeave={() => setHoveredBarIndex(null)}>
                            {hoveredBarIndex === i && (
                              <div style={{
                                position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '4px',
                                background: 'rgba(31, 41, 55, 0.95)', color: '#fff', padding: '4px 8px', borderRadius: '4px',
                                fontSize: '11px', zIndex: 10, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)'
                              }}>
                                {h}%
                              </div>
                            )}
                            <div className="dev-chart-bar" style={{ height: `${h}%` }} />
                          </div>
                        ))}
                      </div>
                    )}

                    {!isDev && (
                      <div className="dept-actions">
                        <button className="dept-action-btn" onClick={() => setIsSettingsModalOpen(true)}>
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                          </svg>
                        </button>
                        <button className="dept-action-btn" onClick={() => alert('Add Member to ' + team.teamName)}>
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {teamsData.length === 0 && (
                 <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                   No team data available.
                 </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isSettingsModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }} onClick={() => setIsSettingsModalOpen(false)}>
          <div style={{
            background: 'var(--bg-color, #1f2937)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '400px',
            color: 'var(--text-primary, #fff)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>Department Goals</h2>
              <button onClick={() => setIsSettingsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Monthly Target Progress (%)</label>
              <input type="number" defaultValue="85" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Notification Alerts</label>
              <select style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}>
                <option>Weekly Report</option>
                <option>Daily Summary</option>
                <option>Mute</option>
              </select>
            </div>
            <button onClick={() => { alert('Settings Saved!'); setIsSettingsModalOpen(false); }} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              Save Changes
            </button>
          </div>
        </div>
      )}
    </>
  );
}
