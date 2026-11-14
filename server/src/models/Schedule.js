/**
 * @file Schedule.js
 * @description Mongoose model schema for Generated Study Schedules and Study Sessions.
 * Tracks versioned study plans, individual session execution states, unscheduled task feasibility,
 * and time summaries.
 */

import mongoose from 'mongoose';

/**
 * Session Subdocument Schema
 * Represents an individual study block allocated to a specific task within an availability window.
 */
const sessionSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    subjectName: {
      type: String,
      default: ''
    },
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    },
    plannedMinutes: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['planned', 'in-progress', 'completed', 'missed'],
      default: 'planned'
    },
    actualMinutes: {
      type: Number,
      default: 0
    },
    confidenceAfter: {
      type: Number,
      min: 1,
      max: 5
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

/**
 * Schedule Schema definition
 * Represents a complete versioned snapshot of a generated timetable.
 */
const scheduleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    version: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      default: 'initial'
    },
    sessions: [sessionSchema],
    unscheduled: [
      {
        task: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Task'
        },
        title: {
          type: String
        },
        remainingMinutes: {
          type: Number
        },
        reason: {
          type: String
        }
      }
    ],
    summary: {
      totalRequestedMinutes: {
        type: Number
      },
      scheduledMinutes: {
        type: Number
      },
      unscheduledMinutes: {
        type: Number
      },
      conflicts: {
        type: Number
      },
      feasible: {
        type: Boolean
      }
    }
  },
  {
    timestamps: true
  }
);

// Compound index to quickly fetch latest schedules by student in descending order of version
scheduleSchema.index({ user: 1, version: -1 });

export default mongoose.model('Schedule', scheduleSchema);
