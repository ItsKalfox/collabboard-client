import cloudinary from '../config/cloudinary.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Attachment from '../models/Attachment.js';
import { parsePaginationAndSort, buildPaginationMeta } from '../utils/pagination.js';

const uploadToCloudinary = (buffer, options) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
        uploadStream.end(buffer);
    });
};

const checkTaskAuth = async (taskId, userId) => {
    const task = await Task.findById(taskId).populate('projectId');
    if (!task) return { error: 'Task not found', status: 404 };
    
    const isAssignee = task.assigneeId?.toString() === userId;
    const isOwner = task.projectId?.ownerId?.toString() === userId;
    
    if (!isAssignee && !isOwner) {
        return { error: 'Not authorized to modify this task', status: 403 };
    }
    
    return { task };
};

export const getTasksByProject = async (req, res) => {
    try {
        const projectId = req.params.projectId || req.query.projectId;
        if (!projectId) return res.status(400).json({ status: 'error', message: 'Project ID is required' });

        const paginationResult = parsePaginationAndSort(req.query, {
            allowedSortFields: ['createdAt', 'updatedAt', 'dueDate', 'title', 'priority', 'status'],
            defaultSortBy: 'createdAt',
            defaultSortOrder: 'desc'
        });

        if (paginationResult.error) {
            return res.status(400).json({ status: 'error', message: paginationResult.error });
        }

        const { page, limit, skip, sort } = paginationResult;

        const total = await Task.countDocuments({ projectId });
        const tasks = await Task.find({ projectId })
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('assigneeId', 'name avatar')
            .populate('attachments')
            .exec();

        const pagination = buildPaginationMeta(total, page, limit);

        res.status(200).json({
            status: 'success',
            data: {
                tasks,
                pagination
            },
            pagination
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const createTask = async (req, res) => {
    try {
        const { title, description, status, priority, assigneeId, dueDate } = req.body;
        const projectId = req.params.projectId || req.body.projectId;
        if (!projectId || !title) return res.status(400).json({ status: 'error', message: 'Project ID and title are required' });
        
        const task = await Task.create({
            projectId,
            title,
            description,
            status: status || 'todo',
            priority: priority || 'medium',
            assigneeId: assigneeId || req.user.id,
            dueDate,
            activities: [{
                type: 'created',
                text: `Task "${title}" created`,
                userId: req.user.id
            }]
        });

        res.status(201).json({ status: 'success', message: 'Task created successfully', data: { task } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId).populate('assigneeId', 'name avatar').exec();
        if (!task) return res.status(404).json({ status: 'error', message: 'Task not found' });
        res.status(200).json({ status: 'success', data: { task } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const updateTask = async (req, res) => {
    try {
        const { task, error, status } = await checkTaskAuth(req.params.taskId, req.user.id);
        if (error) return res.status(status).json({ status: 'error', message: error });
        
        const updatedTask = await Task.findByIdAndUpdate(req.params.taskId, req.body, { new: true });
        res.status(200).json({ status: 'success', message: 'Task updated', data: { task: updatedTask } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const { task, error, status } = await checkTaskAuth(req.params.taskId, req.user.id);
        if (error) return res.status(status).json({ status: 'error', message: error });
        
        if (task.imagePublicId) {
            try { await cloudinary.uploader.destroy(task.imagePublicId); } catch (e) {}
        }
        await Task.findByIdAndDelete(req.params.taskId);
        await Attachment.deleteMany({ taskId: req.params.taskId });

        res.status(200).json({ status: 'success', message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ status: 'error', message: 'Status is required' });
        
        const { task, error, status: authStatus } = await checkTaskAuth(req.params.taskId, req.user.id);
        if (error) return res.status(authStatus).json({ status: 'error', message: error });
        
        const oldStatus = task.status;
        task.status = status;
        
        if (oldStatus !== status) {
            task.activities.push({
                type: 'moved',
                text: `Moved from ${oldStatus} to ${status}`,
                fromStatus: oldStatus,
                toStatus: status,
                userId: req.user.id
            });
        }
        
        await task.save();
        
        res.status(200).json({ status: 'success', message: 'Status updated', data: { task } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const reviewTask = async (req, res) => {
    try {
        const { comment } = req.body;
        const task = await Task.findById(req.params.taskId);
        if (!task) return res.status(404).json({ status: 'error', message: 'Task not found' });
        
        task.reviews.push({ reviewerId: req.user.id, status: 'approved', comment });
        
        const oldStatus = task.status;
        task.status = 'completed'; // Assuming approval completes it
        
        task.activities.push({
            type: 'approved',
            text: `Task is approved by ${req.user.name} with this comment: ${comment}`,
            fromStatus: oldStatus,
            toStatus: 'completed',
            userId: req.user.id
        });
        
        await task.save();
        
        res.status(200).json({ status: 'success', message: 'Task approved', data: { task } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const rejectTask = async (req, res) => {
    try {
        const { comment } = req.body;
        if (!comment) return res.status(400).json({ status: 'error', message: 'Comment is required for rejection' });
        
        const task = await Task.findById(req.params.taskId);
        if (!task) return res.status(404).json({ status: 'error', message: 'Task not found' });
        
        task.reviews.push({ reviewerId: req.user.id, status: 'rejected', comment });
        
        const oldStatus = task.status;
        task.status = 'in_progress'; // Send back to progress
        
        task.activities.push({
            type: 'rejected',
            text: `Task is rejected by ${req.user.name} with this comment: ${comment}`,
            fromStatus: oldStatus,
            toStatus: 'in_progress',
            userId: req.user.id
        });
        
        await task.save();
        
        res.status(200).json({ status: 'success', message: 'Task rejected', data: { task } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const getTaskReviews = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId).populate('reviews.reviewerId', 'name avatar').exec();
        if (!task) return res.status(404).json({ status: 'error', message: 'Task not found' });
        
        res.status(200).json({ status: 'success', data: { reviews: task.reviews } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const getSubtasks = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);
        if (!task) return res.status(404).json({ status: 'error', message: 'Task not found' });
        res.status(200).json({ status: 'success', data: { subtasks: task.subtasks } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const createSubtask = async (req, res) => {
    try {
        const { title, completed } = req.body;
        if (!title) return res.status(400).json({ status: 'error', message: 'Title is required' });
        
        const { task, error, status } = await checkTaskAuth(req.params.taskId, req.user.id);
        if (error) return res.status(status).json({ status: 'error', message: error });
        
        task.subtasks.push({ title, completed: completed || false });
        await task.save();
        
        res.status(201).json({ status: 'success', message: 'Subtask created', data: { subtasks: task.subtasks } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const updateSubtasksList = async (req, res) => {
    try {
        const { subtasks } = req.body;
        if (!Array.isArray(subtasks)) return res.status(400).json({ status: 'error', message: 'Subtasks array is required' });
        
        const { task, error, status } = await checkTaskAuth(req.params.taskId, req.user.id);
        if (error) return res.status(status).json({ status: 'error', message: error });
        
        task.subtasks = subtasks;
        await task.save();
        
        res.status(200).json({ status: 'success', data: { subtasks: task.subtasks } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const uploadTaskImage = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ status: 'error', message: 'Image file is required' });
        
        const { task, error, status } = await checkTaskAuth(req.params.taskId, req.user.id);
        if (error) return res.status(status).json({ status: 'error', message: error });
        
        if (task.imagePublicId) {
            try { await cloudinary.uploader.destroy(task.imagePublicId); } catch (e) {}
        }
        
        const result = await uploadToCloudinary(req.file.buffer, {
            folder: `collabboard/tasks/${req.params.taskId}`,
            resource_type: 'image'
        });
        
        task.imageUrl = result.secure_url;
        task.imagePublicId = result.public_id;
        await task.save();
        
        res.status(200).json({ status: 'success', data: { imageUrl: task.imageUrl } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const deleteTaskImage = async (req, res) => {
    try {
        const { task, error, status } = await checkTaskAuth(req.params.taskId, req.user.id);
        if (error) return res.status(status).json({ status: 'error', message: error });
        
        if (task.imagePublicId) {
            try { await cloudinary.uploader.destroy(task.imagePublicId); } catch (e) {}
        }
        
        task.imageUrl = null;
        task.imagePublicId = null;
        await task.save();
        
        res.status(200).json({ status: 'success', message: 'Image deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const getTaskAttachments = async (req, res) => {
    try {
        const attachments = await Attachment.find({ taskId: req.params.taskId });
        res.status(200).json({ status: 'success', data: { attachments } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const addTaskAttachment = async (req, res) => {
    try {
        const { task, error, status } = await checkTaskAuth(req.params.taskId, req.user.id);
        if (error) return res.status(status).json({ status: 'error', message: error });
        
        let fileUrl = req.body.url || '';
        let publicId = req.body.publicId || '';
        let filename = req.body.filename || req.file?.originalname || 'document';
        let mimeType = req.body.mimeType || req.file?.mimetype;
        let size = req.body.size || req.file?.size;
        
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, {
                folder: `collabboard/attachments/tasks/${req.params.taskId}`,
                resource_type: 'auto'
            });
            fileUrl = result.secure_url;
            publicId = result.public_id;
        }
        
        if (!fileUrl) return res.status(400).json({ status: 'error', message: 'File is required' });
        
        const attachment = await Attachment.create({
            taskId: req.params.taskId,
            filename,
            url: fileUrl,
            publicId,
            mimeType,
            size,
            uploadedBy: req.user.id,
            originalname: req.file?.originalname
        });
        
        task.attachments.push(attachment._id);
        await task.save();
        
        res.status(201).json({ status: 'success', data: { attachment } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const deleteTaskAttachment = async (req, res) => {
    try {
        const { task, error, status } = await checkTaskAuth(req.params.taskId, req.user.id);
        if (error) return res.status(status).json({ status: 'error', message: error });
        
        const attachment = await Attachment.findOne({ _id: req.params.attachmentId, taskId: req.params.taskId });
        if (!attachment) return res.status(404).json({ status: 'error', message: 'Attachment not found' });
        
        if (attachment.publicId) {
            try { await cloudinary.uploader.destroy(attachment.publicId); } catch (e) {}
        }
        await Attachment.findByIdAndDelete(req.params.attachmentId);
        
        res.status(200).json({ status: 'success', message: 'Attachment deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};
