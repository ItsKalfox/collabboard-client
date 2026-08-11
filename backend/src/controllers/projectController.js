import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockProjectsPath = path.join(__dirname, '../data/mockProjects.json');

const getMockProjects = () => {
    if (!fs.existsSync(mockProjectsPath)) {
        return [];
    }
    const data = fs.readFileSync(mockProjectsPath, 'utf8');
    return JSON.parse(data);
};

export const getProjects = async (req, res) => {
    try {
        const projects = getMockProjects();
        res.status(200).json({
            status: 'success',
            data: { projects }
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;
        const projects = getMockProjects();
        
        const project = projects.find(p => p.id === projectId);
        if (!project) {
            return res.status(404).json({ status: 'error', message: 'Project not found' });
        }
        
        res.status(200).json({
            status: 'success',
            data: { project }
        });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};
