/**
 * @file tasks.js
 * @description Task Management & Study Goal Route Handlers.
 * Handles task creation, querying with dynamic heuristic priority scores, updates, and deletion.
 */

import { Router } from 'express';
import Task from '../models/Task.js';
import Subject from '../models/Subject.js';
import auth from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { priorityScore } from '../services/scheduler.js';

const router = Router();
router.use(auth);

/**
 * @route   GET /api/tasks
 * @desc    Get all study tasks for the current student, optionally filtered by status (?status=pending).
 *          Each task is dynamically enriched with its computed priorityScore.
 * @access  Private
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = { user: req.user._id };
    if (req.query.status) {
      query.status = req.query.status;
    }

    const tasks = await Task.find(query)
      .populate('subject', 'name color')
      .sort({ deadline: 1 });

    // Calculate dynamic priority score for each task relative to current time
    const enriched = tasks.map((t) => ({
      ...t.toObject(),
      priority: priorityScore(t)
    }));

    res.json(enriched);
  })
);

/**
 * @route   POST /api/tasks
 * @desc    Create a new study task or assignment
 * @access  Private
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      title,
      subject,
      deadline,
      estimatedMinutes,
      type,
      importance,
      difficulty,
      confidence,
      notes
    } = req.body;

    if (!title?.trim() || !subject || !deadline || !Number.isFinite(Number(estimatedMinutes))) {
      return res.status(400).json({
        message: 'Title, subject, deadline, and valid estimated minutes are required.'
      });
    }

    // Verify that the specified subject exists and belongs to this user
    const subjectDoc = await Subject.findOne({ _id: subject, user: req.user._id });
    if (!subjectDoc) {
      return res.status(400).json({ message: 'Choose a valid enrolled subject.' });
    }

    const task = await Task.create({
      user: req.user._id,
      subject: subjectDoc._id,
      title: title.trim(),
      type: type || 'topic',
      deadline,
      estimatedMinutes: Number(estimatedMinutes),
      importance: importance != null ? Number(importance) : 3,
      difficulty: difficulty != null ? Number(difficulty) : 3,
      confidence: confidence != null ? Number(confidence) : 3,
      notes: notes || ''
    });

    res.status(201).json(await task.populate('subject', 'name color'));
  })
);

/**
 * @route   PATCH /api/tasks/:id
 * @desc    Update task details, deadline, study ratings, or completion status
 * @access  Private
 */
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const updatePayload = { ...req.body };
    delete updatePayload.user;
    delete updatePayload._id;

    // If subject is being updated, verify ownership
    if (updatePayload.subject) {
      const subjectDoc = await Subject.findOne({ _id: updatePayload.subject, user: req.user._id });
      if (!subjectDoc) {
        return res.status(400).json({ message: 'Choose a valid enrolled subject.' });
      }
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: updatePayload },
      { new: true, runValidators: true }
    ).populate('subject', 'name color');

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    res.json(task);
  })
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a study task
 * @access  Private
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    res.json({ message: 'Task deleted successfully.' });
  })
);

export default router;
