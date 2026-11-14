/**
 * @file scheduler.js
 * @description Core Scheduling Engine for StudyPilot.
 * Implements:
 * 1. Heuristic Priority Scoring: Combines urgency, importance, difficulty, and confidence.
 * 2. Greedy Interval Scheduling: Allocates study blocks into student availability windows,
 *    enforcing deadline constraints, daily study caps, session buffers, and breather intervals.
 * 3. Feasibility Analysis: Identifies unscheduled tasks and calculates timetable conflicts.
 */

/**
 * Calculates a normalized multi-factor priority score (0.0 to 1.0) for a study task.
 *
 * Scoring Formula:
 *   Score = (0.35 * Urgency) + (0.30 * Importance) + (0.20 * Difficulty) + (0.15 * (1 - Confidence))
 *
 * Factors:
 * - Urgency (35%): Approaches 1.0 as the deadline draws closer within a 14-day horizon; 1.0 if overdue.
 * - Importance (30%): User-assigned rating from 1 to 5 normalized to [0.2, 1.0].
 * - Difficulty (20%): Cognitive complexity rating from 1 to 5 normalized to [0.2, 1.0].
 * - Confidence Gap (15%): (1 - Confidence) prioritizing subjects where the student feels least confident.
 *
 * @param {Object} task - Task document or plain object containing deadline, importance, difficulty, confidence
 * @param {Date} [now=new Date()] - Reference timestamp for urgency calculation
 * @returns {number} Normalized priority score rounded to 4 decimal places
 */
export function priorityScore(task, now = new Date()) {
  const msLeft = new Date(task.deadline).getTime() - now.getTime();
  const hoursLeft = msLeft / 3600000;

  // Urgency rises as the deadline approaches within 14 days (336 hours); overdue tasks get max urgency (1.0).
  const urgency = hoursLeft <= 0 ? 1 : Math.max(0, Math.min(1, 1 - hoursLeft / (24 * 14)));

  const importance = Number(task.importance || 3) / 5;
  const difficulty = Number(task.difficulty || 3) / 5;
  const confidence = Number(task.confidence || 3) / 5;

  const score = (
    0.35 * urgency +
    0.30 * importance +
    0.20 * difficulty +
    0.15 * (1 - confidence)
  );

  return Number(score.toFixed(4));
}

/**
 * Helper function to partition a contiguous time block into discrete study slots with break buffers.
 *
 * @param {Date|string} start - Window start datetime
 * @param {Date|string} end - Window end datetime
 * @param {number} maxSessionMinutes - Upper bound for a single study session
 * @returns {Array<{ start: Date, end: Date, minutes: number }>} Array of discrete slot objects
 */
function splitWindow(start, end, maxSessionMinutes) {
  const slots = [];
  let cursor = new Date(start);
  const finish = new Date(end);

  while (finish - cursor >= 15 * 60000) {
    const minutes = Math.min(maxSessionMinutes, Math.floor((finish - cursor) / 60000));
    slots.push({
      start: new Date(cursor),
      end: new Date(cursor.getTime() + minutes * 60000),
      minutes
    });
    // 10-minute buffer between planned study sessions
    cursor = new Date(cursor.getTime() + (minutes + 10) * 60000);
  }

  return slots;
}

/**
 * Generates an adaptive, non-overlapping study timetable based on available windows and task workload.
 *
 * Algorithm Execution:
 * 1. Filter and sort availability windows chronologically in the future.
 * 2. Filter incomplete tasks with remaining study minutes > 0.
 * 3. Sort tasks using primary key (earliest deadline first) and secondary key (highest priority score).
 * 4. Greedily fill available windows and gaps between already booked slots.
 * 5. Enforce constraints:
 *    - Task must finish before its deadline.
 *    - Daily workload per date must not exceed `dailyLimitMinutes`.
 *    - Sessions cannot be shorter than 15 minutes.
 *    - Insert a 5-minute breather interval between adjacent study sessions.
 * 6. Report any unscheduled minutes and assess schedule feasibility.
 *
 * @param {Object} options - Scheduling parameters
 * @param {Array<Object>} options.tasks - List of task records
 * @param {Array<Object>} options.availability - Student availability windows
 * @param {number} [options.dailyLimitMinutes=180] - Max allowable study minutes per calendar day
 * @param {number} [options.preferredSessionMinutes=50] - Desired study session duration
 * @param {Date} [options.now=new Date()] - Reference point in time
 * @returns {{
 *   sessions: Array<Object>,
 *   unscheduled: Array<Object>,
 *   summary: {
 *     totalRequestedMinutes: number,
 *     scheduledMinutes: number,
 *     unscheduledMinutes: number,
 *     conflicts: number,
 *     feasible: boolean
 *   }
 * }}
 */
export function generateSchedule({
  tasks,
  availability,
  dailyLimitMinutes = 180,
  preferredSessionMinutes = 50,
  now = new Date()
}) {
  // Step 1: Clean and sort future availability windows
  const windows = availability
    .map((a) => ({ start: new Date(a.start), end: new Date(a.end) }))
    .filter((w) => w.end > now && w.end > w.start)
    .sort((a, b) => a.start - b.start);

  const dayMinutes = new Map();
  const used = [];
  const sessions = [];
  const unscheduled = [];

  // Step 2: Filter active incomplete tasks and compute priority scores
  const ordered = tasks
    .filter((t) => t.status !== 'completed' && Number(t.remainingMinutes ?? t.estimatedMinutes) > 0)
    .map((t) => ({
      task: t,
      score: priorityScore(t, now),
      remaining: Number(t.remainingMinutes ?? t.estimatedMinutes)
    }))
    // Primary sort: earliest deadline first; Secondary sort: highest priority score
    .sort((a, b) => new Date(a.task.deadline) - new Date(b.task.deadline) || b.score - a.score);

  const totalRequestedMinutes = ordered.reduce((sum, x) => sum + x.remaining, 0);

  // Helper to generate a consistent YYYY-MM-DD date key for daily workload tracking
  const getLocalDateKey = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };

  // Step 3: Iterate through prioritized tasks and allocate study sessions
  for (const item of ordered) {
    let remaining = item.remaining;
    const deadline = new Date(item.task.deadline);

    for (const window of windows) {
      if (remaining <= 0) break;
      if (window.start >= deadline) continue;

      const usableEnd = new Date(Math.min(window.end.getTime(), deadline.getTime()));
      let freeStart = new Date(Math.max(window.start.getTime(), now.getTime()));
      if (usableEnd <= freeStart) continue;

      const dateKey = getLocalDateKey(freeStart);

      // Fit into gaps between previously booked sessions in this window
      const bookedInWindow = used
        .filter((b) => b.start < usableEnd && b.end > freeStart)
        .sort((a, b) => a.start - b.start);

      for (const booked of bookedInWindow) {
        if (booked.start > freeStart) {
          const capacity = Math.max(0, Math.floor((booked.start - freeStart) / 60000));
          const currentDailyUsed = dayMinutes.get(dateKey) || 0;
          const maxAllowed = Math.min(capacity, dailyLimitMinutes - currentDailyUsed, remaining);
          const allowed =
            remaining <= preferredSessionMinutes + 15 && capacity >= remaining
              ? Math.min(remaining, dailyLimitMinutes - currentDailyUsed)
              : Math.min(maxAllowed, preferredSessionMinutes);

          if (allowed >= 15) {
            const end = new Date(freeStart.getTime() + allowed * 60000);
            sessions.push(makeSession(item.task, freeStart, end, allowed));
            used.push({ start: freeStart, end });
            remaining -= allowed;
            dayMinutes.set(dateKey, (dayMinutes.get(dateKey) || 0) + allowed);
            freeStart = new Date(end.getTime() + 5 * 60000); // 5-minute breather
          }
        }
        if (booked.end > freeStart) {
          freeStart = new Date(booked.end);
        }
      }

      // Fit into remaining capacity up to usableEnd
      while (remaining >= 15 && freeStart < usableEnd) {
        const capacity = Math.max(0, Math.floor((usableEnd - freeStart) / 60000));
        const currentDailyUsed = dayMinutes.get(dateKey) || 0;
        const dayLeft = dailyLimitMinutes - currentDailyUsed;
        const maxAllowed = Math.min(capacity, dayLeft, remaining);
        const allowed =
          remaining <= preferredSessionMinutes + 15 && capacity >= remaining
            ? Math.min(remaining, dayLeft)
            : Math.min(maxAllowed, preferredSessionMinutes);

        if (allowed < 15) break;

        const end = new Date(freeStart.getTime() + allowed * 60000);
        sessions.push(makeSession(item.task, freeStart, end, allowed));
        used.push({ start: freeStart, end });
        remaining -= allowed;
        dayMinutes.set(dateKey, (dayMinutes.get(dateKey) || 0) + allowed);

        // 5-minute breather before the next session
        freeStart = new Date(end.getTime() + 5 * 60000);
      }
    }

    // Record any unallocated study demand
    if (remaining > 0) {
      unscheduled.push({
        task: item.task._id,
        title: item.task.title,
        remainingMinutes: remaining,
        reason:
          deadline <= now
            ? 'Deadline has already passed'
            : 'Insufficient available study windows or reached daily workload limit prior to deadline'
      });
    }
  }

  // Sort final generated sessions chronologically
  sessions.sort((a, b) => a.start - b.start);
  const scheduledMinutes = sessions.reduce((s, x) => s + x.plannedMinutes, 0);
  const unscheduledMinutes = unscheduled.reduce((s, x) => s + x.remainingMinutes, 0);

  return {
    sessions,
    unscheduled,
    summary: {
      totalRequestedMinutes,
      scheduledMinutes,
      unscheduledMinutes,
      conflicts: countConflicts(sessions),
      feasible: unscheduledMinutes === 0
    }
  };
}

/**
 * Constructs a standardized session payload object.
 *
 * @param {Object} task - Associated task
 * @param {Date} start - Session start time
 * @param {Date} end - Session end time
 * @param {number} minutes - Planned duration in minutes
 * @returns {Object} Session representation
 */
function makeSession(task, start, end, minutes) {
  return {
    task: task._id,
    title: task.title,
    subjectName: task.subject?.name || '',
    start,
    end,
    plannedMinutes: minutes,
    status: 'planned',
    actualMinutes: 0
  };
}

/**
 * Validates schedule integrity by counting overlapping sessions.
 * In a healthy schedule, conflicts should be 0.
 *
 * @param {Array<Object>} sessions - List of sessions to inspect
 * @returns {number} Count of overlapping session pairs
 */
function countConflicts(sessions) {
  let conflicts = 0;
  const sorted = [...sessions].sort((a, b) => a.start - b.start);
  for (let i = 1; i < sorted.length; i++) {
    if (new Date(sorted[i].start) < new Date(sorted[i - 1].end)) {
      conflicts++;
    }
  }
  return conflicts;
}
