import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB() {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    // In development or when MongoDB is not currently running, do not crash immediately so dev API inspection works
    if (config.env === 'production') {
      process.exit(1);
    }
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database Error] ${err.message}`);
});

