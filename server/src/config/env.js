import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`[WARNING] Required environment variable "${envVar}" is not set in environment.`);
  }
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/shramsetu',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_fallback_secret_shramsetu_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

