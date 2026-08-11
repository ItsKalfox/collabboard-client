import express from 'express';
import { getProjects, getProjectById, createProject, updateProject } from '../controllers/projectController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);

export default router;