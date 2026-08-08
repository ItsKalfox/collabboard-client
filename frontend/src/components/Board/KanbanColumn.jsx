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

      {/* Add New Task Button */}
      <button className="add-task-btn">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Add new task</span>
      </button>

      {/* Task List */}
      <div className="kanban-tasks-list">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
