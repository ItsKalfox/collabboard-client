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

export const getTaskById = async (req, res) => {
    try {
        const { taskId } = req.params;
        const tasks = getMockTasks();
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }
        
        res.status(200).json({
            status: 'success',
            data: { task }
        });
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, status, assignee } = req.body;
        
        const tasks = getMockTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }
        
        if (title !== undefined) tasks[taskIndex].title = title;
        if (description !== undefined) tasks[taskIndex].description = description;
        if (status !== undefined) tasks[taskIndex].status = status;
        if (assignee !== undefined) tasks[taskIndex].assignee = assignee;
        
        saveMockTasks(tasks);
        
        res.status(200).json({
            status: 'success',
            data: { task: tasks[taskIndex] }
        });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const tasks = getMockTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }
        
        tasks.splice(taskIndex, 1);
        saveMockTasks(tasks);
        
        res.status(200).json({
            status: 'success',
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ status: 'error', message: 'Status is required' });
        }
        
        const tasks = getMockTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }
        
        tasks[taskIndex].status = status;
        saveMockTasks(tasks);
        
        res.status(200).json({
            status: 'success',
            data: { task: tasks[taskIndex] }
        });
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const reviewTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { comment } = req.body;
        
        const tasks = getMockTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }
        
        const newReview = {
            id: Date.now().toString(),
            reviewerId: req.user ? req.user.id : 'anonymous',
            comment: comment || '',
            decision: 'approved',
            createdAt: new Date().toISOString()
        };
        
        if (!tasks[taskIndex].reviews) tasks[taskIndex].reviews = [];
        tasks[taskIndex].reviews.push(newReview);
        tasks[taskIndex].status = 'reviewed';
        
        saveMockTasks(tasks);
        
        res.status(201).json({
            status: 'success',
            data: { review: newReview, task: tasks[taskIndex] }
        });
    } catch (error) {
        console.error('Error reviewing task:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const rejectTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { comment } = req.body;
        
        const tasks = getMockTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }
        
        const newReview = {
            id: Date.now().toString(),
            reviewerId: req.user ? req.user.id : 'anonymous',
            comment: comment || 'Task rejected',
            decision: 'rejected',
            createdAt: new Date().toISOString()
        };
        
        if (!tasks[taskIndex].reviews) tasks[taskIndex].reviews = [];
        tasks[taskIndex].reviews.push(newReview);
        tasks[taskIndex].status = 'rejected';
        
        saveMockTasks(tasks);
        
        res.status(201).json({
            status: 'success',
            data: { review: newReview, task: tasks[taskIndex] }
        });
    } catch (error) {
        console.error('Error rejecting task:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const getTaskReviews = async (req, res) => {
    try {
        const { taskId } = req.params;
        const tasks = getMockTasks();
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }
        
        res.status(200).json({
            status: 'success',
            data: { reviews: task.reviews || [] }
        });
    } catch (error) {
        console.error('Error fetching task reviews:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const getSubtasks = async (req, res) => {
    try {
        const { taskId } = req.params;
        const tasks = getMockTasks();
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }
        
        res.status(200).json({
            status: 'success',
            data: { subtasks: task.subtasks || [] }
        });
    } catch (error) {
        console.error('Error fetching subtasks:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const createSubtask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, completed } = req.body;
        
        if (!title) {
            return res.status(400).json({ status: 'error', message: 'Title is required' });
        }
        
        const tasks = getMockTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }
        
        const newSubtask = {
            id: `sub_${Date.now()}`,
            title,
            completed: completed || false
        };
        
        if (!tasks[taskIndex].subtasks) tasks[taskIndex].subtasks = [];
        tasks[taskIndex].subtasks.push(newSubtask);
        
        saveMockTasks(tasks);
        
        res.status(201).json({
            status: 'success',
            data: { subtask: newSubtask }
        });
    } catch (error) {
        console.error('Error creating subtask:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const updateSubtasksList = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { subtasks } = req.body;
        
        if (!Array.isArray(subtasks)) {
            return res.status(400).json({ status: 'error', message: 'Subtasks array is required' });
        }
        
        const tasks = getMockTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }
        
        tasks[taskIndex].subtasks = subtasks;
        
        saveMockTasks(tasks);
        
        res.status(200).json({
            status: 'success',
            data: { subtasks: tasks[taskIndex].subtasks }
        });
    } catch (error) {
        console.error('Error updating subtasks list:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};
