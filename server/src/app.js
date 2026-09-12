import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/AppError.js';

const app = express();

// 1. Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: config.clientUrl || '*',
    credentials: true,
  })
);

// 2. Request body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. API Version 1 Mount
app.use('/api/v1', apiRouter);

// 4. Root welcome / health endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to ShramSetu Cooperative Digital Service Marketplace API',
    docs: '/api/v1/health',
  });
});

// 5. Catch-all for unhandled routes (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// 6. Centralized Error Handling Middleware (must be last)
app.use(errorHandler);

export default app;

