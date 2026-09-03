import cloudinary from '../config/cloudinary.js';
import projectRepository from '../repositories/projectRepository.js';
import Task from '../models/Task.js';
import Attachment from '../models/Attachment.js';
import userService from '../services/userService.js';

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

// GET /api/projects
export const getProjects = async (req, res) => {
    try {
        const { q } = req.query;
        let query = {
            $or: [
                { ownerId: req.user.id },
                { 'members.userId': req.user.id }
            ]
        };
        if (q) {
            query.name = { $regex: q, $options: 'i' };
        }

        const projects = await projectRepository.findWithMembers(query);

        const projectIds = projects.map(p => p._id);
        const allTasks = await Task.find({ projectId: { $in: projectIds } }).exec();

        const tasksByProject = {};
        allTasks.forEach(t => {
            const pid = t.projectId.toString();
            if (!tasksByProject[pid]) tasksByProject[pid] = [];
            tasksByProject[pid].push(t);
        });

        // Format members as requested by frontend
        const projectsWithMembers = projects.map(project => {
            const projObj = project.toObject();
            projObj.tasks = tasksByProject[project._id.toString()] || [];
            projObj.members = projObj.members.map(m => {
                const user = m.userId;
                return {
                    userId: user ? user._id : m.userId,
                    role: m.role,
                    reviewAccess: m.reviewAccess,
                    joinedAt: m.joinedAt,
                    name: user ? user.name : 'Unknown User',
                    email: user ? user.email : '',
                    avatar: user ? user.avatar : ''
                };
            });
            return projObj;
        });

        res.status(200).json({ status: 'success', data: { projects: projectsWithMembers } });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// GET /api/projects/:id
export const getProjectById = async (req, res) => {
    try {
        const project = await projectRepository.findByIdWithMembers(req.params.id);
        if (!project) return res.status(404).json({ status: 'error', message: 'Project not found' });

        const projObj = project.toObject();
        projObj.members = projObj.members.map(m => {
            const user = m.userId;
            return {
                userId: user ? user._id : m.userId,
                role: m.role,
                reviewAccess: m.reviewAccess,
                joinedAt: m.joinedAt,
                name: user ? user.name : 'Unknown User',
                email: user ? user.email : '',
                avatar: user ? user.avatar : ''
            };
        });

        res.status(200).json({ status: 'success', data: { project: projObj } });
    } catch (error) {
        console.error('Get project by ID error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// POST /api/projects
export const createProject = async (req, res) => {
    try {
        const { name, description, status, category, color, dueDate, coverImage, tasks } = req.body;
        if (!name) return res.status(400).json({ status: 'error', message: 'Project name is required' });

        if (dueDate) {
            const due = new Date(dueDate);
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            if (!isNaN(due.getTime()) && due < todayStart) {
                return res.status(400).json({ status: 'error', message: 'Due date cannot precede the creation date' });
            }
        }

        const project = await projectRepository.create({
            name,
            description,
            status,
            category: category || 'Design Reviews',
            color: color || 'blue',
            ownerId: req.user.id,
            coverImage: coverImage || null,
            dueDate: dueDate || null,
            members: [{ userId: req.user.id, role: 'owner' }]
        });

        if (tasks && Array.isArray(tasks) && tasks.length > 0) {
            const taskDocs = tasks.map(t => ({
                projectId: project._id,
                title: t.title,
                description: t.description || '',
                status: t.status || 'todo',
                priority: t.priority || 'medium',
                assigneeId: t.assigneeId || req.user.id,
                dueDate: dueDate || null,
                subtasks: (t.subtasks || []).map(s => ({
                    title: s.title || s.label || '',
                    completed: Boolean(s.completed || s.done)
                })),
                activities: [{
                    type: 'created',
                    text: `Task "${t.title}" created`,
                    userId: req.user.id
                }]
            }));
            await Task.insertMany(taskDocs);
        }

        res.status(201).json({ status: 'success', message: 'Project created successfully', data: { project } });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// PUT /api/projects/:id
export const updateProject = async (req, res) => {
    try {
        const project = await projectRepository.findById(req.params.id);
        if (!project) return res.status(404).json({ status: 'error', message: 'Project not found' });

        if (project.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ status: 'error', message: 'You are not authorized to update this project' });
        }
        if (req.body.dueDate) {
            const newDue = new Date(req.body.dueDate);
            const oldDue = project.dueDate ? new Date(project.dueDate) : null;
            if (!isNaN(newDue.getTime()) && (!oldDue || newDue.getTime() !== oldDue.getTime())) {
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const createdAt = new Date(project.createdAt);
                createdAt.setHours(0, 0, 0, 0);

                if (newDue < todayStart) {
                    return res.status(400).json({ status: 'error', message: 'Due date cannot be before today' });
                }
                if (newDue < createdAt) {
                    return res.status(400).json({ status: 'error', message: 'Due date cannot precede the creation date' });
                }
            }
        }

        // Safely update fields using Mongoose's .set() method
        project.set(req.body);

        // Explicitly ensure dueDate is set correctly, handling empty strings as null
        if (req.body.dueDate !== undefined) {
            project.dueDate = req.body.dueDate || null;
        }

        await projectRepository.save(project);

        res.status(200).json({ status: 'success', message: 'Project updated successfully', data: { project } });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
    try {
        const project = await projectRepository.findById(req.params.id);
        if (!project) return res.status(404).json({ status: 'error', message: 'Project not found' });

        if (project.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ status: 'error', message: 'You are not authorized to delete this project' });
        }

        await projectRepository.findByIdAndDelete(req.params.id);
        await Task.deleteMany({ projectId: req.params.id });
        await Attachment.deleteMany({ projectId: req.params.id });

        res.status(200).json({ status: 'success', message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// POST /api/projects/:id/cover-image
export const uploadCoverImage = async (req, res) => {
    try {
        const project = await projectRepository.findById(req.params.id);
        if (!project) return res.status(404).json({ status: 'error', message: 'Project not found' });

        if (project.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ status: 'error', message: 'You are not authorized to update this project' });
        }

        let imageUrl = null;
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, {
                folder: `collabboard/covers/${req.params.id}`,
                resource_type: 'image'
            });
            imageUrl = result.secure_url;
        } else if (req.body.coverImage) {
            imageUrl = req.body.coverImage;
        } else {
            return res.status(400).json({ status: 'error', message: 'Image file is required' });
        }

        project.coverImage = imageUrl;
        await projectRepository.save(project);

        res.status(200).json({ status: 'success', message: 'Cover image uploaded successfully', data: { coverImage: imageUrl } });
    } catch (error) {
        console.error('Upload cover image error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// GET /api/projects/:id/attachments
export const getAttachments = async (req, res) => {
    try {
        const attachments = await Attachment.find({ projectId: req.params.id });
        res.status(200).json({ status: 'success', data: { attachments } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// POST /api/projects/:id/attachments
export const addAttachment = async (req, res) => {
    try {
        const project = await projectRepository.findById(req.params.id);
        if (!project) return res.status(404).json({ status: 'error', message: 'Project not found' });

        let fileUrl = req.body.url || '';
        let publicId = req.body.publicId || '';
        let filename = req.body.filename || req.file?.originalname || 'document';
        let mimeType = req.body.mimeType || req.file?.mimetype;
        let size = req.body.size || req.file?.size;

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, {
                folder: `collabboard/attachments/${req.params.id}`,
                resource_type: 'auto'
            });
            fileUrl = result.secure_url;
            publicId = result.public_id;
        }

        if (!fileUrl) return res.status(400).json({ status: 'error', message: 'Attachment file is required' });

        const attachment = await Attachment.create({
            projectId: req.params.id,
            filename,
            url: fileUrl,
            publicId,
            mimeType,
            size,
            uploadedBy: req.user.id
        });

        res.status(201).json({ status: 'success', data: { attachment } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// DELETE /api/projects/:id/attachments/:attachmentId
export const deleteAttachment = async (req, res) => {
    try {
        const attachment = await Attachment.findOne({ _id: req.params.attachmentId, projectId: req.params.id });
        if (!attachment) return res.status(404).json({ status: 'error', message: 'Attachment not found' });

        const project = await projectRepository.findById(req.params.id);
        if (attachment.uploadedBy.toString() !== req.user.id && project.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ status: 'error', message: 'Not authorized' });
        }

        if (attachment.publicId) {
            try { await cloudinary.uploader.destroy(attachment.publicId); } catch (e) { }
        }
        await Attachment.findByIdAndDelete(req.params.attachmentId);
        res.status(200).json({ status: 'success', message: 'Attachment deleted successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// GET /api/projects/:id/members
export const getProjectMembers = async (req, res) => {
    try {
        const project = await projectRepository.findByIdWithMembers(req.params.id);
        if (!project) return res.status(404).json({ status: 'error', message: 'Project not found' });

        const members = project.members.map(m => {
            const user = m.userId;
            return {
                userId: user ? user._id : m.userId,
                name: user ? user.name : 'Unknown User',
                email: user ? user.email : '',
                avatar: user ? user.avatar : '',
                role: m.role,
                reviewAccess: m.reviewAccess,
                joinedAt: m.joinedAt
            };
        });

        res.status(200).json({ status: 'success', data: { members } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// POST /api/projects/:id/members
export const addProjectMember = async (req, res) => {
    try {
        const { userId, email, role } = req.body;
        const project = await projectRepository.findById(req.params.id);
        if (!project) return res.status(404).json({ status: 'error', message: 'Project not found' });

        if (project.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ status: 'error', message: 'Only owner can add members' });
        }

        let user = null;
        if (userId) user = await userService.getUserById(userId);
        else if (email) user = await userService.getUserByEmail(email);

        if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
        if (project.members.some(m => m.userId.toString() === user._id.toString())) {
            return res.status(409).json({ status: 'error', message: 'User already a member' });
        }

        const newMember = { userId: user._id, role: role || 'member' };
        project.members.push(newMember);
        await projectRepository.save(project);

        res.status(201).json({
            status: 'success',
            data: { member: { ...newMember, name: user.name, email: user.email } }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// DELETE /api/projects/:id/members/:userId
export const removeProjectMember = async (req, res) => {
    try {
        const project = await projectRepository.findById(req.params.id);
        if (!project) return res.status(404).json({ status: 'error', message: 'Project not found' });

        if (project.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ status: 'error', message: 'Only owner can remove members' });
        }

        if (req.params.userId === project.ownerId.toString()) {
            return res.status(400).json({ status: 'error', message: 'Cannot remove owner' });
        }

        project.members = project.members.filter(m => m.userId.toString() !== req.params.userId);
        await projectRepository.save(project);

        res.status(200).json({ status: 'success', message: 'Member removed successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// GET /api/projects/:id/tasks
export const getProjectTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ projectId: req.params.id }).populate('attachments');
        res.status(200).json({ status: 'success', data: { tasks } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// Timeline events would typically come from an Activity/Audit log model.
// As a simple placeholder, we'll return recent tasks.
export const getProjectTimeline = async (req, res) => {
    try {
        const tasks = await Task.find({ projectId: req.params.id }).sort({ createdAt: -1 }).limit(parseInt(req.query.limit) || 20).populate('assigneeId', 'name');

        const timeline = tasks.map(t => ({
            id: t._id,
            projectId: t.projectId,
            type: 'task_created',
            title: `Task "${t.title}" created`,
            description: t.description,
            timestamp: t.createdAt,
            user: t.assigneeId ? { name: t.assigneeId.name } : null
        }));

        res.status(200).json({ status: 'success', data: { timeline } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const refreshProjectTimeline = getProjectTimeline;

export const downloadAttachment = async (req, res) => {
    try {
        const attachment = await Attachment.findOne({ _id: req.params.attachmentId, projectId: req.params.id });
        if (!attachment) return res.status(404).json({ status: 'error', message: 'Attachment not found' });

        res.redirect(attachment.url); // Simplified download logic using Cloudinary URL
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};