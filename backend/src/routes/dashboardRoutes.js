import express from 'express';
import { getTimeline, getOngoingProjectsStats } from '../controllers/dashboardController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // protect all dashboard routes

router.get('/timeline', getTimeline);
router.get('/projects/ongoing', getOngoingProjectsStats);

export default router;
