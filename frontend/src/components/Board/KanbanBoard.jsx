import { useState } from 'react';
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

const INITIAL_DATA = [
  {
    id: 'col-todo',
    title: 'To Do',
    tasks: [
      {
        id: 'task-1',
        tag: 'Design System',
        tagColor: 'cyan',
        date: 'Mon, 20 Nov',
        title: 'Design System',
        description: 'I need a mood board to get inspiration for my project.',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
        progressCurrent: 5,
        progressTotal: 10,
        members: [
          { name: 'Satria Cogil', initials: 'SC', bg: '#ef4444' },
          { name: 'John Doe', initials: 'JD', bg: '#3b82f6' },
        ],
        viewsCount: 4,
        commentsCount: 6,
        linksCount: 1,
      },
      {
        id: 'task-2',
        tag: 'Discussion',
        tagColor: 'green',
        date: 'Mon, 20 Nov',
        title: 'Team Meeting',
        description: 'I need a mood board to get inspiration for my project.',
        progressCurrent: 5,
        progressTotal: 10,
        members: [
          { name: 'Alex K', initials: 'AK', bg: '#10b981' },
        ],
        viewsCount: 4,
        commentsCount: 6,
        linksCount: 1,
      },
    ],
  },
  {
    id: 'col-inprogress',
    title: 'In Progress',
    tasks: [
      {
        id: 'task-3',
        tag: 'Mood Board',
        tagColor: 'amber',
        date: 'Mon, 20 Nov',
        title: 'Create Mood Board',
        description: 'I need a mood board to get inspiration for my project.',
        progressCurrent: 7,
        progressTotal: 10,
        members: [
          { name: 'Satria Cogil', initials: 'SC', bg: '#ef4444' },
          { name: 'John Doe', initials: 'JD', bg: '#3b82f6' },
        ],
        extraMembersCount: 2,
        viewsCount: 4,
        commentsCount: 6,
        linksCount: 1,
      },
      {
        id: 'task-4',
        tag: 'UI Design',
        tagColor: 'purple',
        date: 'Mon, 20 Nov',
        title: 'Home Screen',
        description: 'Inspiration for clean design',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80',
        progressCurrent: 8,
        progressTotal: 10,
        members: [
          { name: 'Alex K', initials: 'AK', bg: '#10b981' },
        ],
        viewsCount: 4,
        commentsCount: 6,
        linksCount: 1,
      },
    ],
  },
  {
    id: 'col-needreview',
    title: 'Need Review',
    tasks: [
      {
        id: 'task-5',
        tag: 'UX Design',
        tagColor: 'pink',
        date: 'Mon, 20 Nov',
        title: 'Competitor research',
        description: 'Competitor research is carried out to get to know competitors as well as improve product quality in order to win the competition.',
        imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500&auto=format&fit=crop&q=80',
        progressCurrent: 9,
        progressTotal: 10,
        members: [
          { name: 'Satria Cogil', initials: 'SC', bg: '#ef4444' },
          { name: 'John Doe', initials: 'JD', bg: '#3b82f6' },
        ],
        viewsCount: 4,
        commentsCount: 6,
        linksCount: 1,
      },
      {
        id: 'task-6',
        tag: 'UI Design',
        tagColor: 'purple',
        date: 'Mon, 20 Nov',
        title: 'Change Font',
        description: 'Change the font to poppins all over the screen',
        progressCurrent: 6,
        progressTotal: 10,
        members: [
          { name: 'Alex K', initials: 'AK', bg: '#10b981' },
        ],
        viewsCount: 4,
        commentsCount: 6,
        linksCount: 1,
      },
    ],
  },
  {
    id: 'col-done',
    title: 'Done',
    tasks: [
      {
        id: 'task-7',
        tag: 'UX Design',
        tagColor: 'pink',
        date: 'Mon, 20 Nov',
        title: 'Wireframe',
        description: 'Clean design and aesthetic',
        imageUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=500&auto=format&fit=crop&q=80',
        progressCurrent: 10,
        progressTotal: 10,
        members: [
          { name: 'Satria Cogil', initials: 'SC', bg: '#ef4444' },
        ],
        viewsCount: 4,
        commentsCount: 6,
        linksCount: 1,
      },
      {
        id: 'task-8',
        tag: 'UI Design',
        tagColor: 'purple',
        date: 'Mon, 20 Nov',
        title: 'Change Button',
        description: "Change the button on the detail screen, it's not neat enough and the rounded can be given 4",
        progressCurrent: 10,
        progressTotal: 10,
        members: [
          { name: 'John Doe', initials: 'JD', bg: '#3b82f6' },
          { name: 'Alex K', initials: 'AK', bg: '#10b981' },
        ],
        viewsCount: 4,
        commentsCount: 6,
        linksCount: 1,
      },
    ],
  },
];

function normalizeTaskForPopup(task, columnTitle) {
  return {
    ...task,
    status: task.status || columnTitle || 'To Do',
    priority: task.priority || 7,
    createdDate: task.createdDate || task.date || 'Mon, 20 Nov 2023',
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
      { text: `Task "${task.title}" was created`, timestamp: task.date || 'Mon, 20 Nov 2023' },
    ],
  };
}

export default function KanbanBoard() {
  const [columns, setColumns] = useState(INITIAL_DATA);
  const [activeTask, setActiveTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);

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

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setDraggedTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeColumn = findColumnOfTask(activeId);
    const overColumn = findColumnOfTask(overId) || columns.find(c => c.id === overId);

    if (!activeColumn || !overColumn) {
      return;
    }

    const activeIndex = activeColumn.tasks.findIndex(t => t.id === activeId);
    const overIndex = overColumn.tasks.findIndex(t => t.id === overId);

    if (activeColumn === overColumn) {
      if (activeIndex !== overIndex) {
        setColumns((prev) => prev.map(c => {
          if (c.id === activeColumn.id) {
            return {
              ...c,
              tasks: arrayMove(c.tasks, activeIndex, overIndex)
            };
          }
          return c;
        }));
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
