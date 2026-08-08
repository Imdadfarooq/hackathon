const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const aggregationService = require('../services/aggregationService');
const { toCSV } = require('../utils/csv');

/**
 * Ensure the target student is mentored by the requesting mentor.
 */
async function assertMentorsStudent(mentorId, studentId) {
  const student = await User.findOne({ _id: studentId, role: 'student' });
  if (!student) throw ApiError.notFound('Student not found');
  if (String(student.mentor) !== String(mentorId)) {
    throw ApiError.forbidden('This student is not assigned to you');
  }
  return student;
}

/**
 * GET /api/mentor/students
 * Roster of the mentor's students with high-level progress for each.
 */
async function listStudents(req, res) {
  const students = await User.find({ mentor: req.user._id, role: 'student' })
    .sort({ name: 1 })
    .lean();

  // Fetch each student's summary in parallel.
  const rows = await Promise.all(
    students.map(async (s) => {
      const summary = await aggregationService.getStudentSummary(s._id);
      return {
        id: s._id,
        name: s.name,
        email: s.email,
        avatarColor: s.avatarColor,
        lastLoginAt: s.lastLoginAt,
        ...summary,
      };
    })
  );

  // Cohort-level roll-up for the mentor overview cards.
  const cohort = rows.reduce(
    (acc, r) => {
      acc.totalTimeMinutes += r.totalTimeMinutes;
      acc.completedLessons += r.completedLessons;
      acc.activeCourses += r.activeCourses;
      return acc;
    },
    { totalTimeMinutes: 0, completedLessons: 0, activeCourses: 0 }
  );
  const avgProgress =
    rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + r.overallProgress, 0) / rows.length)
      : 0;

  res.json({
    students: rows,
    cohort: {
      studentCount: rows.length,
      totalTimeHours: Math.round((cohort.totalTimeMinutes / 60) * 10) / 10,
      completedLessons: cohort.completedLessons,
      activeCourses: cohort.activeCourses,
      avgProgress,
    },
  });
}

/**
 * GET /api/mentor/students/:studentId
 * Deep view of one student: summary + per-course progress + trend + distribution.
 */
async function getStudentDetail(req, res) {
  const student = await assertMentorsStudent(req.user._id, req.params.studentId);
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 365);

  const [summary, courses, series, distribution] = await Promise.all([
    aggregationService.getStudentSummary(student._id),
    aggregationService.getCourseProgress(student._id),
    aggregationService.getTimeSeries(student._id, days),
    aggregationService.getTimeDistribution(student._id),
  ]);

  res.json({
    student: {
      id: student._id,
      name: student.name,
      email: student.email,
      avatarColor: student.avatarColor,
      lastLoginAt: student.lastLoginAt,
    },
    summary,
    courses,
    timeSeries: series,
    distribution,
  });
}

/**
 * GET /api/mentor/students/:studentId/export
 * CSV of one student's course progress (mentor-facing export).
 */
async function exportStudentCSV(req, res) {
  const student = await assertMentorsStudent(req.user._id, req.params.studentId);
  const rows = await aggregationService.getCourseProgress(student._id);
  const csv = toCSV(rows, [
    { key: 'title', label: 'Course' },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Status' },
    { key: 'completedLessons', label: 'Completed Lessons' },
    { key: 'totalLessons', label: 'Total Lessons' },
    { key: 'progress', label: 'Progress (%)' },
    { key: 'timeMinutes', label: 'Time Spent (min)' },
  ]);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${student.name.replace(/\s+/g, '-').toLowerCase()}-progress.csv"`
  );
  res.send(csv);
}

module.exports = { listStudents, getStudentDetail, exportStudentCSV };
