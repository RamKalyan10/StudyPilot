/**
 * @file app.js
 * @description Main Express Server Application & Entrypoint for StudyPilot API.
 * Configures CORS, middleware, route controllers, error handling, and MongoDB Atlas connectivity.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import subjectRoutes from './routes/subjects.js';
import taskRoutes from './routes/tasks.js';
import availabilityRoutes from './routes/availability.js';
import scheduleRoutes from './routes/schedules.js';
import sessionRoutes from './routes/sessions.js';
import analyticsRoutes from './routes/analytics.js';
import syllabusRoutes from './routes/syllabus.js';

const app = express();

/**
 * Configure allowed origins for Cross-Origin Resource Sharing (CORS).
 * Supports local dev servers and wildcard or Vercel preview deployments.
 */
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps or curl)
      if (!origin) return callback(null, true);
      if (
        process.env.CLIENT_ORIGIN === '*' ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  })
);

// Payload size limit increased to 25mb to support base64 syllabus document uploads (PDF, DOCX)
app.use(express.json({ limit: '25mb' }));

/**
 * Rate Limiting:
 * Protect authentication endpoints against brute-force attacks (max 100 requests per 15 minutes).
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});
app.use('/api/auth', authRateLimiter, authRoutes);

/**
 * Health Check Endpoint
 */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'StudyPilot API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * API Domain Resource Routes
 */
app.use('/api/subjects', subjectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/syllabus', syllabusRoutes);

/**
 * 404 Not Found Middleware Catch-All
 */
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

/**
 * Centralized Global Error Handling Middleware
 */
app.use((err, _req, res, _next) => {
  console.error('[Error caught by global handler]:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error occurred.'
  });
});

/**
 * Database Initialization & Server Startup
 */
const port = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Configure server/.env before production use.');
}

try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studypilot');
  console.log('MongoDB connected successfully');

  // Bind to 0.0.0.0 to enable cloud container port resolution (e.g. Render, Railway)
  app.listen(port, '0.0.0.0', () => {
    console.log(`StudyPilot API running on http://0.0.0.0:${port}`);
  });
} catch (err) {
  console.error('Fatal: Could not connect to MongoDB:', err.message);
  process.exit(1);
}

export default app;
