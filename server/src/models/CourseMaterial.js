const mongoose = require('mongoose');

/**
 * A file (PDF) attached to a course by a mentor and shown to students.
 * The raw bytes are stored in `data` (select:false so they are never returned
 * in list responses — only streamed by the dedicated file endpoint).
 */
const courseMaterialSchema = new mongoose.Schema(
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
    filename: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      default: 'application/pdf',
    },
    size: {
      type: Number,
      default: 0,
    },
    data: {
      type: Buffer,
      select: false, // heavy binary payload — fetched only when streaming the file
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CourseMaterial', courseMaterialSchema);
