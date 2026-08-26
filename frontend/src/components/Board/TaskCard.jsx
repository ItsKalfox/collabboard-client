import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function TaskCard({ task, onOptionClick, isOverlay, disabled, isAssignee }) {
  const {
    id,
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: disabled ? 'pointer' : (isDragging || isOverlay ? 'grabbing' : 'grab'),
  };

  const progressPercent = Math.min(100, Math.max(0, (progressCurrent / progressTotal) * 100));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${isOverlay ? 'drag-overlay-active' : ''} ${disabled ? 'task-card-disabled' : ''} ${isAssignee ? 'task-card-assigned' : ''}`}
      {...attributes}
      {...listeners}
      onClick={() => onOptionClick && onOptionClick(task)}
    >
      {/* Card Header: Tag & Date */}
      <div className="task-card-header">
        <span className={`task-tag-pill tag-${tagColor}`}>{tag}</span>
        <div className="task-card-header-right">
          <span className="task-card-date">{date}</span>
        </div>
      </div>

      {/* Task Title & Description */}
      <div className="task-card-body">
        <h3 className="task-card-title">{title}</h3>
        {description && <p className="task-card-desc" style={{ textAlign: 'left' }}>{description}</p>}
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

      {/* Assignee Section */}
      {members && members.length > 0 && (
        <div style={{ marginTop: '1px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary, #777)', fontWeight: '500' }}>Assignee</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '8px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
              {members[0].avatar ? <img src={members[0].avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : members[0].initials}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary, #777)', fontWeight: '500' }}>{members[0].name}</span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {progressTotal > 0 && (
        <div className="task-card-progress-section" style={{ marginTop: '-5px' }}>
          <div className="progress-info">
            <span className="progress-label">Progress</span>
            <span className="progress-ratio">{progressCurrent}/{progressTotal}</span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
