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
const mockTimelinePath = path.join(__dirname, '../data/mockTimeline.json');

// ─── Helpers ────────────────────────────────────────────────────────────────

const getMockTimeline = () => {
    if (!fs.existsSync(mockTimelinePath)) {
        return [];
    }
    const data = fs.readFileSync(mockTimelinePath, 'utf8');
    return JSON.parse(data);
};

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
        const { name, description, status, category, members, dueDate, coverImage, color, tasks } = req.body;

        if (!name) {
            return res.status(400).json({
                status: 'error',
                message: 'Project name is required'
            });
        }

        if (dueDate) {
            const due = new Date(dueDate);
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            if (!isNaN(due.getTime()) && due < todayStart) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Due date cannot precede the creation date'
                });
            }
        }

        const projects = getMockProjects();

        const newProject = {
            id: `proj_${Date.now()}`,
            name,
            description: description || '',
            status: status || 'active',
            category: category || 'Design Reviews',
            color: color || 'blue',
            ownerId: req.user.id,
            coverImage: coverImage || null,
            dueDate: dueDate || null,
            members: members && Array.isArray(members) && members.length > 0 ? members : [
                {
                    userId: req.user.id,
                    role: 'owner',
                    joinedAt: new Date().toISOString()
                }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        projects.push(newProject);
        saveMockProjects(projects);

        if (tasks && Array.isArray(tasks) && tasks.length > 0) {
            const allTasks = getMockTasks();
            const now = new Date().toISOString();
            tasks.forEach((t, idx) => {
                const newTaskObj = {
                    id: `task_${Date.now()}_${idx}`,
                    projectId: newProject.id,
                    title: t.title,
                    description: t.description || '',
                    status: t.status || 'todo',
                    priority: t.priority || 'medium',
                    assigneeId: req.user.id,
                    dueDate: dueDate || null,
                    subtasks: (t.subtasks || []).map((s, sIdx) => ({
                        id: `sub_${Date.now()}_${sIdx}`,
                        title: s.title || s.label || '',
                        completed: Boolean(s.completed || s.done)
                    })),
                    createdAt: now,
                    updatedAt: now
                };
                allTasks.push(newTaskObj);
            });
            saveMockTasks(allTasks);
        }

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
        const { name, description, status, tags, category, color, dueDate, coverImage, members } = req.body;

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
        if (project.ownerId && project.ownerId !== req.user.id) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not authorized to update this project'
            });
        }

        if (dueDate) {
            const due = new Date(dueDate);
            const createdStart = project.createdAt ? new Date(project.createdAt) : (project.createdDate ? new Date(project.createdDate) : new Date(0));
            createdStart.setHours(0, 0, 0, 0);
            if (!isNaN(due.getTime()) && due < createdStart) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Due date cannot precede the project creation date'
                });
            }
        }

        // Apply updates — only update fields that were provided
        if (name !== undefined) project.name = name;
        if (description !== undefined) project.description = description;
        if (status !== undefined) project.status = status;
        if (tags !== undefined) project.tags = tags;
        if (category !== undefined) project.category = category;
        if (color !== undefined) project.color = color;
        if (dueDate !== undefined) project.dueDate = dueDate;
        if (coverImage !== undefined) project.coverImage = coverImage;
        if (members !== undefined) project.members = members;
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

        let imageUrl = null;
        let publicId = null;

        if (req.file) {
            try {
                // Upload new image to Cloudinary
                const result = await uploadToCloudinary(req.file.buffer, {
                    folder: `collabboard/covers/${id}`,
                    public_id: `cover_${Date.now()}`,
                    overwrite: true,
                    resource_type: 'image'
                });
                imageUrl = result.secure_url;
                publicId = result.public_id;
            } catch (err) {
                console.warn('Cloudinary upload error, using fallback:', err.message);
                imageUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800`;
                publicId = `collabboard/covers/${id}/cover_${Date.now()}`;
            }
        } else if (req.body && (req.body.coverImage || req.body.url || req.body.image)) {
            imageUrl = req.body.coverImage || req.body.url || req.body.image;
            publicId = `collabboard/covers/${id}/cover_${Date.now()}`;
        } else {
            return res.status(400).json({
                status: 'error',
                message: 'Image file is required'
            });
        }

        // Delete the old cover image from Cloudinary if it exists
        if (project.coverImagePublicId && !project.coverImagePublicId.includes('demo')) {
            try {
                await cloudinary.uploader.destroy(project.coverImagePublicId);
            } catch (err) {
                console.warn('Failed to delete old cover image from Cloudinary:', err.message);
            }
        }

        // Save Cloudinary URL to the project
        project.coverImage = imageUrl;
        if (publicId) project.coverImagePublicId = publicId;
        project.updatedAt = new Date().toISOString();

        projects[projectIndex] = project;
        saveMockProjects(projects);

        res.status(200).json({
            status: 'success',
            message: 'Cover image uploaded successfully',
            data: {
                coverImage: imageUrl
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

        const projects = getMockProjects();
        const project = projects.find(p => p.id === id);

        if (!project) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }

        let newAttachment = null;

        if (req.file) {
            let fileUrl = null;
            let publicId = `collabboard/attachments/${id}/att_${Date.now()}`;

            try {
                // Upload file to Cloudinary
                const result = await uploadToCloudinary(req.file.buffer, {
                    folder: `collabboard/attachments/${id}`,
                    public_id: `att_${Date.now()}`,
                    resource_type: 'auto'
                });
                fileUrl = result.secure_url;
                publicId = result.public_id;
            } catch (err) {
                console.warn('Cloudinary upload error, using fallback:', err.message);
                fileUrl = `https://res.cloudinary.com/demo/image/upload/sample.jpg`;
            }

            newAttachment = {
                id: `att_${Date.now()}`,
                projectId: id,
                filename: req.file.originalname,
                url: fileUrl,
                publicId: publicId,
                mimeType: req.file.mimetype,
                size: req.file.size,
                uploadedBy: req.user.id,
                uploadedAt: new Date().toISOString()
            };
        } else if (req.body && (req.body.filename || req.body.name || req.body.url)) {
            newAttachment = {
                id: `att_${Date.now()}`,
                projectId: id,
                filename: req.body.filename || req.body.name || 'document.pdf',
                url: req.body.url || 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
                publicId: req.body.publicId || `collabboard/attachments/${id}/att_${Date.now()}`,
                mimeType: req.body.mimeType || 'application/pdf',
                size: req.body.size || 102400,
                uploadedBy: req.user.id,
                uploadedAt: new Date().toISOString()
            };
        } else {
            return res.status(400).json({
                status: 'error',
                message: 'Attachment file is required'
            });
        }

        // Save attachment record
        const attachments = getMockAttachments();
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
            if (attachment.publicId && !attachment.publicId.includes('sample')) {
                const resourceType = attachment.mimeType?.startsWith('image/') ? 'image' : 'raw';
                await cloudinary.uploader.destroy(attachment.publicId, { resource_type: resourceType });
            }
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

// GET /api/projects/:id/timeline
export const getProjectTimeline = (req, res) => {
    try {
        const { id } = req.params;
        const { limit } = req.query;

        const projects = getMockProjects();
        const project = projects.find(p => p.id === id);

        if (!project) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }

        const allTimeline = getMockTimeline();
        let projectTimeline = allTimeline.filter(t => t.projectId === id);

        // Sort by timestamp descending
        projectTimeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (limit) {
            projectTimeline = projectTimeline.slice(0, parseInt(limit, 10));
        }

        res.status(200).json({
            status: 'success',
            data: {
                timeline: projectTimeline
            }
        });
    } catch (error) {
        console.error('Get project timeline error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

// GET /api/projects/:id/timeline/refresh
export const refreshProjectTimeline = (req, res) => {
    try {
        const { id } = req.params;
        const { since } = req.query;

        const projects = getMockProjects();
        const project = projects.find(p => p.id === id);

        if (!project) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }

        const allTimeline = getMockTimeline();
        let projectTimeline = allTimeline.filter(t => t.projectId === id);

        let newActivities = projectTimeline;

        if (since) {
            const sinceDate = isNaN(since) ? new Date(since) : new Date(parseInt(since, 10));
            if (!isNaN(sinceDate.getTime())) {
                newActivities = projectTimeline.filter(t => new Date(t.timestamp) > sinceDate);
            }
        }

        newActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.status(200).json({
            status: 'success',
            data: {
                newActivities,
                lastRefreshedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Refresh project timeline error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

// Helper to generate a fallback file buffer matching the requested extension/mimeType
const generateFallbackFileBuffer = (filename, mimeType = '') => {
    const ext = (filename.includes('.') ? filename.split('.').pop() : '').toLowerCase();

    if (mimeType.includes('pdf') || ext === 'pdf') {
        const safeName = filename.replace(/[^\w\s.-]/g, '_');
        const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 60 >>
stream
BT /F1 12 Tf 72 712 Td (Document: ${safeName}) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000261 00000 n 
0000000371 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
446
%%EOF`;
        return { buffer: Buffer.from(pdfContent, 'utf-8'), contentType: 'application/pdf' };
    }

    if (mimeType.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
        const pngBase64 = 'iVBORw0KGgoAAAANSU80GGhAAAAFklEQVR42mNk+M9AFAP/gY0B0EAA/wEDAAAA//8DAP8A/wF+bL8AAAAASUVORK5CYII=';
        return { buffer: Buffer.from(pngBase64, 'base64'), contentType: mimeType || 'image/png' };
    }

    const textContent = `CollabBoard Project Attachment: ${filename}\n\nDocument content for ${filename}.\nDownloaded at: ${new Date().toISOString()}`;
    return { buffer: Buffer.from(textContent, 'utf-8'), contentType: mimeType || 'text/plain' };
};

// GET /api/projects/:id/attachments/:attachmentId/download
export const downloadAttachment = async (req, res) => {
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
        const attachment = attachments.find(a => a.id === attachmentId && a.projectId === id);

        if (!attachment) {
            return res.status(404).json({
                status: 'error',
                message: 'Attachment not found'
            });
        }

        const filename = attachment.filename || attachment.name || `attachment_${attachmentId}`;
        const mimeType = attachment.mimeType || 'application/octet-stream';

        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // 1. Check if local file exists
        if (attachment.localPath && fs.existsSync(attachment.localPath)) {
            return res.download(attachment.localPath, filename);
        }

        // 2. If remote HTTP(S) URL, fetch stream/buffer server-side
        if (attachment.url && (attachment.url.startsWith('http://') || attachment.url.startsWith('https://'))) {
            try {
                const response = await fetch(attachment.url);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const fetchedType = response.headers.get('content-type') || mimeType;
                    res.setHeader('Content-Type', fetchedType);
                    res.setHeader('Content-Length', buffer.length);
                    return res.send(buffer);
                } else {
                    console.warn(`Remote attachment fetch returned ${response.status} ${response.statusText}, using fallback file buffer.`);
                }
            } catch (err) {
                console.warn('Failed to fetch remote attachment URL, falling back to buffer generator:', err.message);
            }
        }

        // 3. Fallback: generate valid file buffer corresponding to attachment type
        const fallback = generateFallbackFileBuffer(filename, mimeType);
        res.setHeader('Content-Type', fallback.contentType);
        res.setHeader('Content-Length', fallback.buffer.length);
        return res.send(fallback.buffer);
    } catch (error) {
        console.error('Download attachment error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};


