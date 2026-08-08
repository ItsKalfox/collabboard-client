export default function TaskCard({ task }) {
  const {
    tag,
    tagColor = 'cyan',
    date = 'Mon, 20 Nov',
    title,
    description,
    imageUrl,
    imageGrid,
    progressCurrent = 0,
    progressTotal = 10,
    members = [],
    extraMembersCount = 0,
    viewsCount = 4,
    commentsCount = 6,
    linksCount = 1,
  } = task;

  const progressPercent = Math.min(100, Math.max(0, (progressCurrent / progressTotal) * 100));

  return (
    <div className="task-card">
      {/* Card Header: Tag & Date & Options */}
      <div className="task-card-header">
        <span className={`task-tag-pill tag-${tagColor}`}>{tag}</span>
        <div className="task-card-header-right">
          <span className="task-card-date">{date}</span>
          <button className="task-card-more-btn" title="Options">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="12" cy="12" r="1.5"></circle>
              <circle cx="6" cy="12" r="1.5"></circle>
              <circle cx="18" cy="12" r="1.5"></circle>
            </svg>
          </button>
        </div>
      </div>

      {/* Task Title & Description */}
      <div className="task-card-body">
        <h3 className="task-card-title">{title}</h3>
        {description && <p className="task-card-desc">{description}</p>}
      </div>

      {/* Optional Preview Image / Grid */}
      {imageUrl && (
        <div className="task-card-image-preview">
          <img src={imageUrl} alt={title} loading="lazy" />
        </div>
      )}

      {imageGrid && imageGrid.length > 0 && (
        <div className="task-card-image-grid">
          {imageGrid.map((imgSrc, idx) => (
            <img key={idx} src={imgSrc} alt="" loading="lazy" />
          ))}
          {extraMembersCount > 0 && (
            <div className="image-grid-more">+{extraMembersCount}</div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {progressTotal > 0 && (
        <div className="task-card-progress-section">
          <div className="progress-info">
            <span className="progress-label">Progress</span>
            <span className="progress-ratio">{progressCurrent}/{progressTotal}</span>
          </div>
          <div className="progress-bar-track">
            <div
              className={`progress-bar-fill fill-${tagColor}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer: Avatars & Task Stats */}
      <div className="task-card-footer">
        <div className="footer-members-stack">
          {members.map((member, idx) => (
            <div
              key={idx}
              className="footer-avatar"
              style={{ backgroundColor: member.bg || '#3b82f6' }}
              title={member.name}
            >
              {member.initials}
            </div>
          ))}
          {extraMembersCount > 0 && (
            <div className="footer-avatar-more">+{extraMembersCount}</div>
          )}
        </div>

        <div className="footer-stats">
          <span className="stat-item" title="Views">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            {viewsCount}
          </span>

          <span className="stat-item" title="Comments">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            {commentsCount}
          </span>

          <span className="stat-item" title="Links">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            {linksCount}
          </span>
        </div>
      </div>
    </div>
  );
}
