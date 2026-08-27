import { normalizeMember, getInitials } from '../../utils/memberUtils';

const COLOR_HEX = {
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#f43f5e',
  purple: '#a855f7',
};

export default function ProjectCard({
  project,
  theme = 'dark',
  onViewDetails,
}) {
  const isDark = theme !== 'light';
  const lightCls = isDark ? '' : ' light';

  const rawMembers = Array.isArray(project.members) ? project.members : [];
  const membersList = rawMembers.map(normalizeMember);
  const progressPercent = project.progress || 0;
  const projectImage = project.coverImage || project.image;

  const handleCardClick = () => {
    onViewDetails(project);
  };

  return (
    <div
      className={`${isDark ? 'glass-card' : 'glass-card-light'} pc-list-card${lightCls}`}
      onClick={handleCardClick}
    >
      {/* 1. Thumbnail Image */}
      <div className="pc-list-image-container">
        {projectImage ? (
          <img src={projectImage} alt={project.name} className="pc-list-image" />
        ) : (
          <div className="pc-list-image-placeholder" style={{ backgroundColor: COLOR_HEX[project.color] || COLOR_HEX.blue }} />
        )}
      </div>

      {/* 2. Project Info */}
      <div className="pc-list-info">
        <h3 className={`pc-list-title${lightCls}`}>{project.name}</h3>
        <p className={`pc-list-desc${lightCls}`}>{project.description}</p>
      </div>

      {/* 3. Progress Bar */}
      <div className="pc-list-progress-section">
        <div className="pc-list-progress-header">
          <span className={`pc-list-progress-label${lightCls}`}>Progress</span>
          <span className={`pc-list-progress-percent${lightCls}`}>{progressPercent}%</span>
        </div>
        <div className={`pc-list-progress-track${lightCls}`}>
          <div 
            className="pc-list-progress-fill"
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: isDark ? '#ffffff' : '#000000' 
            }} 
          />
        </div>
      </div>

      {/* 4. Owner */}
      <div className="pc-list-meta">
        <span className={`pc-list-meta-label${lightCls}`}>Owner</span>
        <span className={`pc-list-meta-value${lightCls}`}>{project.owner || 'Me'}</span>
      </div>

      {/* 5. Date */}
      <div className="pc-list-meta">
        <span className={`pc-list-meta-label${lightCls}`}>Created</span>
        <span className={`pc-list-meta-value${lightCls}`}>{project.createdDate || '—'}</span>
      </div>

      {/* 6. Members (Overlapping Chips) */}
      <div className="pc-list-members">
        {membersList.slice(0, 4).map((member, idx) => (
          <div
            key={idx}
            className={`pc-list-avatar${lightCls}`}
            style={{ backgroundColor: member.avatar ? 'transparent' : (member.bg || COLOR_HEX.blue), zIndex: 10 - idx }}
          >
            <div className="avatar-inner">
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} />
              ) : (
                member.initials || getInitials(member.name)
              )}
            </div>
            <div className="custom-avatar-tooltip">
              <div className="tooltip-avatar" style={{ backgroundColor: member.bg || COLOR_HEX.blue }}>
                {member.avatar ? <img src={member.avatar} alt="" /> : (member.initials || getInitials(member.name))}
              </div>
              <div className="tooltip-info">
                <span className="name">{member.name}</span>
                <span className="email">{member.email || member.role || 'Member'}</span>
              </div>
            </div>
          </div>
        ))}
        {membersList.length > 4 && (
          <div className={`pc-list-avatar-more${lightCls}`} style={{ zIndex: 1 }}>
            +{membersList.length - 4}
          </div>
        )}
      </div>
    </div>
  );
}