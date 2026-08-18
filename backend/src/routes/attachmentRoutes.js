import express from 'express';
import { getAttachmentById, deleteAttachmentById } from '../controllers/attachmentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/:attachmentId', protect, getAttachmentById);
router.delete('/:attachmentId', protect, deleteAttachmentById);

export default router;
