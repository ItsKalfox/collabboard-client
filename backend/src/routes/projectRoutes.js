import express from 'express';
import {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    uploadCoverImage,
    getAttachments,
    addAttachment,
    deleteAttachment,
    getProjectMembers,
    addProjectMember,
    removeProjectMember,
    getProjectTasks
} from '../controllers/projectController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { uploadImage, uploadFile } from '../config/multer.js';

const router = express.Router();

router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);
router.post('/:id/cover-image', protect, uploadImage.single('image'), uploadCoverImage);
router.get('/:id/attachments', protect, getAttachments);
router.post('/:id/attachments', protect, uploadFile.single('file'), addAttachment);
router.delete('/:id/attachments/:attachmentId', protect, deleteAttachment);

// Members routes
router.get('/:id/members', protect, getProjectMembers);
router.post('/:id/members', protect, addProjectMember);
router.delete('/:id/members/:userId', protect, removeProjectMember);

// Tasks route
router.get('/:id/tasks', protect, getProjectTasks);

export default router;