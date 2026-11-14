/**
 * @file analytics.js
 * @description Student Progress & Study Analytics Route Handlers.
 * Computes aggregated metrics on task completion, study time investment,
 * subject-wise progress, and schedule feasibility.
 */

import { Router } from 'express';
import Task from '../models/Task.js';
import Schedule from '../models/Schedule.js';
import auth from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();
router.use(auth);

/**
 * @route   GET /api/analytics/progress
 * @desc    Aggregate student performance statistics, task progress, and time investment
 * @access  Private
 */
router.get(
  '/progress',
  asyncHandler(async (req, res) => {
    // Concurrently fetch tasks and historical schedules
    const [tasks, schedules] = await Promise.all([
      Task.find({ user: req.user._id }).populate('subject', 'name'),
      Schedule.find({ user: req.user._id }).sort({ version: -1 }).limit(20)
    ]);

    const latestSchedule = schedules[0];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Accumulate total actual minutes studied across all completed sessions in recorded schedules
    const actualStudyMinutes = schedules
      .flatMap((s) => s.sessions)
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + (s.actualMinutes || 0), 0);

    const latestPlannedMinutes = latestSchedule?.summary?.scheduledMinutes || 0;

    // Group study progress and remaining burden by subject
    const bySubject = {};
    for (const task of tasks) {
      const subjectName = task.subject?.name || 'General';
      if (!bySubject[subjectName]) {
        bySubject[subjectName] = {
          total: 0,
          completed: 0,
          remainingMinutes: 0
        };
      }
      bySubject[subjectName].total++;
      if (task.status === 'completed') {
        bySubject[subjectName].completed++;
      }
      bySubject[subjectName].remainingMinutes += task.remainingMinutes || 0;
    }

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      actualStudyMinutes,
      latestPlannedMinutes,
      latestSchedule: latestSchedule?.summary || null,
      bySubject: Object.entries(bySubject).map(([subject, metrics]) => ({
        subject,
        ...metrics
      })),
      scheduleVersions: schedules.length
    });
  })
);

export default router;
