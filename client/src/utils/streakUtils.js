/**
 * @file streakUtils.js
 * @description Streak calculation and date utility helpers for StudyPilot.
 */

/**
 * Returns local YYYY-MM-DD string without timezone drift.
 * @param {string|Date} d
 * @returns {string}
 */
export const getLocalDateKey = (d) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Computes the student's study streak from real tasks and sessions.
 * A streak day is achieved when a student completes all tasks due/scheduled for that day.
 *
 * @param {Array<Object>} [tasks=[]]
 * @param {Object} [schedule=null]
 * @returns {Object}
 */
export function computeStreakData(tasks = [], schedule = null) {
  const dayMap = {};
  const todayKey = getLocalDateKey(new Date());

  // 1. Group tasks by deadline or completion date
  for (const t of tasks) {
    if (!t.deadline) continue;
    const dateKey = getLocalDateKey(t.deadline);
    if (!dateKey) continue;

    if (!dayMap[dateKey]) {
      dayMap[dateKey] = { total: 0, completed: 0, tasks: [] };
    }
    dayMap[dateKey].total++;
    dayMap[dateKey].tasks.push(t);
    if (t.status === 'completed') {
      dayMap[dateKey].completed++;
    }
  }

  // 2. Incorporate completed schedule sessions
  if (schedule?.sessions) {
    for (const s of schedule.sessions) {
      if (!s.start) continue;
      const dateKey = getLocalDateKey(s.start);
      if (!dateKey) continue;
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = { total: 0, completed: 0, tasks: [] };
      }
      if (s.status === 'completed') {
        dayMap[dateKey].completedSessions = (dayMap[dateKey].completedSessions || 0) + 1;
      }
    }
  }

  // 3. Mark days achieved: all tasks due that day must be completed
  for (const dateKey of Object.keys(dayMap)) {
    const entry = dayMap[dateKey];
    const allTasksCompleted = entry.total > 0 && entry.completed === entry.total;
    const hasCompletedWork = entry.completed > 0 || (entry.completedSessions && entry.completedSessions > 0);
    entry.achieved = allTasksCompleted || (hasCompletedWork && (entry.total === 0 || entry.completed === entry.total));
  }

  // 4. Incorporate persisted history if present
  try {
    const raw = localStorage.getItem('studypilot_streak_history');
    if (raw) {
      const persisted = JSON.parse(raw);
      for (const [dateKey, val] of Object.entries(persisted)) {
        if (val && val.achieved) {
          if (!dayMap[dateKey]) {
            dayMap[dateKey] = { total: val.total || 1, completed: val.completed || 1, tasks: [], achieved: true };
          } else {
            dayMap[dateKey].achieved = true;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not read streak history:', err);
  }

  // 5. If today all tasks are completed, automatically record in history
  if (dayMap[todayKey]?.achieved) {
    try {
      const raw = localStorage.getItem('studypilot_streak_history');
      const history = raw ? JSON.parse(raw) : {};
      history[todayKey] = {
        achieved: true,
        completed: dayMap[todayKey].completed,
        total: dayMap[todayKey].total
      };
      localStorage.setItem('studypilot_streak_history', JSON.stringify(history));
    } catch (err) {
      // Ignore storage errors
    }
  }

  // 6. Compute current consecutive streak backwards
  const now = new Date();
  let currentStreak = 0;
  let checkDate = new Date(now);

  const todayAchieved = dayMap[todayKey]?.achieved || false;
  if (todayAchieved) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const k = getLocalDateKey(checkDate);
    if (dayMap[k]?.achieved) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // 7. Compute longest streak
  const sortedAchievedDates = Object.keys(dayMap)
    .filter((k) => dayMap[k].achieved)
    .sort();

  let longestStreak = currentStreak;
  let tempStreak = 0;
  let prevDate = null;

  for (const dStr of sortedAchievedDates) {
    const d = new Date(dStr);
    if (prevDate) {
      const diffDays = Math.round((d - prevDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;
    prevDate = d;
  }

  return {
    dayMap,
    currentStreak,
    longestStreak,
    totalStreakDays: sortedAchievedDates.length,
    todayAchieved,
    todayKey
  };
}
