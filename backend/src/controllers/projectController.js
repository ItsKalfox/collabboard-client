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