import TaskCard from './TaskCard';

export default function KanbanColumn({ column }) {
  const { title, count = 0, tasks = [] } = column;

  return (
    <div className="kanban-column">
      {/* Column Header */}
      <div className="kanban-column-header">
        <div className="column-header-left">
          <h3 className="column-title">{title}</h3>
          <span className="column-count-badge">{count}</span>
        </div>
        <button className="column-options-btn" title="Column Options">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="12" cy="12" r="1.5"></circle>
            <circle cx="12" cy="6" r="1.5"></circle>
            <circle cx="12" cy="18" r="1.5"></circle>
          </svg>
        </button>
      </div>

      {/* Task List */}
      <div className="kanban-tasks-list">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
