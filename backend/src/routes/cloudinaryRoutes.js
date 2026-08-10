import express from 'express';
import { getCloudinaryInfo } from '../controllers/cloudinaryController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/info', protect, getCloudinaryInfo);

export default router;
