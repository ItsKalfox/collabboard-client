import express from 'express';
import { getTimeline } from '../controllers/dashboardController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // protect all dashboard routes

router.get('/timeline', getTimeline);

export default router;
