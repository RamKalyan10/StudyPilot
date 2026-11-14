/**
 * @file auth.js
 * @description JSON Web Token (JWT) authentication middleware.
 * Verifies Authorization header bearer tokens and attaches the authenticated user record to the request.
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Express middleware to authenticate API requests via JWT.
 * Expects header: Authorization: Bearer <token>
 * Populates req.user with { _id, name, email } upon successful verification.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
export default async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required. Missing Bearer token.' });
    }

    // Verify token validity and signature
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure the referenced user account still exists in database
    const user = await User.findById(payload.sub).select('_id name email');
    if (!user) {
      return res.status(401).json({ message: 'Account no longer exists.' });
    }

    // Attach user identity to request context
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
}
