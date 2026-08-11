import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockTasksPath = path.join(__dirname, '../data/mockTasks.json');

const getMockTasks = () => {
    if (!fs.existsSync(mockTasksPath)) {
        return [];
    }
    const data = fs.readFileSync(mockTasksPath, 'utf8');
    return JSON.parse(data);
};

const saveMockTasks = (data) => {
    fs.writeFileSync(mockTasksPath, JSON.stringify(data, null, 2));
};

export const getTasksByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const tasks = getMockTasks();
        const projectTasks = tasks.filter(t => t.projectId === projectId);
        
        res.status(200).json({
            status: 'success',
            data: { tasks: projectTasks }
        });
    } catch (error) {
        console.error('Error fetching project tasks:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const createTask = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { title, description, status, assignee } = req.body;
        
        if (!title) {
            return res.status(400).json({ status: 'error', message: 'Title is required' });
        }
        
        const tasks = getMockTasks();
        const newTask = {
            id: Date.now().toString(),
            projectId,
            title,
            description: description || '',
            status: status || 'todo',
            assignee: assignee || null,
            reviews: [],
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        saveMockTasks(tasks);
        
        res.status(201).json({
            status: 'success',
            data: { task: newTask }
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};
