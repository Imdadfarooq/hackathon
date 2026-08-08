const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/token');
const { env } = require('../config/env');

// Options for the httpOnly auth cookie (used in addition to the JSON token).
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.nodeEnv === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * POST /api/auth/register
 * Registers a student or mentor and returns a JWT.
 */
async function register(req, res) {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('An account with that email already exists');
  }

  const user = new User({
    name,
    email,
    role: role === 'mentor' ? 'mentor' : 'student',
  });
  await user.setPassword(password);
  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ id: user._id.toString(), role: user.role });
  res.cookie('token', token, cookieOptions);
  res.status(201).json({ token, user: user.toSafeJSON() });
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  const { email, password } = req.body;

  // Need the hash for comparison, so re-select it explicitly.
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ id: user._id.toString(), role: user.role });
  res.cookie('token', token, cookieOptions);
  res.json({ token, user: user.toSafeJSON() });
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
}

/**
 * GET /api/auth/me — current authenticated user.
 */
async function me(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}

module.exports = { register, login, logout, me };
