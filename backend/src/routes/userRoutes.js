import express from 'express';
import { searchUsers, uploadAvatar, removeAvatar } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { uploadAvatar as uploadAvatarMiddleware } from '../config/multer.js';

const router = express.Router();

router.get('/search', protect, searchUsers);

// Avatar management (authenticated)
router.post('/avatar', protect, uploadAvatarMiddleware.single('avatar'), uploadAvatar);
router.delete('/avatar', protect, removeAvatar);

export default router;

