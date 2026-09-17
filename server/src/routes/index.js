import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import workerRoutes from './worker.routes.js';
import cooperativeRoutes from './cooperative.routes.js';
import adminRoutes from './admin.routes.js';
import serviceRoutes from './service.routes.js';
import bookingRoutes from './booking.routes.js';
import matchingRoutes from './matching.routes.js';
import aiRoutes from './ai.routes.js';

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
apiRouter.use('/services', serviceRoutes);
apiRouter.use('/bookings', bookingRoutes);
apiRouter.use('/matching', matchingRoutes);
apiRouter.use('/ai', aiRoutes);

export default apiRouter;

