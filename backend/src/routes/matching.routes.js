import express from 'express';
import { findWorker, getNearbyJobs } from '../controllers/matching.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/find-worker', authenticate, findWorker);
router.get('/nearby-jobs/:workerId', authenticate, getNearbyJobs);

export default router;
