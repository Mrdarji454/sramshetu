import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Load environment variables from .env file
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const runtimeEnvironment = () => process.env.NODE_ENV || 'development';
const paymentsAreEnabled = () => process.env.PAYMENTS_ENABLED === 'true' ||
  (runtimeEnvironment() !== 'development' && process.env.PAYMENTS_ENABLED !== 'false');

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`[WARNING] Required environment variable "${envVar}" is not set in environment.`);
  }
}

export const config = {
  env: runtimeEnvironment(),
  get paymentsEnabled() { return paymentsAreEnabled(); },
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/shramsetu',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_fallback_secret_shramsetu_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  email: {
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER || '',
    smtpPassword: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || '',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  pincodeApiUrl: process.env.PINCODE_API_URL || 'https://api.postalpincode.in/pincode',
  nominatimApiUrl: process.env.NOMINATIM_API_URL || 'https://nominatim.openstreetmap.org/reverse',
};

