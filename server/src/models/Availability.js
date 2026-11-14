/**
 * @file Availability.js
 * @description Mongoose model schema for Student Study Availability Windows.
 * Defines explicit datetime slots when the student is free and available to study.
 */

import mongoose from 'mongoose';

/**
 * Availability Schema definition
 * Represents a student's designated free study block.
 * The scheduler assigns planned study sessions strictly within these windows.
 */
const availabilitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    },
    label: {
      type: String,
      default: 'Study time',
      maxlength: 100
    }
  },
  {
    timestamps: true
  }
);

/**
 * Pre-validation middleware:
 * Ensures the end timestamp is strictly chronologically after the start timestamp.
 */
availabilitySchema.pre('validate', function (next) {
  if (this.end <= this.start) {
    this.invalidate('end', 'End time must be chronologically after start time');
  }
  next();
});

export default mongoose.model('Availability', availabilitySchema);
