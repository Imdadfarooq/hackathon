require('express-async-errors'); // lets async route handlers throw without try/catch
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { env } = require('./config/env');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  // Security & platform middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  }

  // Rate limit the API to blunt brute-force / abuse (disabled under test).
  if (env.nodeEnv !== 'test') {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use('/api', limiter);

    // Stricter limiter specifically for auth endpoints.
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { message: 'Too many attempts, please try again later' } },
    });
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
  }

  app.get('/', (req, res) => {
    res.json({
      name: 'Progressive Student Dashboard API',
      version: '1.0.0',
      docs: '/api/health and /api/* — see docs/API.md',
    });
  });

  app.use('/api', apiRoutes);

  // 404 + centralized error handling (must be last).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
