import { useState } from 'react';
import TaskPopup from '../components/TaskPopup/TaskPopup';
import './Projects.css';

/* ── sample tasks — swap these out when the real Gantt data arrives ── */
const SAMPLE_TASKS = [
  {
    id: 1,
    title: 'New BrandBook',
    status: 'Graphic Design',
    priority: 8,
    createdDate: 'Jul 12, 2025 12:45 PM',
    dueDate: 'Jul 28, 2025',
    progress: 30,
    description: 'Develop a comprehensive BrandBook that defines and documents the visual and verbal identity of the brand. This guide will serve as a reference for all internal teams and external partners.',
    assignees: [{ name: 'Amanda Black' }, { name: 'Jake Wilson' }],
    subtasks: [
      {
        label: 'Define Brand Identity (Mission, Vision, Values)',
        done: false,
        comments: [
          { author: 'Amanda Black', text: 'Develop and finalise the core elements of the brand identity, including mission statement and vision statement.', timestamp: 'Jul 28, 2025 2:30 PM' },
        ],
      },
      { label: 'Create sample brand messages and taglines.', done: true, comments: [] },
      { label: 'Mockups for website, mobile, print, and packaging', done: false, comments: [] },
    ],
    attachments: [
      { id: 'a1', name: 'Design Brief',  ext: 'PDF', size: '2.45 MB', url: null },
      { id: 'a2', name: 'Company Info',  ext: 'PDF', size: '5.25 MB', url: null },
    ],
    generalComments: [],
    activities: [
      { text: 'Task "New BrandBook" was created', timestamp: 'Jul 12, 2025 12:45 PM' },
      { text: 'Amanda Black added as assignee', timestamp: 'Jul 12, 2025 12:46 PM' },
    ],
    startWeek: 0, spanWeeks: 4, row: 0,
  },
  {
    id: 2,
    title: 'Design System',
    status: 'UI/UX Design',
    priority: 8,
    createdDate: 'Jul 1, 2025 9:00 AM',
    dueDate: 'Aug 10, 2025',
    progress: 60,
    description: 'Create UI components (buttons, forms, cards) and a shared design token system.',
    assignees: [{ name: 'Sara Johnson' }, { name: 'Mike Chen' }],
    subtasks: [
      { label: 'Define colour palette tokens', done: true, comments: [] },
      {
        label: 'Build button component variants',
        done: true,
        comments: [
          { author: 'Sara Johnson', text: 'All variants shipped — primary, secondary, ghost, danger.', timestamp: 'Jul 20, 2025 4:00 PM' },
        ],
      },
      { label: 'Build form field components', done: false, comments: [] },
    ],
    attachments: [
      { id: 'b1', name: 'Token Spec', ext: 'FIGMA', size: '1.10 MB', url: null },
    ],
    generalComments: [],
    activities: [
      { text: 'Task "Design System" was created', timestamp: 'Jul 1, 2025 9:00 AM' },
    ],
    startWeek: 1, spanWeeks: 5, row: 1,
  },
  {
    id: 3,
    title: 'User Research',
    status: 'UI/UX Design',
    priority: 6,
    createdDate: 'Jun 20, 2025 2:00 PM',
    dueDate: 'Jul 20, 2025',
    progress: 60,
    description: 'Define target audience and understand user pain points through interviews and surveys.',
    assignees: [{ name: 'Priya Patel' }],
    subtasks: [
      { label: 'Conduct 10 user interviews', done: true, comments: [] },
      { label: 'Synthesise findings into personas', done: false, comments: [] },
    ],
    attachments: [],
    generalComments: [],
    activities: [
      { text: 'Task "User Research" was created', timestamp: 'Jun 20, 2025 2:00 PM' },
    ],
    startWeek: 0, spanWeeks: 3, row: 2,
  },
  {
    id: 4,
    title: 'New Wireframes option',
    status: 'Project management',
    priority: 7,
    createdDate: 'Jul 5, 2025 11:00 AM',
    dueDate: 'Aug 5, 2025',
    progress: 65,
    description: 'Sketch high-fidelity wireframes for the main user flows.',
    assignees: [{ name: 'Alex Turner' }, { name: 'Dana Lee' }, { name: 'Chris Brown' }],
    subtasks: [
      { label: 'Onboarding flow wireframe', done: true, comments: [] },
      { label: 'Dashboard wireframe', done: true, comments: [] },
      { label: 'Settings page wireframe', done: false, comments: [] },
    ],
    attachments: [
      { id: 'c1', name: 'Wireframes v1', ext: 'PDF', size: '3.80 MB', url: null },
    ],
    generalComments: [],
    activities: [
      { text: 'Task "New Wireframes option" was created', timestamp: 'Jul 5, 2025 11:00 AM' },
    ],
    startWeek: 2, spanWeeks: 4, row: 3,
  },
  {
    id: 5,
    title: 'Front-End Setup',
    status: 'Development',
    priority: 3,
    createdDate: 'Jul 15, 2025 8:30 AM',
    dueDate: 'Sep 1, 2025',
    progress: 30,
    description: 'Choose tech stack (React/Vue, TypeScript) and scaffold the project repository.',
    assignees: [{ name: 'Leo' }],
    subtasks: [
      { label: 'Bootstrap Vite + React app', done: true, comments: [] },
      { label: 'Configure ESLint & Prettier', done: false, comments: [] },
      { label: 'Set up CI pipeline', done: false, comments: [] },
    ],
    attachments: [],
    generalComments: [],
    activities: [
      { text: 'Task "Front-End Setup" was created', timestamp: 'Jul 15, 2025 8:30 AM' },
    ],
    startWeek: 3, spanWeeks: 6, row: 4,
  },
];

const WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'];

const PHASE_COLOURS = [
  'rgba(99, 102, 241, 0.75)',
  'rgba(139, 92, 246, 0.75)',
  'rgba(59, 130, 246, 0.75)',
  'rgba(245, 158, 11, 0.75)',
  'rgba(16, 185, 129, 0.75)',
];

export default function Projects() {
  const [selectedTask, setSelectedTask] = useState(null);

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h2 className="projects-heading">Projects</h2>
          <p className="projects-subheading">Gantt chart — click any task bar to view details</p>
        </div>
        <div className="projects-actions">
          <button className="projects-btn-ghost">Filter</button>
          <button className="projects-btn-primary">+ New Task</button>
        </div>
      </div>

      {/* ── Gantt chart placeholder ── */}
      <div className="gantt-wrapper">
        {/* Column header */}
        <div className="gantt-header">
          <div className="gantt-label-col" />
          {WEEKS.map((w) => (
            <div key={w} className="gantt-week-col">{w}</div>
          ))}
        </div>

        {/* Today marker (visual only) */}
        <div className="gantt-body">
          {SAMPLE_TASKS.map((task, idx) => (
            <div key={task.id} className="gantt-row">
              {/* Row label */}
              <div className="gantt-label-col gantt-task-label">{task.title}</div>

              {/* Grid cells */}
              {WEEKS.map((_, wi) => (
                <div key={wi} className="gantt-week-col gantt-cell" />
              ))}

              {/* Task bar — absolutely positioned over the cells */}
              <button
                className="gantt-bar"
                style={{
                  left: `calc(160px + ${task.startWeek} * (100% - 160px) / ${WEEKS.length})`,
                  width: `calc(${task.spanWeeks} * (100% - 160px) / ${WEEKS.length} - 6px)`,
                  background: PHASE_COLOURS[idx % PHASE_COLOURS.length],
                }}
                onClick={() => setSelectedTask(task)}
                aria-label={`Open details for ${task.title}`}
              >
                <span className="gantt-bar-inner">
                  <span className="gantt-bar-title">{task.title}</span>
                  <span className="gantt-bar-progress">{task.progress}%</span>
                </span>
                {/* progress fill */}
                <span
                  className="gantt-bar-fill"
                  style={{ width: `${task.progress}%` }}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Placeholder notice — remove when friend's Gantt is linked */}
        <div className="gantt-placeholder-notice">
          🚧 Gantt chart placeholder — link your friend's component here
        </div>
      </div>

      {/* Task detail popup */}
      {selectedTask && (
        <TaskPopup task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
