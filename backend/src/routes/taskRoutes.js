import express from 'express';
import { getTaskById, updateTask, deleteTask } from '../controllers/taskController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/:taskId', protect, getTaskById);
router.patch('/:taskId', protect, updateTask);
router.delete('/:taskId', protect, deleteTask);

export default router;
