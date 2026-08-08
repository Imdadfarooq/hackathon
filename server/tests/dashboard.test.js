const { app, request, registerUser, authHeader } = require('./helpers');
const Course = require('../src/models/Course');
const Lesson = require('../src/models/Lesson');

/**
 * Create a small course with `count` lessons for use in flow tests.
 */
async function makeCourse(count = 4) {
  const course = await Course.create({
    title: 'Test Course',
    slug: `test-course-${Math.random().toString(36).slice(2)}`,
    category: 'Programming',
    difficulty: 'beginner',
    totalLessons: count,
    estimatedMinutes: count * 20,
  });
  const lessons = await Lesson.insertMany(
    Array.from({ length: count }, (_, i) => ({
      course: course._id,
      title: `Lesson ${i + 1}`,
      order: i + 1,
      estimatedMinutes: 20,
    }))
  );
  return { course, lessons };
}

describe('Dashboard analytics flow', () => {
  test('records activity and reflects it in summary, progress, series & distribution', async () => {
    const { token } = await registerUser({ email: 'flow@test.io' });
    const { course, lessons } = await makeCourse(4);

    // Enroll then complete two lessons with time.
    await request(app).post(`/api/courses/${course._id}/enroll`).set(authHeader(token));

    for (let i = 0; i < 2; i += 1) {
      const r = await request(app)
        .post('/api/activities')
        .set(authHeader(token))
        .send({
          type: 'lesson_completed',
          courseId: String(course._id),
          lessonId: String(lessons[i]._id),
          durationMinutes: 30,
        });
      expect(r.status).toBe(201);
    }

    // Summary
    const summary = await request(app).get('/api/dashboard/summary').set(authHeader(token));
    expect(summary.status).toBe(200);
    expect(summary.body.completedLessons).toBe(2);
    expect(summary.body.totalTimeMinutes).toBe(60);
    expect(summary.body.overallProgress).toBe(50); // 2 of 4 lessons

    // Course progress
    const progress = await request(app)
      .get('/api/dashboard/course-progress')
      .set(authHeader(token));
    expect(progress.body.courses).toHaveLength(1);
    expect(progress.body.courses[0].progress).toBe(50);
    expect(progress.body.courses[0].timeMinutes).toBe(60);

    // Time series (dense, gap-filled)
    const series = await request(app)
      .get('/api/dashboard/time-series?days=7')
      .set(authHeader(token));
    expect(series.body.series).toHaveLength(7);
    const totalSeriesMinutes = series.body.series.reduce((s, d) => s + d.minutes, 0);
    expect(totalSeriesMinutes).toBe(60);

    // Distribution by time
    const dist = await request(app)
      .get('/api/dashboard/distribution?by=time')
      .set(authHeader(token));
    expect(dist.body.data[0].minutes).toBe(60);

    // Distribution by status
    const statusDist = await request(app)
      .get('/api/dashboard/distribution?by=status')
      .set(authHeader(token));
    const active = statusDist.body.data.find((d) => d.status === 'active');
    expect(active.count).toBe(1);
  });

  test('auto-completes the course when all lessons are done', async () => {
    const { token } = await registerUser({ email: 'complete@test.io' });
    const { course, lessons } = await makeCourse(2);

    for (const lesson of lessons) {
      await request(app)
        .post('/api/activities')
        .set(authHeader(token))
        .send({
          type: 'lesson_completed',
          courseId: String(course._id),
          lessonId: String(lesson._id),
          durationMinutes: 10,
        });
    }

    const progress = await request(app)
      .get('/api/dashboard/course-progress')
      .set(authHeader(token));
    expect(progress.body.courses[0].status).toBe('completed');
    expect(progress.body.courses[0].progress).toBe(100);
  });

  test('CSV export returns a downloadable attachment', async () => {
    const { token } = await registerUser({ email: 'csv@test.io' });
    const { course, lessons } = await makeCourse(2);
    await request(app)
      .post('/api/activities')
      .set(authHeader(token))
      .send({
        type: 'lesson_completed',
        courseId: String(course._id),
        lessonId: String(lessons[0]._id),
        durationMinutes: 15,
      });

    const res = await request(app)
      .get('/api/dashboard/export?type=progress')
      .set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.text).toContain('Course,Category');
  });
});

describe('Recommendations', () => {
  test('recommends continuing an in-progress course', async () => {
    const { token } = await registerUser({ email: 'rec@test.io' });
    const { course, lessons } = await makeCourse(5);

    // Complete only the first lesson so 4 remain.
    await request(app)
      .post('/api/activities')
      .set(authHeader(token))
      .send({
        type: 'lesson_completed',
        courseId: String(course._id),
        lessonId: String(lessons[0]._id),
        durationMinutes: 20,
      });

    const res = await request(app).get('/api/recommendations').set(authHeader(token));
    expect(res.status).toBe(200);
    const cont = res.body.recommendations.find((r) => r.type === 'continue');
    expect(cont).toBeDefined();
    expect(cont.lesson.order).toBe(2); // next uncompleted lesson
  });
});
