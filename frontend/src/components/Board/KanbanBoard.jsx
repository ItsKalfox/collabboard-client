import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskPopup from '../TaskPopup/TaskPopup';
import './KanbanBoard.css';

const COLUMNS_DEF = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Need Review' },
  { id: 'completed', title: 'Done' }
];

function normalizeTaskForPopup(task, columnTitle) {
  return {
    ...task,
    status: task.status || columnTitle || 'todo',
    priority: task.priority || 7,
    createdDate: task.createdAt || task.date || 'Mon, 20 Nov 2023',
    dueDate: task.dueDate || 'Fri, 01 Dec 2023',
    progress: task.progress !== undefined ? task.progress : (task.progressTotal ? Math.round((task.progressCurrent / task.progressTotal) * 100) : 50),
    assignees: task.assignees || (task.members || []).map(m => ({ name: m.name, initials: m.initials })),
    subtasks: task.subtasks || [
      { label: 'Initial moodboard & design concept', done: true, comments: [] },
      { label: 'Review UI specs with project team', done: false, comments: [] },
    ],
    attachments: task.attachments || [
      { id: 'a1', name: 'Design Brief', ext: 'PDF', size: '2.45 MB', url: null },
    ],
    generalComments: task.generalComments || [],
    activities: task.activities || [
      { text: `Task "${task.title}" was created`, timestamp: task.createdAt || task.date || 'Mon, 20 Nov 2023' },
    ],
  };
}

export default function KanbanBoard({ projectId }) {
  const [columns, setColumns] = useState(() => COLUMNS_DEF.map(col => ({ ...col, tasks: [] })));
  const [activeTask, setActiveTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/projects/${projectId}/tasks`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          const tasks = data.data?.tasks || [];
          
          const newCols = COLUMNS_DEF.map(col => ({ ...col, tasks: [] }));
          tasks.forEach(task => {
            // Map backend task to frontend TaskCard format
            const uiTask = {
              ...task,
              tag: task.priority === 'high' ? 'High Priority' : task.category || 'Task',
              tagColor: task.priority === 'high' ? 'pink' : 'cyan',
              date: new Date(task.dueDate || task.createdAt).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
              progressCurrent: task.subtasks ? task.subtasks.filter(st => st.completed).length : 0,
              progressTotal: task.subtasks ? task.subtasks.length : 1,
              members: task.assigneeId ? [{ initials: 'U' }] : [] // Placeholder
            };
            
            const statusCol = newCols.find(c => c.id === task.status);
            if (statusCol) {
              statusCol.tasks.push(uiTask);
            } else {
              newCols[0].tasks.push(uiTask); // fallback to To Do
            }
          });
          
          setColumns(newCols);
        }
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [projectId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleOpenTaskPopup = (rawTask, columnTitle) => {
    setActiveTask(normalizeTaskForPopup(rawTask, columnTitle));
  };

  const findColumnOfTask = (taskId) => {
    return columns.find(col => col.tasks.some(task => task.id === taskId));
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const col = findColumnOfTask(active.id);
    if (col) {
      const task = col.tasks.find(t => t.id === active.id);
      setDraggedTask(task);
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeColumn = findColumnOfTask(activeId);
    const overColumn = findColumnOfTask(overId) || columns.find(c => c.id === overId);

    if (!activeColumn || !overColumn || activeColumn === overColumn) {
      return;
    }

    setColumns((prev) => {
      const activeItems = activeColumn.tasks;
      const overItems = overColumn.tasks;
      const activeIndex = activeItems.findIndex(t => t.id === activeId);
      const overIndex = overItems.findIndex(t => t.id === overId);

      let newIndex;
      if (overId in columns.map(c => c.id)) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      return prev.map(c => {
        if (c.id === activeColumn.id) {
          return { ...c, tasks: c.tasks.filter(t => t.id !== activeId) };
        } else if (c.id === overColumn.id) {
          return {
            ...c,
            tasks: [
              ...c.tasks.slice(0, newIndex),
              activeItems[activeIndex],
              ...c.tasks.slice(newIndex, c.tasks.length)
            ]
          };
        }
        return c;
      });
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setDraggedTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the column the task is CURRENTLY in (after onDragOver moved it)
    const currentColumn = findColumnOfTask(activeId);
    if (!currentColumn) return;

    // Determine the column we dropped it over to handle same-column reordering
    const overColumn = findColumnOfTask(overId) || columns.find(c => c.id === overId);

    // If it's the same column, just reorder
    if (overColumn && currentColumn.id === overColumn.id) {
      const activeIndex = currentColumn.tasks.findIndex(t => t.id === activeId);
      const overIndex = currentColumn.tasks.findIndex(t => t.id === overId);

      if (activeIndex !== overIndex) {
        setColumns((prev) => prev.map(c => {
          if (c.id === currentColumn.id) {
            return {
              ...c,
              tasks: arrayMove(c.tasks, activeIndex, overIndex)
            };
          }
          return c;
        }));
      }
    }

    // Check if the task was moved to a new column by comparing its object status with the current column ID
    const task = currentColumn.tasks.find(t => t.id === activeId);
    if (task && task.status !== currentColumn.id) {
      const newStatus = currentColumn.id;

      // Update local task state to reflect new status
      setColumns((prev) => prev.map(c => {
        if (c.id === newStatus) {
          return {
            ...c,
            tasks: c.tasks.map(t => t.id === activeId ? { ...t, status: newStatus } : t)
          };
        }
        return c;
      }));

      // Persist to backend API
      try {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        await fetch(`${apiUrl}/tasks/${activeId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });
      } catch (err) {
        console.error('Failed to update task status:', err);
      }
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board-container">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={{...column, count: column.tasks.length}}
              onTaskOptionClick={handleOpenTaskPopup}
            />
          ))}
        </div>

        <DragOverlay>
          {draggedTask ? <TaskCard task={draggedTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {activeTask && (
        <TaskPopup
          task={activeTask}
          onClose={() => setActiveTask(null)}
        />
      )}
    </>
  );
}
