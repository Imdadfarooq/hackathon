const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

// 404 handler for unmatched routes.
function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/* eslint-disable no-unused-vars */
/**
 * Central error handler. Normalizes Mongoose, JWT, and ApiError instances
 * into a consistent JSON envelope: { error: { message, details? } }.
 */
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  }

  // Multer upload errors (file too large, unexpected field, etc.)
  if (err.name === 'MulterError') {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large (max 10 MB)'
        : `Upload error: ${err.message}`;
  }

  // Duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with that ${field} already exists`;
  }

  if (statusCode >= 500) {
    // Log server errors for observability; never leak internals to the client.
    // eslint-disable-next-line no-console
    console.error('[ERROR]', err);
  }

  const body = { error: { message } };
  if (details) body.error.details = details;
  if (env.nodeEnv !== 'production' && statusCode >= 500) {
    body.error.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

module.exports = { notFoundHandler, errorHandler };
