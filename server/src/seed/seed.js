/* eslint-disable no-console, no-await-in-loop */
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const ActivityEvent = require('../models/ActivityEvent');
const CourseMaterial = require('../models/CourseMaterial');
const { makePdf } = require('../utils/pdf');
const { COURSES, MENTOR, STUDENTS, DEMO_PASSWORD } = require('./data');

// --- Deterministic PRNG (mulberry32) so seeded data & screenshots are reproducible ---
function mulberry32(seed) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260808);

const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
const randFloat = (min, max) => rng() * (max - min) + min;
const pick = (arr) => arr[Math.floor(rng() * arr.length)];

const DAY_MS = 24 * 60 * 60 * 1000;
function daysAgo(n, hour = 12) {
  const d = new Date();
  d.setHours(hour, randInt(0, 59), 0, 0);
  return new Date(d.getTime() - n * DAY_MS);
}

// Engagement profiles drive how much of the catalog each student consumes.
const PROFILES = {
  high: { courseCount: 4, completionRange: [0.5, 1.0], quizBase: 78, stalledChance: 0.25 },
  medium: { courseCount: 3, completionRange: [0.3, 0.7], quizBase: 66, stalledChance: 0.4 },
  low: { courseCount: 2, completionRange: [0.1, 0.35], quizBase: 52, stalledChance: 0.6 },
};

async function clearAll() {
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Lesson.deleteMany({}),
    Enrollment.deleteMany({}),
    ActivityEvent.deleteMany({}),
    CourseMaterial.deleteMany({}),
  ]);
}

/**
 * Attach a generated PDF "course guide" to every course, authored by the mentor.
 * In production a mentor uploads real PDFs; here we synthesize valid ones so the
 * feature is demonstrable straight after seeding.
 */
async function createMaterials(courseDocs, mentor) {
  let count = 0;
  for (const { course, lessons } of courseDocs) {
    const paragraphs = [
      course.description,
      `Format: ${course.difficulty} level · ${course.totalLessons} lessons · about `
        + `${Math.round(course.estimatedMinutes / 60)} hours of material.`,
      'What you will learn: ' + lessons.map((l) => l.title).join('; ') + '.',
      'This companion PDF was uploaded by your mentor and is available to every '
        + 'enrolled student inside ProgressBoard.',
    ];
    const buffer = makePdf(`${course.title} — Course Guide`, paragraphs);

    // eslint-disable-next-line no-await-in-loop
    await CourseMaterial.create({
      course: course._id,
      title: `${course.title} — Course Guide`,
      filename: `${course.slug}-guide.pdf`,
      mimetype: 'application/pdf',
      size: buffer.length,
      data: buffer,
      uploadedBy: mentor._id,
    });
    count += 1;
  }
  return count;
}

async function createCourses() {
  const courseDocs = [];
  for (const c of COURSES) {
    const lessonsMeta = c.lessons.map((title, idx) => ({
      title,
      order: idx + 1,
      estimatedMinutes: randInt(12, 35),
      difficulty: c.difficulty,
      summary: `An introduction to "${title}" within ${c.title}.`,
      content: `# ${title}\n\nThis lesson covers ${title.toLowerCase()} as part of ${c.title}. `
        + 'Work through the reading, then complete the short exercise to mark it done.',
    }));
    const estimatedMinutes = lessonsMeta.reduce((s, l) => s + l.estimatedMinutes, 0);

    const course = await Course.create({
      title: c.title,
      slug: c.slug,
      description: c.description,
      category: c.category,
      difficulty: c.difficulty,
      tags: c.tags,
      color: c.color,
      totalLessons: c.lessons.length,
      estimatedMinutes,
    });

    const lessons = await Lesson.insertMany(
      lessonsMeta.map((l) => ({ ...l, course: course._id }))
    );
    courseDocs.push({ course, lessons });
  }
  return courseDocs;
}

async function createUsers() {
  const mentor = new User({ ...MENTOR, role: 'mentor' });
  await mentor.setPassword(DEMO_PASSWORD);
  await mentor.save();

  const students = [];
  for (const s of STUDENTS) {
    const student = new User({
      name: s.name,
      email: s.email,
      role: 'student',
      avatarColor: s.avatarColor,
      mentor: mentor._id,
      lastLoginAt: daysAgo(randInt(0, 3)),
    });
    await student.setPassword(DEMO_PASSWORD);
    await student.save();
    students.push({ user: student, engagement: s.engagement });
  }
  return { mentor, students };
}

/**
 * Generate enrollments + activity events for one student across the catalog.
 */
async function seedStudentActivity(student, engagement, courseDocs) {
  const profile = PROFILES[engagement];
  // Choose a spread of courses (front of the shuffled catalog).
  const shuffled = [...courseDocs].sort(() => rng() - 0.5);
  const chosen = shuffled.slice(0, profile.courseCount);

  const events = [];

  for (let ci = 0; ci < chosen.length; ci += 1) {
    const { course, lessons } = chosen[ci];
    const completionFraction = randFloat(...profile.completionRange);
    const completedCount = Math.max(1, Math.round(lessons.length * completionFraction));
    const isStalled = rng() < profile.stalledChance;

    // Active window: stalled courses finished their activity 10-40 days ago;
    // active courses were touched within the last week.
    const windowEnd = isStalled ? randInt(10, 40) : randInt(0, 6);
    const windowStart = windowEnd + randInt(10, 30);

    const completedLessons = [];
    let totalTime = 0;
    let lastActivityAt = daysAgo(windowStart);

    for (let li = 0; li < completedCount; li += 1) {
      const lesson = lessons[li];
      // Spread completions across the window (earlier lessons earlier).
      const progressT = completedCount > 1 ? li / (completedCount - 1) : 1;
      const dayOffset = Math.round(windowStart - progressT * (windowStart - windowEnd));
      const when = daysAgo(dayOffset, randInt(8, 21));

      const startDuration = randInt(2, 6);
      const completeDuration = Math.round(lesson.estimatedMinutes * randFloat(0.7, 1.3));

      events.push({
        student: student._id,
        course: course._id,
        lesson: lesson._id,
        type: 'lesson_started',
        durationMinutes: startDuration,
        occurredAt: new Date(when.getTime() - 60 * 1000),
      });
      events.push({
        student: student._id,
        course: course._id,
        lesson: lesson._id,
        type: 'lesson_completed',
        durationMinutes: completeDuration,
        occurredAt: when,
      });

      // Every 2-3 lessons, a quiz attempt whose score reflects engagement.
      if (li > 0 && li % randInt(2, 3) === 0) {
        const score = Math.min(
          100,
          Math.max(20, Math.round(profile.quizBase + randFloat(-15, 18)))
        );
        events.push({
          student: student._id,
          course: course._id,
          lesson: lesson._id,
          type: 'quiz_attempt',
          durationMinutes: randInt(3, 10),
          score,
          occurredAt: new Date(when.getTime() + 5 * 60 * 1000),
        });
        if (score >= 60) {
          events.push({
            student: student._id,
            course: course._id,
            lesson: lesson._id,
            type: 'quiz_passed',
            durationMinutes: 0,
            score,
            occurredAt: new Date(when.getTime() + 6 * 60 * 1000),
          });
        }
      }

      totalTime += startDuration + completeDuration;
      completedLessons.push({ lesson: lesson._id, completedAt: when });
      if (when > lastActivityAt) lastActivityAt = when;
    }

    const status = completedCount >= lessons.length ? 'completed' : isStalled ? 'paused' : 'active';

    await Enrollment.create({
      student: student._id,
      course: course._id,
      status,
      enrolledAt: daysAgo(windowStart + randInt(1, 5)),
      lastActivityAt,
      completedLessons,
      totalTimeMinutes: totalTime,
    });
  }

  // Sprinkle some login events across recent days for a realistic feed.
  for (let i = 0; i < randInt(5, 12); i += 1) {
    events.push({
      student: student._id,
      course: null,
      lesson: null,
      type: 'login',
      durationMinutes: 0,
      occurredAt: daysAgo(randInt(0, 20), randInt(7, 22)),
    });
  }

  if (events.length) await ActivityEvent.insertMany(events);
  return events.length;
}

async function run() {
  const started = Date.now();
  await connectDB();
  console.log('[seed] connected');

  await clearAll();
  console.log('[seed] cleared existing collections');

  const courseDocs = await createCourses();
  console.log(`[seed] created ${courseDocs.length} courses with lessons`);

  const { mentor, students } = await createUsers();
  console.log(`[seed] created 1 mentor + ${students.length} students`);

  const materialCount = await createMaterials(courseDocs, mentor);
  console.log(`[seed] attached ${materialCount} course-material PDFs`);

  let totalEvents = 0;
  for (const { user, engagement } of students) {
    totalEvents += await seedStudentActivity(user, engagement, courseDocs);
  }
  console.log(`[seed] generated ${totalEvents} activity events`);

  console.log('\n=== Seed complete ===');
  console.log(`Time: ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log('\nDemo credentials (password for all: ' + DEMO_PASSWORD + '):');
  console.log(`  Mentor : ${mentor.email}`);
  STUDENTS.forEach((s) => console.log(`  Student: ${s.email}  (${s.engagement} engagement)`));
  console.log('\nPrimary demo student: student@demo.io');

  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
