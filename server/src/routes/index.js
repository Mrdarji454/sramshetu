import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import workerRoutes from './worker.routes.js';
import cooperativeRoutes from './cooperative.routes.js';
import adminRoutes from './admin.routes.js';

const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ShramSetu Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Resource routes under /api/v1
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/workers', workerRoutes);
apiRouter.use('/cooperatives', cooperativeRoutes);
apiRouter.use('/admin', adminRoutes);

export default apiRouter;

