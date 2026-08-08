const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const ActivityEvent = require('../models/ActivityEvent');
const Course = require('../models/Course');

const { Types } = mongoose;

/**
 * Utility: convert a value to an ObjectId (accepts string or ObjectId).
 */
function toObjectId(id) {
  return typeof id === 'string' ? new Types.ObjectId(id) : id;
}

/**
 * Build a UTC date `days` days ago at start of day. Used to bound time-series.
 */
function startOfDayUTCDaysAgo(days, now = new Date()) {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

/**
 * High-level KPI summary for a single student.
 * Returns totals used by the dashboard header cards.
 */
async function getStudentSummary(studentId) {
  const sid = toObjectId(studentId);

  const [enrollments, timeAgg, lessonsCompletedAgg, activeDaysAgg] = await Promise.all([
    Enrollment.find({ student: sid }).populate('course', 'title totalLessons color category'),
    ActivityEvent.aggregate([
      { $match: { student: sid } },
      { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } },
    ]),
    ActivityEvent.aggregate([
      { $match: { student: sid, type: 'lesson_completed' } },
      { $count: 'count' },
    ]),
    // Count distinct calendar days with any activity (a simple "streak-ish" metric).
    ActivityEvent.aggregate([
      { $match: { student: sid } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$occurredAt', timezone: 'UTC' },
          },
        },
      },
      { $count: 'count' },
    ]),
  ]);

  const totalTimeMinutes = timeAgg[0]?.totalMinutes || 0;
  const completedLessons = lessonsCompletedAgg[0]?.count || 0;
  const activeDays = activeDaysAgg[0]?.count || 0;

  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter((e) => e.status === 'completed').length;
  const activeCourses = enrollments.filter((e) => e.status === 'active').length;

  // Overall progress = completed lessons across courses / total lessons across enrolled courses.
  const totalLessonsAcrossCourses = enrollments.reduce(
    (sum, e) => sum + (e.course?.totalLessons || 0),
    0
  );
  const overallProgress =
    totalLessonsAcrossCourses > 0
      ? Math.round((completedLessons / totalLessonsAcrossCourses) * 100)
      : 0;

  return {
    totalTimeMinutes,
    totalTimeHours: Math.round((totalTimeMinutes / 60) * 10) / 10,
    completedLessons,
    totalCourses,
    activeCourses,
    completedCourses,
    activeDays,
    overallProgress,
  };
}

/**
 * Per-course progress breakdown for a student.
 * Each row: course info + completed/total lessons + percentage + time + status.
 */
async function getCourseProgress(studentId) {
  const sid = toObjectId(studentId);

  const enrollments = await Enrollment.find({ student: sid })
    .populate('course', 'title slug totalLessons color category difficulty estimatedMinutes')
    .sort({ lastActivityAt: -1 })
    .lean();

  // Time-per-course aggregation in a single query.
  const timePerCourse = await ActivityEvent.aggregate([
    { $match: { student: sid, course: { $ne: null } } },
    { $group: { _id: '$course', minutes: { $sum: '$durationMinutes' } } },
  ]);
  const timeMap = new Map(timePerCourse.map((t) => [String(t._id), t.minutes]));

  return enrollments
    .filter((e) => e.course) // guard against dangling refs
    .map((e) => {
      const total = e.course.totalLessons || 0;
      const completed = e.completedLessons.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        enrollmentId: e._id,
        courseId: e.course._id,
        title: e.course.title,
        slug: e.course.slug,
        category: e.course.category,
        difficulty: e.course.difficulty,
        color: e.course.color,
        status: e.status,
        completedLessons: completed,
        totalLessons: total,
        progress,
        timeMinutes: timeMap.get(String(e.course._id)) || 0,
        enrolledAt: e.enrolledAt,
        lastActivityAt: e.lastActivityAt,
      };
    });
}

/**
 * Time-series of minutes spent per day over the last `days` days.
 * Fills gaps with zero so the chart has a continuous x-axis.
 */
async function getTimeSeries(studentId, days = 30) {
  const sid = toObjectId(studentId);
  const since = startOfDayUTCDaysAgo(days - 1);

  const rows = await ActivityEvent.aggregate([
    { $match: { student: sid, occurredAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$occurredAt', timezone: 'UTC' } },
        minutes: { $sum: '$durationMinutes' },
        lessonsCompleted: {
          $sum: { $cond: [{ $eq: ['$type', 'lesson_completed'] }, 1, 0] },
        },
        events: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byDay = new Map(rows.map((r) => [r._id, r]));

  // Produce a dense series so the frontend does not need to fill gaps.
  const series = [];
  for (let i = 0; i < days; i += 1) {
    const d = startOfDayUTCDaysAgo(days - 1 - i);
    const key = d.toISOString().slice(0, 10);
    const row = byDay.get(key);
    series.push({
      date: key,
      minutes: row?.minutes || 0,
      lessonsCompleted: row?.lessonsCompleted || 0,
      events: row?.events || 0,
    });
  }
  return series;
}

/**
 * Distribution of time spent per course (for the pie/donut chart).
 */
async function getTimeDistribution(studentId) {
  const sid = toObjectId(studentId);

  const rows = await ActivityEvent.aggregate([
    { $match: { student: sid, course: { $ne: null } } },
    { $group: { _id: '$course', minutes: { $sum: '$durationMinutes' } } },
    {
      $lookup: {
        from: Course.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'course',
      },
    },
    { $unwind: '$course' },
    {
      $project: {
        _id: 0,
        courseId: '$_id',
        title: '$course.title',
        color: '$course.color',
        category: '$course.category',
        minutes: 1,
      },
    },
    { $sort: { minutes: -1 } },
  ]);

  return rows;
}

/**
 * Completion-status distribution across enrolled courses (alt. donut view).
 */
async function getCompletionDistribution(studentId) {
  const sid = toObjectId(studentId);
  const rows = await Enrollment.aggregate([
    { $match: { student: sid } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const base = { active: 0, completed: 0, paused: 0 };
  rows.forEach((r) => {
    base[r._id] = r.count;
  });
  return Object.entries(base).map(([status, count]) => ({ status, count }));
}

module.exports = {
  getStudentSummary,
  getCourseProgress,
  getTimeSeries,
  getTimeDistribution,
  getCompletionDistribution,
  toObjectId,
};
