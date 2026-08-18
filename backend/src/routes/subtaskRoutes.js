import express from 'express';
import { updateSubtask, deleteSubtask } from '../controllers/subtaskController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.patch('/:subtaskId', protect, updateSubtask);
router.delete('/:subtaskId', protect, deleteSubtask);

export default router;
