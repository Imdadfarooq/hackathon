const mongoose = require('mongoose');

const completedLessonSchema = new mongoose.Schema(
  {
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const enrollmentSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active',
      index: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    completedLessons: {
      type: [completedLessonSchema],
      default: [],
    },
    // Total time spent on this course in minutes (kept in sync by activity writes).
    totalTimeMinutes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// A student can only enroll in a given course once.
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Convenience virtual: number of completed lessons.
enrollmentSchema.virtual('completedCount').get(function completedCount() {
  return this.completedLessons.length;
});

enrollmentSchema.set('toJSON', { virtuals: true });
enrollmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
