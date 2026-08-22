import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

export default function KanbanColumn({ column, onTaskOptionClick }) {
  const { id, title, count = 0, tasks = [] } = column;

  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className="kanban-column">
      {/* Column Header */}
      <div className="kanban-column-header">
        <div className="column-header-left">
          <h3 className="column-title">{title}</h3>
          <span className="column-count-badge">{count}</span>
        </div>
      </div>

      {/* Task List */}
      <div ref={setNodeRef} className="kanban-tasks-list" style={{ minHeight: '150px' }}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOptionClick={() => onTaskOptionClick && onTaskOptionClick(task, title)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
