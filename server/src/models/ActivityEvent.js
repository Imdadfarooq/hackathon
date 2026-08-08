const mongoose = require('mongoose');

// Event types that drive the time-series & aggregate analytics.
const EVENT_TYPES = [
  'lesson_started',
  'lesson_completed',
  'quiz_attempt',
  'quiz_passed',
  'video_watched',
  'login',
];

const activityEventSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
    },
    type: {
      type: String,
      enum: EVENT_TYPES,
      required: true,
      index: true,
    },
    // Time attributed to this event, in minutes (0 for instantaneous events).
    durationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Optional score for quiz-type events (0-100).
    score: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Compound index optimizes the most common query: a student's events over time.
activityEventSchema.index({ student: 1, occurredAt: -1 });
activityEventSchema.index({ student: 1, course: 1, occurredAt: -1 });

activityEventSchema.statics.EVENT_TYPES = EVENT_TYPES;

module.exports = mongoose.model('ActivityEvent', activityEventSchema);
