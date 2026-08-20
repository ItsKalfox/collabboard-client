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

export const updateSubtask = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const { title, description, completed, comments } = req.body;
        
        const tasks = getMockTasks();
        let subtaskFound = false;
        let targetSubtask = null;
        
        for (const task of tasks) {
            if (task.subtasks) {
                const subtaskIndex = task.subtasks.findIndex(st => st.id === subtaskId);
                if (subtaskIndex !== -1) {
                    if (title !== undefined) task.subtasks[subtaskIndex].title = title;
                    if (description !== undefined) task.subtasks[subtaskIndex].description = description;
                    if (completed !== undefined) task.subtasks[subtaskIndex].completed = completed;
                    if (comments !== undefined) task.subtasks[subtaskIndex].comments = comments;
                    targetSubtask = task.subtasks[subtaskIndex];
                    subtaskFound = true;
                    break;
                }
            }
        }
        
        if (!subtaskFound) {
            return res.status(404).json({ status: 'error', message: 'Subtask not found' });
        }
        
        saveMockTasks(tasks);
        
        res.status(200).json({
            status: 'success',
            data: { subtask: targetSubtask }
        });
    } catch (error) {
        console.error('Error updating subtask:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const deleteSubtask = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const tasks = getMockTasks();
        let subtaskFound = false;
        
        for (const task of tasks) {
            if (task.subtasks) {
                const subtaskIndex = task.subtasks.findIndex(st => st.id === subtaskId);
                if (subtaskIndex !== -1) {
                    task.subtasks.splice(subtaskIndex, 1);
                    subtaskFound = true;
                    break;
                }
            }
        }
        
        if (!subtaskFound) {
            return res.status(404).json({ status: 'error', message: 'Subtask not found' });
        }
        
        saveMockTasks(tasks);
        
        res.status(200).json({
            status: 'success',
            message: 'Subtask deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting subtask:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};
