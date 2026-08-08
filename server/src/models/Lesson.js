const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    // 1-based position of the lesson inside its course.
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    summary: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    content: {
      type: String,
      default: '',
    },
    estimatedMinutes: {
      type: Number,
      default: 15,
      min: 1,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
  },
  { timestamps: true }
);

// A lesson's order is unique within a course.
lessonSchema.index({ course: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Lesson', lessonSchema);
