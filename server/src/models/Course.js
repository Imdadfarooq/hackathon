const mongoose = require('mongoose');

const DIFFICULTY = ['beginner', 'intermediate', 'advanced'];

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: DIFFICULTY,
      default: 'beginner',
    },
    tags: {
      type: [String],
      default: [],
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    // Denormalized counters kept in sync by the seed script / lesson writes.
    totalLessons: {
      type: Number,
      default: 0,
    },
    estimatedMinutes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

courseSchema.statics.DIFFICULTY = DIFFICULTY;

module.exports = mongoose.model('Course', courseSchema);
