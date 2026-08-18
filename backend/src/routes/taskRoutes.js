import express from 'express';
import { getTaskById, updateTask, deleteTask, updateTaskStatus, reviewTask, rejectTask, getTaskReviews, getSubtasks, createSubtask, updateSubtasksList, uploadTaskImage, deleteTaskImage } from '../controllers/taskController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/:taskId', protect, getTaskById);
router.patch('/:taskId', protect, updateTask);
router.delete('/:taskId', protect, deleteTask);
router.patch('/:taskId/status', protect, updateTaskStatus);
router.post('/:taskId/review', protect, reviewTask);
router.post('/:taskId/reject', protect, rejectTask);
router.get('/:taskId/reviews', protect, getTaskReviews);

// Subtask endpoints
router.get('/:taskId/subtasks', protect, getSubtasks);
router.post('/:taskId/subtasks', protect, createSubtask);
router.patch('/:taskId/subtasks', protect, updateSubtasksList);

// Image endpoints
import { uploadImage } from '../config/multer.js';
router.post('/:taskId/image', protect, uploadImage.single('image'), uploadTaskImage);
router.delete('/:taskId/image', protect, deleteTaskImage);

export default router;
