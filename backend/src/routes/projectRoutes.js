import express from 'express';
import { getProjects, getProjectById, createProject, updateProject, deleteProject, uploadCoverImage } from '../controllers/projectController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { uploadImage } from '../config/multer.js';

const router = express.Router();

router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);
router.post('/:id/cover-image', protect, uploadImage.single('image'), uploadCoverImage);

export default router;