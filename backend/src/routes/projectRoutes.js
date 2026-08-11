import express from 'express';
import { getProjects, getProjectById } from '../controllers/projectController.js';
import { getTasksByProject, createTask } from '../controllers/taskController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getProjects);
router.get('/:projectId', protect, getProjectById);

// Project Task routes
router.get('/:projectId/tasks', protect, getTasksByProject);
router.post('/:projectId/tasks', protect, createTask);

export default router;
