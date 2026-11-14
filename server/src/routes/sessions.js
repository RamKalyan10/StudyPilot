/**
 * @file sessions.js
 * @description Study Session Execution & Lifecycle Route Handlers.
 * Manages state transitions for individual study blocks (planned -> in-progress -> completed / missed)
 * and updates corresponding task remaining effort and status.
 */

import { Router } from 'express';
import Schedule from '../models/Schedule.js';
import Task from '../models/Task.js';
import auth from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();
router.use(auth);

/**
 * Helper to locate a specific session subdocument inside a student's schedule.
 *
 * @param {import('express').Request} req - Express request
 * @returns {Promise<{ schedule?: Object, session?: Object }>}
 */
async function findSession(req) {
  const schedule = await Schedule.findOne({
    user: req.user._id,
    'sessions._id': req.params.id
  });

  if (!schedule) return {};
  const session = schedule.sessions.id(req.params.id);
  return { schedule, session };
}

/**
 * @route   POST /api/sessions/:id/start
 * @desc    Mark a planned study session as in-progress (student begins timer/studying)
 * @access  Private
 */
router.post(
  '/:id/start',
  asyncHandler(async (req, res) => {
    const { schedule, session } = await findSession(req);

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }
    if (session.status !== 'planned') {
      return res.status(400).json({ message: 'Only planned sessions can be started.' });
    }

    session.status = 'in-progress';
    await schedule.save();

    res.json({ schedule, session });
  })
);

/**
 * @route   POST /api/sessions/:id/complete
 * @desc    Mark a study session as completed, log actual minutes studied, record post-study confidence,
 *          and decrement remaining time on the associated task.
 * @access  Private
 */
router.post(
  '/:id/complete',
  asyncHandler(async (req, res) => {
    const { schedule, session } = await findSession(req);

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }
    if (!['planned', 'in-progress'].includes(session.status)) {
      return res.status(400).json({ message: 'Session is already closed or finalized.' });
    }

    const actual = Math.max(
      0,
      Math.min(1440, Number(req.body.actualMinutes ?? session.plannedMinutes))
    );

    session.status = 'completed';
    session.actualMinutes = actual;
    session.completedAt = new Date();

    if (req.body.confidenceAfter) {
      session.confidenceAfter = req.body.confidenceAfter;
    }

    await schedule.save();

    // Decrement the task's remaining effort
    const task = await Task.findOne({ _id: session.task, user: req.user._id });
    if (task) {
      task.remainingMinutes = Math.max(0, (task.remainingMinutes || task.estimatedMinutes) - actual);
      if (task.remainingMinutes === 0) {
        task.status = 'completed';
      } else {
        task.status = 'in-progress';
      }
      await task.save();
    }

    res.json({ schedule, session, task });
  })
);

/**
 * @route   POST /api/sessions/:id/miss
 * @desc    Mark a session as missed (e.g. skipped or interrupted).
 *          Prompts student to trigger adaptive rescheduling so the missed time can be recovered.
 * @access  Private
 */
router.post(
  '/:id/miss',
  asyncHandler(async (req, res) => {
    const { schedule, session } = await findSession(req);

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }
    if (!['planned', 'in-progress'].includes(session.status)) {
      return res.status(400).json({ message: 'Session is already closed or finalized.' });
    }

    session.status = 'missed';
    await schedule.save();

    res.json({
      message: 'Session marked missed. Generate a new schedule to recover remaining work.',
      schedule,
      session
    });
  })
);

export default router;
