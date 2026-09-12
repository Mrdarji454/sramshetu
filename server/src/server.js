import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

// Catch uncaught synchronous exceptions
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception! Shutting down...', err);
  process.exit(1);
});

// Initialize database connection
await connectDB();

// Start Express HTTP Server
const server = app.listen(config.port, () => {
  console.log(
    `[Server] ShramSetu backend running in ${config.env} mode on port ${config.port}`
  );
  console.log(`[Server] Health Check available at http://localhost:${config.port}/api/v1/health`);
});

// Catch unhandled Promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[FATAL] Unhandled Rejection! Shutting down gracefully...', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle graceful process termination (SIGTERM / SIGINT)
const gracefulShutdown = (signal) => {
  console.log(`[Server] ${signal} signal received: closing HTTP server...`);
  server.close(() => {
    console.log('[Server] HTTP server closed gracefully.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

