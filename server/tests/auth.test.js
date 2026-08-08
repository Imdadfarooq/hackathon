const { app, request, registerUser, authHeader } = require('./helpers');

describe('Auth API', () => {
  test('registers a new student and returns a token', async () => {
    const { res } = await registerUser({ email: 'newstudent@test.io' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({ email: 'newstudent@test.io', role: 'student' });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('rejects duplicate email', async () => {
    await registerUser({ email: 'dupe@test.io' });
    const { res } = await registerUser({ email: 'dupe@test.io' });
    expect(res.status).toBe(409);
  });

  test('rejects weak/invalid registration input', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'x', email: 'not-an-email', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  test('logs in with correct credentials and rejects wrong password', async () => {
    await registerUser({ email: 'login@test.io', password: 'Password123' });

    const ok = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.io', password: 'Password123' });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeDefined();

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.io', password: 'wrongpass' });
    expect(bad.status).toBe(401);
  });

  test('GET /me requires auth and returns the current user', async () => {
    const anon = await request(app).get('/api/auth/me');
    expect(anon.status).toBe(401);

    const { token } = await registerUser({ email: 'me@test.io' });
    const res = await request(app).get('/api/auth/me').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@test.io');
  });
});
