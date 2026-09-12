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
import { formatDate } from '../../utils/dateUtils';
import { useSocket } from '../../context/SocketContext';
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
    subtasks: task.subtasks ? task.subtasks.map(s => ({ ...s, comments: s.comments || [] })) : [],
    attachments: (task.attachments || []).map(att => ({
      id: att.id,
      name: att.name || (att.filename ? att.filename.replace(/\.[^.]+$/, '') : 'Attachment'),
      ext: att.ext || (att.filename ? att.filename.split('.').pop().toUpperCase() : 'FILE'),
      size: typeof att.size === 'number' ? (att.size / (1024 * 1024)).toFixed(2) + ' MB' : (att.size || 'Unknown'),
      url: att.url || null
    })),
    generalComments: task.generalComments || [],
    activities: (task.activities && task.activities.length > 0) ? task.activities.map(a => ({
      ...a,
      timestamp: new Date(a.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    })) : [
      { text: `Task "${task.title}" was created`, timestamp: task.createdAt ? new Date(task.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Mon, 20 Nov 2023' },
    ],
  };
}

export default function KanbanBoard({ projectId, refreshKey, currentProject, currentUser }) {
  const [columns, setColumns] = useState(() => COLUMNS_DEF.map(col => ({ ...col, tasks: [] })));
  const [activeTask, setActiveTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localRefresh, setLocalRefresh] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const { socket } = useSocket() || {};

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (socket && projectId) {
      socket.emit('join_board', projectId);
    }
  }, [socket, projectId]);

  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        // Fetch tasks and members in parallel
        let members = [];
        let tasks = [];

        try {
          const [tasksRes, membersRes] = await Promise.all([
            fetch(`${apiUrl}/projects/${projectId}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${apiUrl}/projects/${projectId}/members`, { headers: { 'Authorization': `Bearer ${token}` } })
          ]);
          
          if (membersRes.ok) {
            const membersData = await membersRes.json();
            members = membersData.data?.members || [];
          }

          if (tasksRes.ok) {
            const data = await tasksRes.json();
            tasks = data.data?.tasks || [];
          }
        } catch {
          // If network fetch fails, fallback to local mock data
        }


        const newCols = COLUMNS_DEF.map(col => ({ ...col, tasks: [] }));
        tasks.forEach(task => {
          // Find assignee details
          const assigneeObjId = typeof task.assigneeId === 'object' ? (task.assigneeId?._id || task.assigneeId?.id) : task.assigneeId;
          const assignee = assigneeObjId ? members.find(m => String(m.userId) === String(assigneeObjId) || String(m.id) === String(assigneeObjId)) : null;
          const assigneeName = typeof task.assigneeId === 'object' && task.assigneeId.name ? task.assigneeId.name : (assignee ? assignee.name : 'Team Member');
          const assigneeAvatar = typeof task.assigneeId === 'object' && task.assigneeId.avatar ? task.assigneeId.avatar : assignee?.avatar;
          const assigneeInitial = assigneeName.charAt(0).toUpperCase();

          // Map backend task to frontend TaskCard format
          const uiTask = {
            ...task,
            tag: task.priority === 'high' ? 'High Priority' : task.priority === 'medium' ? 'Medium Priority' : task.priority === 'low' ? 'Low Priority' : task.category || 'Task',
            tagColor: task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'amber' : task.priority === 'low' ? 'green' : 'cyan',
            date: new Date(task.dueDate || task.createdAt || Date.now()).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
            progressCurrent: task.subtasks ? task.subtasks.filter(st => st.completed).length : 0,
            progressTotal: task.subtasks ? task.subtasks.length : 1,
            members: task.assigneeId ? [{ name: assigneeName, initials: assigneeInitial, avatar: assigneeAvatar }] : []
          };
          
          const statusCol = newCols.find(c => c.id === task.status);
          if (statusCol) {
            statusCol.tasks.push(uiTask);
          } else {
            newCols[0].tasks.push(uiTask); // fallback to To Do
          }
        });
        
        setColumns(newCols);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [projectId, refreshKey, localRefresh]);

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
      
      const completedSubtasks = task.progressCurrent || 0;
      const totalSubtasks = task.progressTotal || 0;

      const revertMove = () => {
        setColumns(prev => prev.map(c => {
          if (c.id === currentColumn.id) return { ...c, tasks: c.tasks.filter(t => t.id !== activeId) };
          if (c.id === task.status) return { ...c, tasks: [...c.tasks, task] };
          return c;
        }));
      };
      
      if (newStatus === 'todo' && completedSubtasks > 0) {
        showToast("Tasks with completed subtasks cannot be moved back to To Do.");
        revertMove();
        return;
      }
      
      if (task.status === 'completed' && newStatus !== 'completed') {
        showToast("Completed tasks cannot be moved to another column.");
        revertMove();
        return;
      }

      if (newStatus === 'completed' && !task.isApproved) {
        showToast("Tasks must be reviewed and approved before moving to Done.");
        revertMove();
        return;
      }

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
        const res = await fetch(`${apiUrl}/tasks/${activeId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          // Business-logic rejection — revert the move
          showToast(data.message || 'Failed to update task status.');
          revertMove();
        }
      } catch {
        // Network failure or other error
        showToast('Failed to update task status (network error).');
        revertMove();
      }
    }
  };

  return (
    <>
      {toastMessage && (
        <div className="kanban-toast">
          {toastMessage}
        </div>
      )}
      {loading ? (
        <div className="kanban-board-container" style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
          {COLUMNS_DEF.map(col => (
            <div key={col.id} className="kanban-column" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="kanban-column-header">
                <div className="column-header-left">
                  <h3 className="column-title">{col.title}</h3>
                  <span className="column-count-badge">0</span>
                </div>
              </div>
              <div className="kanban-tasks-list" style={{ minHeight: '150px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="skeleton-box" style={{ height: '140px', width: '100%', borderRadius: '16px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
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
                currentUser={currentUser}
                currentProject={currentProject}
              />
            ))}
          </div>

          <DragOverlay>
            {draggedTask ? <TaskCard task={draggedTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {activeTask && (
        <TaskPopup
          task={activeTask}
          project={currentProject}
          currentUser={currentUser}
          onClose={() => setActiveTask(null)}
          onUpdate={() => setLocalRefresh(r => r + 1)}
        />
      )}
    </>
  );
}
