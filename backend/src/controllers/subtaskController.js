import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockSubtasksPath = path.join(__dirname, '../data/mockSubtasks.json');
const mockTasksPath = path.join(__dirname, '../data/mockTasks.json');

// ── Helpers ──────────────────────────────────────────────────────────────────

const getSubtasksList = () => {
    if (!fs.existsSync(mockSubtasksPath)) return [];
    return JSON.parse(fs.readFileSync(mockSubtasksPath, 'utf8'));
};

const saveSubtasksList = (data) => {
    fs.writeFileSync(mockSubtasksPath, JSON.stringify(data, null, 2));
};

const getTasksList = () => {
    if (!fs.existsSync(mockTasksPath)) return [];
    return JSON.parse(fs.readFileSync(mockTasksPath, 'utf8'));
};

const saveTasksList = (data) => {
    fs.writeFileSync(mockTasksPath, JSON.stringify(data, null, 2));
};

// ── GET /api/tasks/:taskId/subtasks ───────────────────────────────────────────

export const getSubtasks = async (req, res) => {
    try {
        const { taskId } = req.params;

        // Verify parent task exists
        const tasks = getTasksList();
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }

        const subtasks = getSubtasksList();
        const taskSubtasks = subtasks.filter(s => s.taskId === taskId);

        res.status(200).json({
            status: 'success',
            data: { subtasks: taskSubtasks }
        });
    } catch (error) {
        console.error('Error fetching subtasks:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// ── POST /api/tasks/:taskId/subtasks ─────────────────────────────────────────

export const createSubtask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({ status: 'error', message: 'Title is required' });
        }

        // Verify parent task exists
        const tasks = getTasksList();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }

        const now = new Date().toISOString();
        const newSubtask = {
            id: `sub_${Date.now()}`,
            taskId,
            title,
            completed: false,
            createdAt: now,
            updatedAt: now
        };

        // Persist to flat list
        const subtasks = getSubtasksList();
        subtasks.push(newSubtask);
        saveSubtasksList(subtasks);

        // Sync into embedded array on the parent task
        if (!tasks[taskIndex].subtasks) tasks[taskIndex].subtasks = [];
        tasks[taskIndex].subtasks.push({ id: newSubtask.id, title: newSubtask.title, completed: false });
        tasks[taskIndex].updatedAt = now;
        saveTasksList(tasks);

        res.status(201).json({
            status: 'success',
            data: { subtask: newSubtask }
        });
    } catch (error) {
        console.error('Error creating subtask:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// ── PATCH /api/subtasks/:subtaskId ────────────────────────────────────────────

export const updateSubtask = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const { title, completed } = req.body;

        const subtasks = getSubtasksList();
        const subtaskIndex = subtasks.findIndex(s => s.id === subtaskId);
        if (subtaskIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'Subtask not found' });
        }

        const now = new Date().toISOString();
        if (title !== undefined) subtasks[subtaskIndex].title = title;
        if (completed !== undefined) subtasks[subtaskIndex].completed = completed;
        subtasks[subtaskIndex].updatedAt = now;
        saveSubtasksList(subtasks);

        // Sync back into parent task's embedded array
        const tasks = getTasksList();
        const taskIndex = tasks.findIndex(t => t.id === subtasks[subtaskIndex].taskId);
        if (taskIndex !== -1 && Array.isArray(tasks[taskIndex].subtasks)) {
            const embIdx = tasks[taskIndex].subtasks.findIndex(s => s.id === subtaskId);
            if (embIdx !== -1) {
                if (title !== undefined) tasks[taskIndex].subtasks[embIdx].title = title;
                if (completed !== undefined) tasks[taskIndex].subtasks[embIdx].completed = completed;
                tasks[taskIndex].updatedAt = now;
                saveTasksList(tasks);
            }
        }

        res.status(200).json({
            status: 'success',
            data: { subtask: subtasks[subtaskIndex] }
        });
    } catch (error) {
        console.error('Error updating subtask:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// ── DELETE /api/subtasks/:subtaskId ───────────────────────────────────────────

export const deleteSubtask = async (req, res) => {
    try {
        const { subtaskId } = req.params;

        const subtasks = getSubtasksList();
        const subtaskIndex = subtasks.findIndex(s => s.id === subtaskId);
        if (subtaskIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'Subtask not found' });
        }

        const removed = subtasks[subtaskIndex];
        subtasks.splice(subtaskIndex, 1);
        saveSubtasksList(subtasks);

        // Remove from parent task's embedded array
        const tasks = getTasksList();
        const taskIndex = tasks.findIndex(t => t.id === removed.taskId);
        if (taskIndex !== -1 && Array.isArray(tasks[taskIndex].subtasks)) {
            tasks[taskIndex].subtasks = tasks[taskIndex].subtasks.filter(s => s.id !== subtaskId);
            tasks[taskIndex].updatedAt = new Date().toISOString();
            saveTasksList(tasks);
        }

        res.status(200).json({
            status: 'success',
            message: 'Subtask deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting subtask:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};
