/**
 * @file User.js
 * @description Mongoose model schema for Student/User accounts and personal scheduling preferences.
 * Supports dual authentication: traditional email/password and Google OAuth 2.0.
 * Includes cryptographic email verification tokens and account linking state.
 */

import mongoose from 'mongoose';

/**
 * User Schema definition
 * Represents registered students using StudyPilot with their workload preferences.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address.']
    },
    /**
     * Bcrypt hash of password.
     * Optional for users who initially register via Google Sign-In,
     * but required for manual registration.
     */
    passwordHash: {
      type: String,
      default: null
    },
    /**
     * Unique Google Subject Identifier ('sub') for Google OAuth 2.0 authentication.
     */
    googleId: {
      type: String,
      default: null,
      sparse: true
    },
    /**
     * Active authentication provider:
     * - 'local': Registered via traditional email and password
     * - 'google': Registered via Google OAuth
     * - 'both': Account linked to allow both Google and manual password login
     */
    authProvider: {
      type: String,
      enum: ['local', 'google', 'both'],
      default: 'local'
    },
    /**
     * Profile avatar URL (e.g. from Google account picture)
     */
    avatar: {
      type: String,
      default: ''
    },
    /**
     * Email verification flag.
     * Guards against fake or non-existent email addresses.
     * Automatically set to true when authenticated via Google (since Google verifies email ownership).
     */
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    /**
     * 6-digit numeric verification code (OTP) sent to the student's email inbox.
     */
    emailVerificationCode: {
      type: String,
      default: null
    },
    /**
     * Secure random token for one-click verification links.
     */
    emailVerificationToken: {
      type: String,
      default: null
    },
    /**
     * Expiration timestamp for active verification code and token.
     */
    emailVerificationExpires: {
      type: Date,
      default: null
    },
    preferences: {
      /**
       * Maximum allowable study minutes per calendar day (default: 180 min / 3 hrs).
       * Guards students against overcommitting or burnout during schedule generation.
       */
      dailyLimitMinutes: {
        type: Number,
        default: 180,
        min: 30,
        max: 720
      },
      /**
       * Default target duration for an individual focused study block (default: 50 min).
       */
      preferredSessionMinutes: {
        type: Number,
        default: 50,
        min: 15,
        max: 120
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes are defined directly on schema properties (email: unique, googleId: sparse)

export default mongoose.model('User', userSchema);
