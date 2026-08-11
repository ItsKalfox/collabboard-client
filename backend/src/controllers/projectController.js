import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockProjectsPath = path.join(__dirname, '../data/mockProjects.json');
const mockAttachmentsPath = path.join(__dirname, '../data/mockAttachments.json');
const mockUsersPath = path.join(__dirname, '../data/mockData.json');
const mockTasksPath = path.join(__dirname, '../data/mockTasks.json');

// ─── Helpers ────────────────────────────────────────────────────────────────

const getMockTasks = () => {
    if (!fs.existsSync(mockTasksPath)) {
        return [];
    }
    const data = fs.readFileSync(mockTasksPath, 'utf8');
    return JSON.parse(data);
};

const getMockUsers = () => {
    if (!fs.existsSync(mockUsersPath)) {
        return [];
    }
    const data = fs.readFileSync(mockUsersPath, 'utf8');
    return JSON.parse(data);
};

const getMockProjects = () => {
    if (!fs.existsSync(mockProjectsPath)) {
        return [];
    }
    const data = fs.readFileSync(mockProjectsPath, 'utf8');
    return JSON.parse(data);
};

const saveMockProjects = (data) => {
    fs.writeFileSync(mockProjectsPath, JSON.stringify(data, null, 2));
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

// ─── Controllers ─────────────────────────────────────────────────────────────

// GET /api/projects
export const getProjects = (req, res) => {
    try {
        const { q } = req.query;

        let projects = getMockProjects();

        if (q) {
            const searchTerm = q.toLowerCase();
            projects = projects.filter(project =>
                project.name.toLowerCase().includes(searchTerm)
            );
        }

        res.status(200).json({
            status: 'success',
            data: {
                projects
            }
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

// GET /api/projects/:id
export const getProjectById = (req, res) => {
    try {
        const { id } = req.params;
        const projects = getMockProjects();

        const project = projects.find(p => p.id === id);

        if (!project) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                project
            }
        });
    } catch (error) {
        console.error('Get project by ID error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

// POST /api/projects
export const createProject = (req, res) => {
    try {
        const { name, description, status } = req.body;

        if (!name) {
            return res.status(400).json({
                status: 'error',
                message: 'Project name is required'
            });
        }

        const projects = getMockProjects();

        const newProject = {
            id: `proj_${Date.now()}`,
            name,
            description: description || '',
            status: status || 'active',
            ownerId: req.user.id,
            coverImage: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        projects.push(newProject);
        saveMockProjects(projects);

        res.status(201).json({
            status: 'success',
            message: 'Project created successfully',
            data: {
                project: newProject
            }
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

// PUT /api/projects/:id
export const updateProject = (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, status } = req.body;

        const projects = getMockProjects();
        const projectIndex = projects.findIndex(p => p.id === id);

        if (projectIndex === -1) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }

        const project = projects[projectIndex];

        // Only the owner can update the project
        if (project.ownerId !== req.user.id) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not authorized to update this project'
            });
        }

        // Apply updates — only update fields that were provided
        if (name !== undefined) project.name = name;
        if (description !== undefined) project.description = description;
        if (status !== undefined) project.status = status;
        project.updatedAt = new Date().toISOString();

        projects[projectIndex] = project;
        saveMockProjects(projects);

        res.status(200).json({
            status: 'success',
            message: 'Project updated successfully',
            data: {
                project
            }
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

// DELETE /api/projects/:id
export const deleteProject = (req, res) => {
    try {
        const { id } = req.params;

        const projects = getMockProjects();
        const projectIndex = projects.findIndex(p => p.id === id);

        if (projectIndex === -1) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }

        const project = projects[projectIndex];

        // Only the owner can delete the project
        if (project.ownerId !== req.user.id) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not authorized to delete this project'
            });
        }

        projects.splice(projectIndex, 1);
        saveMockProjects(projects);

        res.status(200).json({
            status: 'success',
            message: 'Project deleted successfully'
        });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

// POST /api/projects/:id/cover-image
export const uploadCoverImage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'Image file is required'
            });
        }

        const projects = getMockProjects();
        const projectIndex = projects.findIndex(p => p.id === id);

        if (projectIndex === -1) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }

        const project = projects[projectIndex];

        // Only the owner can change the cover image
        if (project.ownerId !== req.user.id) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not authorized to update this project'
            });
        }

        // Delete the old cover image from Cloudinary if it exists
        if (project.coverImagePublicId) {
            try {
                await cloudinary.uploader.destroy(project.coverImagePublicId);
            } catch (err) {
                console.warn('Failed to delete old cover image from Cloudinary:', err.message);
            }
        }

        // Upload new image to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, {
            folder: `collabboard/covers/${id}`,
            public_id: `cover_${Date.now()}`,
            overwrite: true,
            resource_type: 'image'
        });

        // Save Cloudinary URL to the project
        project.coverImage = result.secure_url;
        project.coverImagePublicId = result.public_id;
        project.updatedAt = new Date().toISOString();

        projects[projectIndex] = project;
        saveMockProjects(projects);

        res.status(200).json({
            status: 'success',
            message: 'Cover image uploaded successfully',
            data: {
                coverImage: result.secure_url
            }
        });
    } catch (error) {
        console.error('Upload cover image error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error while uploading image'
        });
    }
};

// GET /api/projects/:id/attachments
export const getAttachments = (req, res) => {
    try {
        const { id } = req.params;

        const projects = getMockProjects();
        const project = projects.find(p => p.id === id);

        if (!project) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }

        const allAttachments = getMockAttachments();
        const projectAttachments = allAttachments.filter(a => a.projectId === id);

        res.status(200).json({
            status: 'success',
            data: {
                attachments: projectAttachments
            }
        });
    } catch (error) {
        console.error('Get attachments error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

// POST /api/projects/:id/attachments
export const addAttachment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'Attachment file is required'
            });
        }

        const projects = getMockProjects();
        const project = projects.find(p => p.id === id);

        if (!project) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }

        // Upload file to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, {
            folder: `collabboard/attachments/${id}`,
            public_id: `att_${Date.now()}`,
            resource_type: 'auto'
        });

        // Save attachment record
        const attachments = getMockAttachments();
        const newAttachment = {
            id: `att_${Date.now()}`,
            projectId: id,
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

        res.status(201).json({
            status: 'success',
            message: 'Attachment uploaded successfully',
            data: {
                attachment: newAttachment
            }
        });
    } catch (error) {
        console.error('Add attachment error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error while uploading attachment'
        });
    }
};

// DELETE /api/projects/:id/attachments/:attachmentId
export const deleteAttachment = async (req, res) => {
    try {
        const { id, attachmentId } = req.params;

        const projects = getMockProjects();
        const project = projects.find(p => p.id === id);

        if (!project) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }

        const attachments = getMockAttachments();
        const attachmentIndex = attachments.findIndex(
            a => a.id === attachmentId && a.projectId === id
        );

        if (attachmentIndex === -1) {
            return res.status(404).json({
                status: 'error',
                message: 'Attachment not found'
            });
        }

        const attachment = attachments[attachmentIndex];

        // Only the uploader or the project owner can delete an attachment
        if (attachment.uploadedBy !== req.user.id && project.ownerId !== req.user.id) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not authorized to delete this attachment'
            });
        }

        // Delete from Cloudinary
        try {
            await cloudinary.uploader.destroy(attachment.publicId, { resource_type: 'auto' });
        } catch (err) {
            console.warn('Failed to delete attachment from Cloudinary:', err.message);
        }

        // Remove from store
        attachments.splice(attachmentIndex, 1);
        saveMockAttachments(attachments);

        res.status(200).json({
            status: 'success',
            message: 'Attachment deleted successfully'
        });
    } catch (error) {
        console.error('Delete attachment error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

// GET /api/projects/:id/members
export const getProjectMembers = (req, res) => {
    try {
        const { id } = req.params;
        const projects = getMockProjects();
        const project = projects.find(p => p.id === id);

        if (!project) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }

        const users = getMockUsers();
        const projectMembers = project.members || [
            { userId: project.ownerId, role: 'owner', joinedAt: project.createdAt }
        ];

        const membersWithDetails = projectMembers.map(m => {
            const user = users.find(u => u.id === m.userId);
            return {
                userId: m.userId,
                name: user ? user.name : 'Unknown User',
                email: user ? user.email : '',
                role: m.role || 'member',
                joinedAt: m.joinedAt || project.createdAt
            };
        });

        res.status(200).json({
            status: 'success',
            data: {
                members: membersWithDetails
            }
        });
    } catch (error) {
        console.error('Get project members error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

// POST /api/projects/:id/members
export const addProjectMember = (req, res) => {
    try {
        const { id } = req.params;
        const { userId, email, role } = req.body;

        if (!userId && !email) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID or email is required'
            });
        }

        const projects = getMockProjects();
        const projectIndex = projects.findIndex(p => p.id === id);

        if (projectIndex === -1) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }

        const project = projects[projectIndex];
        const users = getMockUsers();

        const targetUser = users.find(u =>
            (userId && u.id === userId) || (email && u.email.toLowerCase() === email.toLowerCase())
        );

        if (!targetUser) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        if (!project.members) {
            project.members = [{ userId: project.ownerId, role: 'owner', joinedAt: project.createdAt }];
        }

        const alreadyMember = project.members.some(m => m.userId === targetUser.id);
        if (alreadyMember) {
            return res.status(409).json({
                status: 'error',
                message: 'User is already a member of this project'
            });
        }

        const newMember = {
            userId: targetUser.id,
            role: role || 'member',
            joinedAt: new Date().toISOString()
        };

        project.members.push(newMember);
        project.updatedAt = new Date().toISOString();

        projects[projectIndex] = project;
        saveMockProjects(projects);

        res.status(201).json({
            status: 'success',
            message: 'Member added successfully',
            data: {
                member: {
                    userId: targetUser.id,
                    name: targetUser.name,
                    email: targetUser.email,
                    role: newMember.role,
                    joinedAt: newMember.joinedAt
                }
            }
        });
    } catch (error) {
        console.error('Add project member error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

// DELETE /api/projects/:id/members/:userId
export const removeProjectMember = (req, res) => {
    try {
        const { id, userId } = req.params;

        const projects = getMockProjects();
        const projectIndex = projects.findIndex(p => p.id === id);

        if (projectIndex === -1) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }

        const project = projects[projectIndex];

        if (!project.members) {
            project.members = [{ userId: project.ownerId, role: 'owner', joinedAt: project.createdAt }];
        }

        const memberIndex = project.members.findIndex(m => m.userId === userId);
        if (memberIndex === -1) {
            return res.status(404).json({
                status: 'error',
                message: 'Member not found in project'
            });
        }

        if (userId === project.ownerId || project.members[memberIndex].role === 'owner') {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot remove project owner'
            });
        }

        project.members.splice(memberIndex, 1);
        project.updatedAt = new Date().toISOString();

        projects[projectIndex] = project;
        saveMockProjects(projects);

        res.status(200).json({
            status: 'success',
            message: 'Member removed successfully'
        });
    } catch (error) {
        console.error('Remove project member error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

// GET /api/projects/:id/tasks
export const getProjectTasks = (req, res) => {
    try {
        const { id } = req.params;
        const projects = getMockProjects();
        const project = projects.find(p => p.id === id);

        if (!project) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }

        const allTasks = getMockTasks();
        const projectTasks = allTasks.filter(t => t.projectId === id);

        res.status(200).json({
            status: 'success',
            data: {
                tasks: projectTasks
            }
        });
    } catch (error) {
        console.error('Get project tasks error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};
