const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

/**
 * Sign a JWT for an authenticated user.
 * @param {{ id: string, role: string }} payload
 */
function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { signToken, verifyToken };
