import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockTasksPath = path.join(__dirname, '../data/mockTasks.json');
const mockAttachmentsPath = path.join(__dirname, '../data/mockAttachments.json');

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

const getMockAttachments = () => {
    if (!fs.existsSync(mockAttachmentsPath)) {
        return [];
    }
    const data = fs.readFileSync(mockAttachmentsPath, 'utf8');
    return JSON.parse(data);
};

const saveMockAttachments = (data) => {
    fs.writeFileSync(mockAttachmentsPath, JSON.stringify(data, null, 2));
};

// Helper to upload a buffer to Cloudinary
const uploadToCloudinary = (buffer, options) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
        uploadStream.end(buffer);
    });
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
        const { title, description, status, assignee, priority, dueDate, progress, assignees, subtasks, attachments } = req.body;
        
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
            assignees: assignees || [],
            priority: priority !== undefined ? priority : 7,
            dueDate: dueDate || null,
            progress: progress || 0,
            subtasks: subtasks || [],
            attachments: attachments || [],
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
        const { title, description, status, assignee, priority, dueDate, progress, assignees } = req.body;
        
        const tasks = getMockTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }
        
        if (title !== undefined) tasks[taskIndex].title = title;
        if (description !== undefined) tasks[taskIndex].description = description;
        if (status !== undefined) tasks[taskIndex].status = status;
        if (assignee !== undefined) tasks[taskIndex].assignee = assignee;
        if (assignees !== undefined) tasks[taskIndex].assignees = assignees;
        if (priority !== undefined) tasks[taskIndex].priority = priority;
        if (dueDate !== undefined) tasks[taskIndex].dueDate = dueDate;
        if (progress !== undefined) tasks[taskIndex].progress = progress;
        
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

export const uploadTaskImage = async (req, res) => {
    try {
        const { taskId } = req.params;

        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'Image file is required' });
        }

        const tasks = getMockTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);

        if (taskIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }

        const task = tasks[taskIndex];

        if (task.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(task.imagePublicId);
            } catch (err) {
                console.warn('Failed to delete old task image from Cloudinary:', err.message);
            }
        }

        const result = await uploadToCloudinary(req.file.buffer, {
            folder: `collabboard/tasks/${taskId}`,
            public_id: `image_${Date.now()}`,
            overwrite: true,
            resource_type: 'image'
        });

        task.imageUrl = result.secure_url;
        task.imagePublicId = result.public_id;
        task.updatedAt = new Date().toISOString();

        tasks[taskIndex] = task;
        saveMockTasks(tasks);

        res.status(200).json({
            status: 'success',
            message: 'Task image uploaded successfully',
            data: {
                imageUrl: result.secure_url
            }
        });
    } catch (error) {
        console.error('Upload task image error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const deleteTaskImage = async (req, res) => {
    try {
        const { taskId } = req.params;

        const tasks = getMockTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);

        if (taskIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }

        const task = tasks[taskIndex];

        if (!task.imagePublicId) {
            return res.status(400).json({ status: 'error', message: 'Task has no image to delete' });
        }

        try {
            await cloudinary.uploader.destroy(task.imagePublicId);
        } catch (err) {
            console.error('Failed to delete task image from Cloudinary:', err.message);
            return res.status(500).json({ status: 'error', message: 'Failed to delete image from cloud storage' });
        }

        task.imageUrl = null;
        task.imagePublicId = null;
        task.updatedAt = new Date().toISOString();

        tasks[taskIndex] = task;
        saveMockTasks(tasks);

        res.status(200).json({
            status: 'success',
            message: 'Task image deleted successfully'
        });
    } catch (error) {
        console.error('Delete task image error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const getTaskAttachments = (req, res) => {
    try {
        const { taskId } = req.params;

        const tasks = getMockTasks();
        const task = tasks.find(t => t.id === taskId);

        if (!task) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }

        const allAttachments = getMockAttachments();
        const taskAttachments = allAttachments.filter(a => a.taskId === taskId);

        res.status(200).json({
            status: 'success',
            data: { attachments: taskAttachments }
        });
    } catch (error) {
        console.error('Get task attachments error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const addTaskAttachment = async (req, res) => {
    try {
        const { taskId } = req.params;

        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'Attachment file is required' });
        }

        const tasks = getMockTasks();
        const task = tasks.find(t => t.id === taskId);

        if (!task) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }

        const result = await uploadToCloudinary(req.file.buffer, {
            folder: `collabboard/attachments/tasks/${taskId}`,
            public_id: `att_${Date.now()}`,
            resource_type: 'auto'
        });

        const attachments = getMockAttachments();
        const newAttachment = {
            id: `att_${Date.now()}`,
            taskId,
            filename: req.file.originalname,
            url: result.secure_url,
            publicId: result.public_id,
            mimeType: req.file.mimetype,
            size: req.file.size,
            uploadedBy: req.user.id,
            uploadedAt: new Date().toISOString()
        };

        attachments.push(newAttachment);
        saveMockAttachments(attachments);

        if (!tasks[taskIndex].attachments) tasks[taskIndex].attachments = [];
        tasks[taskIndex].attachments.push(newAttachment);
        saveMockTasks(tasks);

        res.status(201).json({
            status: 'success',
            message: 'Attachment uploaded successfully',
            data: { attachment: newAttachment }
        });
    } catch (error) {
        console.error('Add task attachment error:', error);
        res.status(500).json({ status: 'error', message: 'Server error while uploading attachment' });
    }
};
