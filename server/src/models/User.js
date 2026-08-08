const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['student', 'mentor'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'student',
      index: true,
    },
    // For students: the mentor assigned to them (optional).
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    avatarColor: {
      type: String,
      default: '#6366f1',
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash a plaintext password and store it. Keeps hashing logic in one place.
userSchema.methods.setPassword = async function setPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plain, salt);
};

userSchema.methods.comparePassword = async function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Shape returned to clients — never leak the hash.
userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    mentor: this.mentor,
    avatarColor: this.avatarColor,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
  };
};

userSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('User', userSchema);
