const { app, request, registerUser, authHeader } = require('./helpers');
const Course = require('../src/models/Course');
const { makePdf } = require('../src/utils/pdf');

async function makeCourse() {
  return Course.create({
    title: 'PDF Course',
    slug: `pdf-course-${Math.random().toString(36).slice(2)}`,
    category: 'Programming',
    difficulty: 'beginner',
    totalLessons: 3,
    estimatedMinutes: 60,
  });
}

const samplePdf = () => makePdf('Sample', ['Hello from the test PDF.']);

describe('Course materials (PDF upload & view)', () => {
  test('mentor uploads a PDF; anyone authed can list and view it', async () => {
    const mentor = await registerUser({ role: 'mentor', email: 'm-mat@test.io' });
    const student = await registerUser({ email: 's-mat@test.io' });
    const course = await makeCourse();

    // Upload (mentor)
    const up = await request(app)
      .post(`/api/courses/${course._id}/materials`)
      .set(authHeader(mentor.token))
      .field('title', 'Course Guide')
      .attach('file', samplePdf(), { filename: 'guide.pdf', contentType: 'application/pdf' });
    expect(up.status).toBe(201);
    expect(up.body.material.title).toBe('Course Guide');
    const materialId = up.body.material.id;

    // List (student) — metadata only, no bytes
    const list = await request(app)
      .get(`/api/courses/${course._id}/materials`)
      .set(authHeader(student.token));
    expect(list.status).toBe(200);
    expect(list.body.materials).toHaveLength(1);
    expect(list.body.materials[0].data).toBeUndefined();
    expect(list.body.materials[0].mimetype).toBe('application/pdf');

    // View file (student) — streams the PDF bytes
    const file = await request(app)
      .get(`/api/courses/${course._id}/materials/${materialId}/file`)
      .set(authHeader(student.token));
    expect(file.status).toBe(200);
    expect(file.headers['content-type']).toContain('application/pdf');
    expect(file.headers['content-disposition']).toContain('inline');
    expect(file.body.slice(0, 5).toString()).toBe('%PDF-');
  });

  test('students cannot upload materials (403)', async () => {
    const student = await registerUser({ email: 's-forbid@test.io' });
    const course = await makeCourse();
    const res = await request(app)
      .post(`/api/courses/${course._id}/materials`)
      .set(authHeader(student.token))
      .attach('file', samplePdf(), { filename: 'x.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(403);
  });

  test('non-PDF uploads are rejected (400)', async () => {
    const mentor = await registerUser({ role: 'mentor', email: 'm-bad@test.io' });
    const course = await makeCourse();
    const res = await request(app)
      .post(`/api/courses/${course._id}/materials`)
      .set(authHeader(mentor.token))
      .attach('file', Buffer.from('not a pdf'), { filename: 'x.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });

  test('mentor can delete a material', async () => {
    const mentor = await registerUser({ role: 'mentor', email: 'm-del@test.io' });
    const course = await makeCourse();
    const up = await request(app)
      .post(`/api/courses/${course._id}/materials`)
      .set(authHeader(mentor.token))
      .attach('file', samplePdf(), { filename: 'g.pdf', contentType: 'application/pdf' });
    const id = up.body.material.id;

    const del = await request(app)
      .delete(`/api/courses/${course._id}/materials/${id}`)
      .set(authHeader(mentor.token));
    expect(del.status).toBe(200);

    const list = await request(app)
      .get(`/api/courses/${course._id}/materials`)
      .set(authHeader(mentor.token));
    expect(list.body.materials).toHaveLength(0);
  });
});
