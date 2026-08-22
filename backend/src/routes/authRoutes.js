import express from 'express';
import { registerUser, loginUser, getCurrentUser, forgotPassword, resetPassword, updateProfile, updateEmail, changePassword } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getCurrentUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Account management (authenticated)
router.patch('/profile', protect, updateProfile);
router.patch('/email', protect, updateEmail);
router.patch('/password', protect, changePassword);

export default router;

