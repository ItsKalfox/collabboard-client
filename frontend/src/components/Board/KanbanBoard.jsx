import KanbanColumn from './KanbanColumn';
import './KanbanBoard.css';

const KANBAN_DATA = [
  {
    id: 'col-todo',
    title: 'To Do',
    count: 3,
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
    count: 2,
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
    count: 2,
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
    count: 2,
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

export default function KanbanBoard() {
  return (
    <div className="kanban-board-container">
      {KANBAN_DATA.map((column) => (
        <KanbanColumn key={column.id} column={column} />
      ))}
    </div>
  );
}
