const { app, request, registerUser, authHeader } = require('./helpers');

describe('Role-based access control', () => {
  test('student cannot access mentor routes', async () => {
    const { token } = await registerUser({ role: 'student' });
    const res = await request(app).get('/api/mentor/students').set(authHeader(token));
    expect(res.status).toBe(403);
  });

  test('mentor cannot access student dashboard routes', async () => {
    const { token } = await registerUser({ role: 'mentor', email: 'mentor@test.io' });
    const res = await request(app).get('/api/dashboard/summary').set(authHeader(token));
    expect(res.status).toBe(403);
  });

  test('mentor can list (empty) student roster', async () => {
    const { token } = await registerUser({ role: 'mentor', email: 'mentor2@test.io' });
    const res = await request(app).get('/api/mentor/students').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.students).toEqual([]);
    expect(res.body.cohort.studentCount).toBe(0);
  });
});
