import express from 'express';
import { getTaskById, updateTask, deleteTask, updateTaskStatus, reviewTask, rejectTask, getTaskReviews } from '../controllers/taskController.js';
import { getSubtasks, createSubtask } from '../controllers/subtaskController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/:taskId', protect, getTaskById);
router.patch('/:taskId', protect, updateTask);
router.delete('/:taskId', protect, deleteTask);
router.patch('/:taskId/status', protect, updateTaskStatus);
router.post('/:taskId/review', protect, reviewTask);
router.post('/:taskId/reject', protect, rejectTask);
router.get('/:taskId/reviews', protect, getTaskReviews);

// Subtask routes
router.get('/:taskId/subtasks', protect, getSubtasks);
router.post('/:taskId/subtasks', protect, createSubtask);

export default router;
