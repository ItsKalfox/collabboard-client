import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');

export const getTimeline = async (req, res) => {
    try {
        const tasksData = await fs.readFile(path.join(dataDir, 'mockTasks.json'), 'utf-8');
        const projectsData = await fs.readFile(path.join(dataDir, 'mockProjects.json'), 'utf-8');
        const usersData = await fs.readFile(path.join(dataDir, 'mockData.json'), 'utf-8');

        const tasks = JSON.parse(tasksData);
        const projects = JSON.parse(projectsData);
        const users = JSON.parse(usersData);

        const formatDuration = (start, end) => {
            const diffMs = new Date(end) - new Date(start);
            const diffHours = Math.round(diffMs / (1000 * 60 * 60));
            if (diffHours < 24) {
                return `about ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
            }
            const diffDays = Math.round(diffHours / 24);
            return `about ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        };

        const timeline = projects.map(project => {
            const projectTasks = tasks
                .filter(t => t.projectId === project.id)
                .map(task => {
                    const assignee = users.find(u => u.id === task.assigneeId);
                    return {
                        id: task.id,
                        title: task.title,
                        status: task.status,
                        priority: task.priority,
                        duration: formatDuration(task.createdAt, task.dueDate),
                        startDate: task.createdAt,
                        dueDate: task.dueDate,
                        assignee: assignee ? {
                            id: assignee.id,
                            name: assignee.name,
                            avatar: assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee.name)}`
                        } : null
                    };
                });

            return {
                trackId: project.id,
                trackName: project.name,
                tasks: projectTasks
            };
        });

        res.status(200).json({
            status: 'success',
            data: timeline
        });
    } catch (error) {
        console.error('Error in getTimeline:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
