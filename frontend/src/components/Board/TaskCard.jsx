import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function TaskCard({ task, onOptionClick, isOverlay }) {
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
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging || isOverlay ? 'grabbing' : 'grab',
  };

  const progressPercent = Math.min(100, Math.max(0, (progressCurrent / progressTotal) * 100));

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`task-card ${isOverlay ? 'drag-overlay-active' : ''}`}
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

    </div>
  );
}
