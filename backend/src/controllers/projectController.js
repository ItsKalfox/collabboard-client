import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockProjectsPath = path.join(__dirname, '../data/mockProjects.json');
const mockAttachmentsPath = path.join(__dirname, '../data/mockAttachments.json');

// ─── Helpers ────────────────────────────────────────────────────────────────

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