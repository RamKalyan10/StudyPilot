/**
 * @file auth.js
 * @description Authentication, Email Verification & Unified Google OAuth Routes.
 * Implements:
 * - Student registration with mandatory anti-fake email verification (6-digit OTP & email links).
 * - Standard credential login with email verification gating.
 * - Google OAuth 2.0 verification and intelligent account synchronization
 *   (merging manual & Google logins for the same email into one unified profile).
 * - Password setting for Google accounts so students can log in using both methods.
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendVerificationEmail } from '../services/emailService.js';
import { verifyGoogleToken } from '../services/googleAuth.js';
import { verifyFirebaseIdToken } from '../services/firebaseAuth.js';

const router = Router();

/**
 * Helper to generate a 3-day signed JWT.
 *
 * @param {Object} user - User document
 * @returns {string} Signed JWT
 */
const signToken = (user) =>
  jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '3d' });

/**
 * Standardizes user payload returned to client.
 */
function formatUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    authProvider: user.authProvider || 'local',
    isEmailVerified: Boolean(user.isEmailVerified),
    hasPassword: Boolean(user.passwordHash),
    preferences: user.preferences || { dailyLimitMinutes: 180, preferredSessionMinutes: 50 }
  };
}

/**
 * Helper to generate a secure 6-digit numeric verification OTP and URL token.
 */
function generateVerificationCodes() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return { code, token, expires };
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new student account. Dispatches an email verification code/link.
 *          Does NOT grant login access until email ownership is confirmed.
 * @access  Public
 */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
      return res.status(400).json({
        message: 'Name, email, and a password of at least 8 characters are required.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email format.' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    // Scenario 1: User already exists and has verified email
    if (existingUser && existingUser.isEmailVerified) {
      if (existingUser.passwordHash) {
        return res.status(409).json({
          message: 'An account with this email already exists. Please sign in.'
        });
      }
      // If user registered with Google previously without a password
      const passwordHash = await bcrypt.hash(password, 12);
      existingUser.passwordHash = passwordHash;
      existingUser.authProvider = 'both';
      await existingUser.save();

      return res.json({
        message: 'Password linked successfully! You can now log in with either Google or your password.',
        token: signToken(existingUser),
        user: formatUser(existingUser)
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { code, token, expires } = generateVerificationCodes();

    let user;

    // Scenario 2: Unverified user already exists, update and resend code
    if (existingUser && !existingUser.isEmailVerified) {
      existingUser.name = name.trim();
      existingUser.passwordHash = passwordHash;
      existingUser.emailVerificationCode = code;
      existingUser.emailVerificationToken = token;
      existingUser.emailVerificationExpires = expires;
      await existingUser.save();
      user = existingUser;
    } else {
      // Scenario 3: Create brand new pending user with isEmailVerified: false
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        authProvider: 'local',
        isEmailVerified: false,
        emailVerificationCode: code,
        emailVerificationToken: token,
        emailVerificationExpires: expires
      });
    }

    // Send verification email
    const emailResult = await sendVerificationEmail({
      email: normalizedEmail,
      name: user.name,
      code,
      token
    });

    res.status(201).json({
      message: 'Verification email sent! Please check your inbox and enter the 6-digit code to activate your account.',
      email: normalizedEmail,
      requiresVerification: true,
      simulated: emailResult?.simulated || false,
      devCode: emailResult?.simulated ? code : undefined
    });
  })
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address using either the 6-digit OTP code or link token
 * @access  Public
 */
router.post(
  '/verify-email',
  asyncHandler(async (req, res) => {
    const { email, code, token } = req.body;

    if (!email?.trim() || (!code?.trim() && !token?.trim())) {
      return res.status(400).json({
        message: 'Email address and verification code/token are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const query = { email: normalizedEmail };

    if (code) {
      query.emailVerificationCode = code.trim();
    } else {
      query.emailVerificationToken = token.trim();
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(400).json({
        message: 'Invalid verification code or link. Please check your code or request a new one.'
      });
    }

    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      return res.status(400).json({
        message: 'Verification code has expired. Please request a new verification code.'
      });
    }

    // Successfully verified!
    user.isEmailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.json({
      message: 'Email verified successfully! Welcome to StudyPilot.',
      token: signToken(user),
      user: formatUser(user)
    });
  })
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend a fresh email verification code/token to the student's inbox
 * @access  Public
 */
router.post(
  '/resend-verification',
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        message: 'This account email is already verified. You can sign in directly.'
      });
    }

    const { code, token, expires } = generateVerificationCodes();
    user.emailVerificationCode = code;
    user.emailVerificationToken = token;
    user.emailVerificationExpires = expires;
    await user.save();

    const emailResult = await sendVerificationEmail({
      email: normalizedEmail,
      name: user.name,
      code,
      token
    });

    res.json({
      message: 'A fresh verification code has been dispatched to your email.',
      email: normalizedEmail,
      simulated: emailResult?.simulated || false,
      devCode: emailResult?.simulated ? code : undefined
    });
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate credentials & return session JWT.
 *          Blocks access if the email has not been verified yet.
 * @access  Public
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || '').toLowerCase().trim();
    const password = String(req.body.password || '');

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }

    // If account was created with Google Sign-In and student hasn't set a password yet
    if (!user.passwordHash && user.googleId) {
      return res.status(400).json({
        message: 'This account was created with Google Sign-In. Please sign in with Google or set a password to use manual login.'
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }

    // Guard: Prevent access to unverified accounts
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'Your email address is not verified yet. Please enter the verification code sent to your email to access StudyPilot.',
        emailUnverified: true,
        email: user.email
      });
    }

    res.json({
      token: signToken(user),
      user: formatUser(user)
    });
  })
);

/**
 * @route   POST /api/auth/google
 * @desc    Google OAuth 2.0 Sign-In & Unified Account Synchronization.
 *          If user already exists (registered manually with same email), links accounts
 *          so they seamlessly access their same study schedule, subjects, and tasks.
 * @access  Public
 */
router.post(
  '/google',
  asyncHandler(async (req, res) => {
    const { credential, idToken } = req.body;
    const tokenToVerify = credential || idToken;

    if (!tokenToVerify) {
      return res.status(400).json({ message: 'Google credential token is required.' });
    }

    // Verify token cryptographically and enforce email_verified === true
    const googleProfile = await verifyGoogleToken(tokenToVerify);

    const { email, sub: googleId, name, picture } = googleProfile;

    // Search for existing user with this verified email
    let user = await User.findOne({ email });

    if (user) {
      // PROPER SYNCHRONIZATION:
      // Link Google ID, verify email, and update provider so both login types work!
      user.googleId = googleId;
      user.isEmailVerified = true; // Google guarantees email validity!
      user.emailVerificationCode = null;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;

      if (user.passwordHash) {
        user.authProvider = 'both';
      } else {
        user.authProvider = 'google';
      }

      if (!user.avatar && picture) {
        user.avatar = picture;
      }
      if (!user.name && name) {
        user.name = name;
      }

      await user.save();

      return res.json({
        token: signToken(user),
        user: formatUser(user),
        message: 'Successfully signed in with Google! Your account is synchronized.'
      });
    }

    // User does not exist: Create new account via Google
    user = await User.create({
      name: name || 'Student',
      email,
      googleId,
      avatar: picture || '',
      isEmailVerified: true, // Already verified by Google
      authProvider: 'google',
      passwordHash: null
    });

    res.status(201).json({
      token: signToken(user),
      user: formatUser(user),
      message: 'Welcome to StudyPilot! Account created with Google.'
    });
  })
);

/**
 * @route   POST /api/auth/firebase-login
 * @desc    Authenticate via Firebase (Google Sign-In or verified Email/Password)
 *          Performs intelligent account synchronization merging manual & Google profiles.
 * @access  Public
 */
router.post(
  '/firebase-login',
  asyncHandler(async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Firebase ID token is required.' });
    }

    const profile = await verifyFirebaseIdToken(idToken);

    // Guard: Enforce verified email
    if (!profile.emailVerified) {
      return res.status(403).json({
        message: 'Your email address is not verified yet. Please check your inbox for the verification email.',
        emailUnverified: true,
        email: profile.email
      });
    }

    let user = await User.findOne({ email: profile.email });

    if (user) {
      // PROPER SYNCHRONIZATION:
      // Merge with existing account!
      user.googleId = profile.uid;
      user.isEmailVerified = true;
      user.emailVerificationCode = null;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;

      if (profile.signInProvider === 'google.com' || user.googleId) {
        user.authProvider = user.passwordHash ? 'both' : 'google';
      }

      if (!user.avatar && profile.picture) {
        user.avatar = profile.picture;
      }
      if (!user.name && profile.name) {
        user.name = profile.name;
      }

      await user.save();

      return res.json({
        token: signToken(user),
        user: formatUser(user),
        message: 'Successfully authenticated via Firebase! Account synchronized.'
      });
    }

    // New user
    user = await User.create({
      name: profile.name || 'Student',
      email: profile.email,
      googleId: profile.uid,
      avatar: profile.picture || '',
      isEmailVerified: true,
      authProvider: profile.signInProvider === 'google.com' ? 'google' : 'local',
      passwordHash: null
    });

    res.status(201).json({
      token: signToken(user),
      user: formatUser(user),
      message: 'Welcome to StudyPilot!'
    });
  })
);

/**
 * @route   POST /api/auth/set-password
 * @desc    Allows an authenticated student (e.g. registered via Google) to set a password
 *          enabling them to log in both ways (Google + Manual).
 * @access  Private (JWT)
 */
router.post(
  '/set-password',
  auth,
  asyncHandler(async (req, res) => {
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.authProvider = user.googleId ? 'both' : 'local';
    await user.save();

    res.json({
      message: 'Password set successfully! You can now log in using either Google or your email and password.',
      user: formatUser(user)
    });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Fetch currently authenticated student profile with verification and provider info
 * @access  Private (JWT)
 */
router.get(
  '/me',
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user: formatUser(user) });
  })
);

export default router;
