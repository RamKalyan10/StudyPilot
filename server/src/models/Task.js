/**
 * @file Task.js
 * @description Mongoose model schema for Academic Tasks and Study Goals.
 * Includes multi-factor parameters (importance, difficulty, confidence, deadline)
 * utilized by the scheduler's heuristic priority calculation engine.
 */

import mongoose from 'mongoose';

/**
 * Task Schema definition
 * Represents an individual study item, assignment, exam prep, or topic.
 */
const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    },
    type: {
      type: String,
      enum: ['topic', 'assignment', 'exam', 'project', 'revision'],
      default: 'topic'
    },
    deadline: {
      type: Date,
      required: true
    },
    estimatedMinutes: {
      type: Number,
      required: true,
      min: 15,
      max: 10000
    },
    remainingMinutes: {
      type: Number,
      min: 0
    },
    importance: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    confidence: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    notes: {
      type: String,
      maxlength: 1000,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

/**
 * Pre-save lifecycle middleware:
 * Initializes remainingMinutes to estimatedMinutes upon task creation if not explicitly specified.
 */
taskSchema.pre('save', function (next) {
  if (this.remainingMinutes == null) {
    this.remainingMinutes = this.estimatedMinutes;
  }
  next();
});

export default mongoose.model('Task', taskSchema);
