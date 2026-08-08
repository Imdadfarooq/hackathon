const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/token');

/**
 * Extract a bearer token from the Authorization header or the auth cookie.
 */
function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
}

/**
 * Require a valid JWT. Populates req.user with the (hash-free) user document.
 */
async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      throw ApiError.unauthorized('Authentication required');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Restrict a route to one or more roles. Use after requireAuth.
 * @param {...string} roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have access to this resource'));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
