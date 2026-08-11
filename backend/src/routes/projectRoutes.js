import express from 'express';
import { getProjects, getProjectById } from '../controllers/projectController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getProjects);
router.get('/:projectId', protect, getProjectById);

export default router;
