import { useState, useEffect } from 'react';
import { useTeamProgress } from '../../hooks/useDashboardData';
import { Loader2, AlertCircle, ChevronDown, Check } from 'lucide-react';
import { getProjects } from '../../services/projectService';
import './TeamCard.css';

export default function TeamCard() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchProjectsList = async () => {
      try {
        const apiProjects = await getProjects();
        if (apiProjects && Array.isArray(apiProjects)) {
          setProjects(apiProjects);
        }
      } catch (err) {
        console.warn('Could not fetch projects list for Team component:', err.message);
      }
    };
    fetchProjectsList();
  }, []);

  const { data: response, loading, error, refetch } = useTeamProgress(selectedProjectId);
  const membersData = response?.data || [];
  const overallStats = response?.overallStats || {
    activeMembers: 0,
    tasksCompleted: 0
  };

  return (
    <div className="team-card">
      <div className="team-card-header">
        <div className="team-header-left">
          <h3 className="team-title">Team Workload</h3>
          <span className="team-badge">+{overallStats.activeMembers}</span>
        </div>
        
        <div style={{ position: 'relative' }}>
          <button 
            className="team-project-dropdown-btn" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedProjectId ? (projects.find(p => p._id === selectedProjectId || p.id === selectedProjectId)?.name || 'Project') : 'All Projects'}
            </span>
            <ChevronDown size={14} />
          </button>
          
          {isDropdownOpen && (
            <div className="team-project-dropdown-menu">
              <div 
                className="team-project-dropdown-item"
                onClick={() => { setSelectedProjectId(''); setIsDropdownOpen(false); }}
              >
                <span>All Projects</span>
                {!selectedProjectId && <Check size={14} color="#10b981" />}
              </div>
              
              {projects.map(proj => {
                const isSelected = selectedProjectId === (proj._id || proj.id);
                return (
                  <div 
                    key={proj._id || proj.id} 
                    className="team-project-dropdown-item"
                    onClick={() => { setSelectedProjectId(proj._id || proj.id); setIsDropdownOpen(false); }}
                  >
                    <span style={{ maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {proj.name}
                    </span>
                    {isSelected && <Check size={14} color="#10b981" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="team-card-body">
        {loading ? (
          <div className="member-list">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="member-row" style={{ height: '58px' }}>
                <div className="member-info">
                  <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                  <div className="skeleton-box" style={{ width: '100px', height: '14px' }} />
                </div>
                <div className="member-stats-group">
                  <div className="skeleton-box" style={{ width: '40px', height: '12px', marginBottom: '6px' }} />
                  <div className="skeleton-box" style={{ width: '80px', height: '4px', borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#ef4444', height: '150px' }}>
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
          <div className="member-list">
            {membersData.map((member) => (
              <div key={member.id} className="member-row">
                <div className="member-info">
                  <img src={member.avatar} alt={member.name} className="member-avatar" />
                  <span className="member-name">{member.name}</span>
                </div>
                <div className="member-stats-group">
                  <span className="member-task-count">{member.completedTasks} / {member.totalTasks}</span>
                  <div className="member-progress-track">
                    <div className="member-progress-fill" style={{ width: `${member.progress}%`, backgroundColor: member.progress === 100 ? '#10b981' : '#3b82f6' }}></div>
                  </div>
                </div>
              </div>
            ))}
            {membersData.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                No team data available.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
