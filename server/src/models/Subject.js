/**
 * @file Subject.js
 * @description Mongoose model schema for Academic Subjects / Courses.
 */

import mongoose from 'mongoose';

/**
 * Subject Schema definition
 * Represents an academic course/subject enrolled in by a student.
 * Color-coded for visual categorization across calendar views and progress dashboards.
 */
const subjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    color: {
      type: String,
      default: '#7667f7'
    },
    semester: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Enforce unique subject name per user
subjectSchema.index({ user: 1, name: 1 }, { unique: true });

export default mongoose.model('Subject', subjectSchema);
