const request = require('supertest');
const { createApp } = require('../src/app');

const app = createApp();

/**
 * Register a user and return { agent, token, user }.
 */
async function registerUser(overrides = {}) {
  const payload = {
    name: 'Test User',
    email: `user${Math.random().toString(36).slice(2)}@test.io`,
    password: 'Password123',
    role: 'student',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return { res, token: res.body.token, user: res.body.user, payload };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = { app, request, registerUser, authHeader };
