/**
 * @file schedules.js
 * @description Timetable & Schedule Generation Route Handlers.
 * Invokes the greedy interval scheduling engine to produce versioned study schedules
 * and supports adaptive recovery re-scheduling after missed sessions.
 */

import { Router } from 'express';
import Schedule from '../models/Schedule.js';
import Task from '../models/Task.js';
import Availability from '../models/Availability.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateSchedule } from '../services/scheduler.js';

const router = Router();
router.use(auth);

/**
 * Core builder helper to compile student workload and generate a new versioned schedule.
 *
 * @param {import('express').Request} req - Express request
 * @param {string} reason - Justification for schedule generation (e.g. 'initial', 'adaptive recovery')
 * @returns {Promise<Object>} Newly created Schedule document
 */
async function buildSchedule(req, reason) {
  const [tasks, availability, user, lastSchedule] = await Promise.all([
    Task.find({ user: req.user._id, status: { $ne: 'completed' } }).populate('subject', 'name'),
    Availability.find({ user: req.user._id, end: { $gt: new Date() } }).sort('start'),
    User.findById(req.user._id),
    Schedule.findOne({ user: req.user._id }).sort({ version: -1 })
  ]);

  const dailyLimitMinutes = user?.preferences?.dailyLimitMinutes || 180;
  const preferredSessionMinutes = user?.preferences?.preferredSessionMinutes || 50;

  // Run the greedy scheduling algorithm
  const result = generateSchedule({
    tasks,
    availability,
    dailyLimitMinutes,
    preferredSessionMinutes
  });

  // Increment schedule version number
  const nextVersion = (lastSchedule?.version || 0) + 1;

  const schedule = await Schedule.create({
    user: req.user._id,
    version: nextVersion,
    reason,
    ...result
  });

  return schedule;
}

/**
 * @route   POST /api/schedules/generate
 * @desc    Generate a fresh study timetable from scratch using active tasks and availability
 * @access  Private
 */
router.post(
  '/generate',
  asyncHandler(async (req, res) => {
    const schedule = await buildSchedule(req, 'initial');
    res.status(201).json(schedule);
  })
);

/**
 * @route   POST /api/schedules/reschedule
 * @desc    Adaptively regenerate study timetable to accommodate missed sessions or workload changes
 * @access  Private
 */
router.post(
  '/reschedule',
  asyncHandler(async (req, res) => {
    const reason = req.body.reason || 'adaptive recovery';
    const schedule = await buildSchedule(req, reason);
    res.status(201).json(schedule);
  })
);

/**
 * @route   GET /api/schedules/latest
 * @desc    Fetch the student's most recently generated active study schedule
 * @access  Private
 */
router.get(
  '/latest',
  asyncHandler(async (req, res) => {
    const latest = await Schedule.findOne({ user: req.user._id }).sort({ version: -1 });
    res.json(latest || null);
  })
);

/**
 * @route   GET /api/schedules
 * @desc    Fetch version history of generated schedules (up to the last 20)
 * @access  Private
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const history = await Schedule.find({ user: req.user._id })
      .sort({ version: -1 })
      .limit(20);
    res.json(history);
  })
);

export default router;
