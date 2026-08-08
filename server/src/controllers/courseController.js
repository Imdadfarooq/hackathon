const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const CourseMaterial = require('../models/CourseMaterial');
const ApiError = require('../utils/ApiError');

/**
 * GET /api/courses
 * List all courses in the catalog, annotated with the student's enrollment
 * state and the number of attached materials (PDFs).
 */
async function listCourses(req, res) {
  const courses = await Course.find().sort({ title: 1 }).lean();

  const enrollments = await Enrollment.find({ student: req.user._id }).lean();
  const enrollMap = new Map(enrollments.map((e) => [String(e.course), e]));

  // Materials count per course in a single aggregation.
  const matCounts = await CourseMaterial.aggregate([
    { $group: { _id: '$course', count: { $sum: 1 } } },
  ]);
  const matMap = new Map(matCounts.map((m) => [String(m._id), m.count]));

  const data = courses.map((c) => {
    const e = enrollMap.get(String(c._id));
    return {
      id: c._id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      category: c.category,
      difficulty: c.difficulty,
      tags: c.tags,
      color: c.color,
      totalLessons: c.totalLessons,
      estimatedMinutes: c.estimatedMinutes,
      materialsCount: matMap.get(String(c._id)) || 0,
      enrolled: Boolean(e),
      status: e?.status || null,
      completedLessons: e?.completedLessons.length || 0,
    };
  });
  res.json({ courses: data });
}

/**
 * GET /api/courses/:id
 * Course detail with its ordered lessons and the student's completion state.
 */
async function getCourse(req, res) {
  const course = await Course.findById(req.params.id).lean();
  if (!course) throw ApiError.notFound('Course not found');

  const lessons = await Lesson.find({ course: course._id }).sort({ order: 1 }).lean();
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: course._id,
  }).lean();

  const completedSet = new Set(
    (enrollment?.completedLessons || []).map((c) => String(c.lesson))
  );

  res.json({
    course: {
      id: course._id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      category: course.category,
      difficulty: course.difficulty,
      tags: course.tags,
      color: course.color,
      totalLessons: course.totalLessons,
      estimatedMinutes: course.estimatedMinutes,
    },
    enrollment: enrollment
      ? {
          id: enrollment._id,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          completedLessons: enrollment.completedLessons.length,
          totalTimeMinutes: enrollment.totalTimeMinutes,
        }
      : null,
    lessons: lessons.map((l) => ({
      id: l._id,
      title: l.title,
      order: l.order,
      summary: l.summary,
      estimatedMinutes: l.estimatedMinutes,
      difficulty: l.difficulty,
      completed: completedSet.has(String(l._id)),
    })),
  });
}

/**
 * GET /api/courses/:id/lessons/:lessonId
 * Full lesson detail (content).
 */
async function getLesson(req, res) {
  const lesson = await Lesson.findOne({
    _id: req.params.lessonId,
    course: req.params.id,
  }).lean();
  if (!lesson) throw ApiError.notFound('Lesson not found');

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.id,
  }).lean();
  const completed = (enrollment?.completedLessons || []).some(
    (c) => String(c.lesson) === String(lesson._id)
  );

  res.json({
    lesson: {
      id: lesson._id,
      course: lesson.course,
      title: lesson.title,
      order: lesson.order,
      summary: lesson.summary,
      content: lesson.content,
      estimatedMinutes: lesson.estimatedMinutes,
      difficulty: lesson.difficulty,
      completed,
    },
  });
}

/**
 * POST /api/courses/:id/enroll
 * Enroll the current student in a course (idempotent).
 */
async function enroll(req, res) {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found');

  let enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: course._id,
  });

  if (!enrollment) {
    enrollment = await Enrollment.create({
      student: req.user._id,
      course: course._id,
      status: 'active',
    });
  }

  res.status(201).json({
    enrollment: {
      id: enrollment._id,
      course: course._id,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
    },
  });
}

module.exports = { listCourses, getCourse, getLesson, enroll };
