/**
 * @file availability.js
 * @description Student Study Availability Window Route Handlers.
 * Allows students to specify, view, and remove free time blocks reserved for focused study.
 */

import { Router } from 'express';
import Availability from '../models/Availability.js';
import auth from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();
router.use(auth);

/**
 * @route   GET /api/availability
 * @desc    Fetch all availability windows configured by the authenticated student
 * @access  Private
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const windows = await Availability.find({ user: req.user._id }).sort('start');
    res.json(windows);
  })
);

/**
 * @route   POST /api/availability
 * @desc    Add a new free study availability window
 * @access  Private
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { start, end, label } = req.body;
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (
      !start ||
      !end ||
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate <= startDate
    ) {
      return res.status(400).json({
        message: 'Provide a valid start and end timestamp; end must be chronologically after start.'
      });
    }

    const window = await Availability.create({
      user: req.user._id,
      start: startDate,
      end: endDate,
      label: label?.trim() || 'Study time'
    });

    res.status(201).json(window);
  })
);

/**
 * @route   DELETE /api/availability/:id
 * @desc    Delete an availability window
 * @access  Private
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await Availability.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Availability window not found.' });
    }

    res.json({ message: 'Availability window deleted successfully.' });
  })
);

export default router;
