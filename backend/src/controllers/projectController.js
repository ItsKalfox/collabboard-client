import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockProjectsPath = path.join(__dirname, '../data/mockProjects.json');

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