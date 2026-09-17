import { Router } from 'express';
import { AiController } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

/**
 * @route   POST /api/ai/workload
 * @desc    Get workload demand forecast and priority metrics
 * @access  Protected: ADMIN, COOPERATIVE only (Step 3 & Step 12)
 */
router.post(
  '/workload',
  protect,
  authorize('ADMIN', 'COOPERATIVE'),
  AiController.getWorkloadPrediction
);

/**
 * @route   GET /api/ai/health
 * @desc    System health check for FastAPI microservice (Step 7)
 * @access  Public
 */
router.get('/health', AiController.getHealth);

export default router;

