const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const ActivityEvent = require('../models/ActivityEvent');

const { Types } = mongoose;

const DAY_MS = 24 * 60 * 60 * 1000;

function toObjectId(id) {
  return typeof id === 'string' ? new Types.ObjectId(id) : id;
}

/**
 * Generate adaptive recommendations for a student.
 *
 * The engine combines several signals:
 *  1. "Continue" — the next uncompleted lesson in an active course (highest priority).
 *  2. "Revisit"  — courses with no recent activity that are not yet complete (re-engagement).
 *  3. "Explore"  — new courses in the categories the student engages with most, weighted
 *                  by demonstrated quiz performance to nudge difficulty up or down.
 *
 * @param {string} studentId
 * @param {number} limit max recommendations to return
 */
async function getRecommendations(studentId, limit = 6) {
  const sid = toObjectId(studentId);

  const [enrollments, recentQuiz, categoryTime] = await Promise.all([
    Enrollment.find({ student: sid })
      .populate('course', 'title slug totalLessons color category difficulty')
      .lean(),
    // Average quiz score to drive adaptive difficulty.
    ActivityEvent.aggregate([
      { $match: { student: sid, type: 'quiz_attempt', score: { $ne: null } } },
      { $group: { _id: null, avgScore: { $avg: '$score' }, count: { $sum: 1 } } },
    ]),
    // Time spent per category — reveals interest affinity.
    ActivityEvent.aggregate([
      { $match: { student: sid, course: { $ne: null } } },
      {
        $lookup: {
          from: Course.collection.name,
          localField: 'course',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
      { $group: { _id: '$course.category', minutes: { $sum: '$durationMinutes' } } },
      { $sort: { minutes: -1 } },
    ]),
  ]);

  const avgScore = recentQuiz[0]?.avgScore ?? null;
  const enrolledCourseIds = new Set(
    enrollments.filter((e) => e.course).map((e) => String(e.course._id))
  );
  const recommendations = [];

  // ---- 1. Continue: next uncompleted lesson in active courses ----
  const activeEnrollments = enrollments
    .filter((e) => e.course && e.status === 'active')
    .sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));

  for (const e of activeEnrollments) {
    const completedIds = new Set(e.completedLessons.map((c) => String(c.lesson)));
    // Find the earliest-order lesson not yet completed.
    // eslint-disable-next-line no-await-in-loop
    const nextLesson = await Lesson.findOne({
      course: e.course._id,
      _id: { $nin: Array.from(completedIds).map((id) => new Types.ObjectId(id)) },
    })
      .sort({ order: 1 })
      .lean();

    if (nextLesson) {
      const progress =
        e.course.totalLessons > 0
          ? Math.round((e.completedLessons.length / e.course.totalLessons) * 100)
          : 0;
      recommendations.push({
        type: 'continue',
        priority: 100 + progress, // closer to finishing => slightly higher
        reason: `You are ${progress}% through "${e.course.title}". Pick up where you left off.`,
        course: {
          id: e.course._id,
          title: e.course.title,
          slug: e.course.slug,
          color: e.course.color,
          category: e.course.category,
        },
        lesson: {
          id: nextLesson._id,
          title: nextLesson.title,
          order: nextLesson.order,
          estimatedMinutes: nextLesson.estimatedMinutes,
        },
      });
    }
  }

  // ---- 2. Revisit: stalled active courses (no activity in 7+ days) ----
  const now = Date.now();
  for (const e of activeEnrollments) {
    const idleDays = Math.floor((now - new Date(e.lastActivityAt).getTime()) / DAY_MS);
    if (idleDays >= 7) {
      recommendations.push({
        type: 'revisit',
        priority: 60 + Math.min(idleDays, 30),
        reason: `It's been ${idleDays} days since you worked on "${e.course.title}". A quick review will keep your momentum.`,
        course: {
          id: e.course._id,
          title: e.course.title,
          slug: e.course.slug,
          color: e.course.color,
          category: e.course.category,
        },
        lesson: null,
      });
    }
  }

  // ---- 3. Explore: new courses in favored categories, difficulty-adapted ----
  // Adaptive difficulty target derived from quiz performance.
  let targetDifficulty = null;
  if (avgScore !== null) {
    if (avgScore >= 80) targetDifficulty = 'advanced';
    else if (avgScore >= 55) targetDifficulty = 'intermediate';
    else targetDifficulty = 'beginner';
  }

  const favoredCategories = categoryTime.map((c) => c._id).filter(Boolean).slice(0, 3);
  if (favoredCategories.length > 0) {
    const candidateQuery = {
      category: { $in: favoredCategories },
      _id: { $nin: Array.from(enrolledCourseIds).map((id) => new Types.ObjectId(id)) },
    };
    const candidates = await Course.find(candidateQuery).lean();

    for (const c of candidates) {
      // Score explore candidates by category affinity + difficulty match.
      const categoryRank = favoredCategories.indexOf(c.category); // 0 = strongest
      const affinity = 30 - categoryRank * 8;
      const difficultyBonus = targetDifficulty && c.difficulty === targetDifficulty ? 12 : 0;
      const reasonBits = [`Popular in ${c.category}, a topic you spend the most time on`];
      if (difficultyBonus) {
        reasonBits.push(`matched to your ${targetDifficulty} level based on quiz results`);
      }
      recommendations.push({
        type: 'explore',
        priority: affinity + difficultyBonus,
        reason: `${reasonBits.join(' — ')}.`,
        course: {
          id: c._id,
          title: c.title,
          slug: c.slug,
          color: c.color,
          category: c.category,
          difficulty: c.difficulty,
        },
        lesson: null,
      });
    }
  }

  // Rank and de-duplicate by (type, course) so a course doesn't dominate.
  const seen = new Set();
  const ranked = recommendations
    .sort((a, b) => b.priority - a.priority)
    .filter((r) => {
      const key = `${r.type}:${r.course.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);

  return {
    generatedAt: new Date().toISOString(),
    adaptiveSignal: {
      avgQuizScore: avgScore !== null ? Math.round(avgScore) : null,
      targetDifficulty,
      favoredCategories,
    },
    recommendations: ranked,
  };
}

module.exports = { getRecommendations };
