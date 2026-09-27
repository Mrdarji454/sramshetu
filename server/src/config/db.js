import mongoose from 'mongoose';
import { config } from './env.js';

let reconnectTimer = null;
let reconnectAttempt = 0;

function scheduleReconnect() {
  if (config.env === 'production' || reconnectTimer) return;
  const delay = Math.min(1000 * (2 ** reconnectAttempt), 30000);
  reconnectAttempt += 1;
  console.warn(`[Database] Retrying MongoDB connection in ${Math.ceil(delay / 1000)}s.`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectDB();
  }, delay);
  reconnectTimer.unref();
}

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });

    reconnectAttempt = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    // In development or when MongoDB is not currently running, do not crash immediately so dev API inspection works
    if (config.env === 'production') {
      process.exit(1);
    }
    scheduleReconnect();
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB disconnected.');
  scheduleReconnect();
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database Error] ${err.message}`);
});

