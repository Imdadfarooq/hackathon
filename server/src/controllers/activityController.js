const ActivityEvent = require('../models/ActivityEvent');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const ApiError = require('../utils/ApiError');

/**
 * POST /api/activities
 * Record an activity event for the current student. This is the single write
 * path that keeps enrollment progress + time counters in sync with the raw
 * event stream that powers analytics.
 *
 * Body: { type, courseId?, lessonId?, durationMinutes?, score?, occurredAt?, meta? }
 */
async function recordActivity(req, res) {
  const {
    type,
    courseId = null,
    lessonId = null,
    durationMinutes = 0,
    score = null,
    occurredAt,
    meta = {},
  } = req.body;

  // Validate references if provided.
  let lesson = null;
  if (lessonId) {
    lesson = await Lesson.findById(lessonId);
    if (!lesson) throw ApiError.badRequest('Referenced lesson does not exist');
  }
  const resolvedCourseId = courseId || (lesson ? lesson.course : null);
  if (resolvedCourseId) {
    const course = await Course.findById(resolvedCourseId);
    if (!course) throw ApiError.badRequest('Referenced course does not exist');
  }

  const event = await ActivityEvent.create({
    student: req.user._id,
    course: resolvedCourseId,
    lesson: lessonId,
    type,
    durationMinutes: Math.max(0, Number(durationMinutes) || 0),
    score,
    occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
    meta,
  });

  // Keep the enrollment aggregate in sync.
  if (resolvedCourseId) {
    let enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: resolvedCourseId,
    });
    if (!enrollment) {
      // Auto-enroll if the student interacts with a course they aren't enrolled in.
      enrollment = await Enrollment.create({
        student: req.user._id,
        course: resolvedCourseId,
        status: 'active',
      });
    }

    enrollment.totalTimeMinutes += event.durationMinutes;
    enrollment.lastActivityAt = event.occurredAt;

    // Mark the lesson complete on a lesson_completed event.
    if (type === 'lesson_completed' && lessonId) {
      const already = enrollment.completedLessons.some(
        (c) => String(c.lesson) === String(lessonId)
      );
      if (!already) {
        enrollment.completedLessons.push({ lesson: lessonId, completedAt: event.occurredAt });
      }

      // Auto-complete the course when every lesson is done.
      const course = await Course.findById(resolvedCourseId).lean();
      if (course && enrollment.completedLessons.length >= course.totalLessons) {
        enrollment.status = 'completed';
      }
    }

    await enrollment.save();
  }

  res.status(201).json({
    event: {
      id: event._id,
      type: event.type,
      course: event.course,
      lesson: event.lesson,
      durationMinutes: event.durationMinutes,
      score: event.score,
      occurredAt: event.occurredAt,
    },
  });
}

/**
 * GET /api/activities?limit=20&courseId=...
 * Recent activity feed for the current student.
 */
async function listActivities(req, res) {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const filter = { student: req.user._id };
  if (req.query.courseId) filter.course = req.query.courseId;

  const events = await ActivityEvent.find(filter)
    .sort({ occurredAt: -1 })
    .limit(limit)
    .populate('course', 'title color')
    .populate('lesson', 'title order')
    .lean();

  res.json({
    activities: events.map((e) => ({
      id: e._id,
      type: e.type,
      course: e.course ? { id: e.course._id, title: e.course.title, color: e.course.color } : null,
      lesson: e.lesson ? { id: e.lesson._id, title: e.lesson.title, order: e.lesson.order } : null,
      durationMinutes: e.durationMinutes,
      score: e.score,
      occurredAt: e.occurredAt,
    })),
  });
}

module.exports = { recordActivity, listActivities };
