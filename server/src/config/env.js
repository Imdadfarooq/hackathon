const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env (skipped in test where values are injected)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student_dashboard',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

/**
 * Fail fast in production if critical secrets are left at insecure defaults.
 */
function validateEnv() {
  if (env.nodeEnv === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 20) {
      throw new Error(
        'JWT_SECRET must be set to a strong (>= 20 char) value in production.'
      );
    }
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI must be set in production.');
    }
  }
}

module.exports = { env, validateEnv };
