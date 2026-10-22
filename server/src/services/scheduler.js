export function priorityScore(task, now = new Date()) {
  const msLeft = new Date(task.deadline).getTime() - now.getTime();
  const hoursLeft = msLeft / 3600000;
  // Urgency rises as the deadline approaches; overdue tasks receive maximum urgency.
  const urgency = hoursLeft <= 0 ? 1 : Math.max(0, Math.min(1, 1 - hoursLeft / (24 * 14)));
  const importance = Number(task.importance || 3) / 5;
  const difficulty = Number(task.difficulty || 3) / 5;
  const confidence = Number(task.confidence || 3) / 5;
  return Number((0.35 * urgency + 0.30 * importance + 0.20 * difficulty + 0.15 * (1 - confidence)).toFixed(4));
}

function splitWindow(start, end, maxSessionMinutes) {
  const slots = []; let cursor = new Date(start); const finish = new Date(end);
  while (finish - cursor >= 15 * 60000) {
    const minutes = Math.min(maxSessionMinutes, Math.floor((finish - cursor) / 60000));
    slots.push({ start: new Date(cursor), end: new Date(cursor.getTime() + minutes * 60000), minutes });
    cursor = new Date(cursor.getTime() + (minutes + 10) * 60000); // 10-minute buffer between sessions
  }
  return slots;
}

export function generateSchedule({ tasks, availability, dailyLimitMinutes = 180, preferredSessionMinutes = 50, now = new Date() }) {
  const windows = availability.map(a => ({ start: new Date(a.start), end: new Date(a.end) })).filter(w => w.end > now && w.end > w.start).sort((a,b) => a.start-b.start);
  const dayMinutes = new Map();
  const used = [];
  const sessions = [];
  const unscheduled = [];
  const ordered = tasks.filter(t => t.status !== 'completed' && Number(t.remainingMinutes ?? t.estimatedMinutes) > 0)
    .map(t => ({ task: t, score: priorityScore(t, now), remaining: Number(t.remainingMinutes ?? t.estimatedMinutes) }))
    .sort((a,b) => (new Date(a.task.deadline)-new Date(b.task.deadline)) || (b.score-a.score));
  let totalRequestedMinutes = ordered.reduce((sum, x) => sum + x.remaining, 0);
  for (const item of ordered) {
    let remaining = item.remaining;
    const deadline = new Date(item.task.deadline);
    for (const window of windows) {
      if (remaining <= 0) break;
      if (window.start >= deadline) continue;
      const usableEnd = new Date(Math.min(window.end.getTime(), deadline.getTime()));
      if (usableEnd <= window.start) continue;
      const dateKey = window.start.toISOString().slice(0,10);
      const dailyUsed = dayMinutes.get(dateKey) || 0;
      let freeStart = new Date(window.start);
      for (const booked of used.filter(b => b.start < usableEnd && b.end > freeStart).sort((a,b)=>a.start-b.start)) {
        if (booked.start > freeStart) {
          const capacity = Math.max(0, Math.floor((booked.start-freeStart)/60000));
          const allowed = Math.min(capacity, dailyLimitMinutes-dailyUsed, remaining, preferredSessionMinutes);
          if (allowed >= 15) {
            const end = new Date(freeStart.getTime()+allowed*60000);
            sessions.push(makeSession(item.task, freeStart, end, allowed)); used.push({start:freeStart,end});
            remaining -= allowed; dayMinutes.set(dateKey, (dayMinutes.get(dateKey)||0)+allowed);
          }
        }
        if (booked.end > freeStart) freeStart = new Date(booked.end);
      }
      if (remaining > 0 && freeStart < usableEnd) {
        const capacity = Math.max(0, Math.floor((usableEnd-freeStart)/60000));
        const dayLeft = dailyLimitMinutes-(dayMinutes.get(dateKey)||0);
        const allowed = Math.min(capacity, dayLeft, remaining, preferredSessionMinutes);
        if (allowed >= 15) {
          const end = new Date(freeStart.getTime()+allowed*60000);
          sessions.push(makeSession(item.task, freeStart, end, allowed)); used.push({start:freeStart,end});
          remaining -= allowed; dayMinutes.set(dateKey, (dayMinutes.get(dateKey)||0)+allowed);
        }
      }
    }
    if (remaining > 0) unscheduled.push({ task: item.task._id, title: item.task.title, remainingMinutes: remaining, reason: deadline <= now ? 'Deadline has passed' : 'Not enough available time before the deadline or daily limit' });
  }
  sessions.sort((a,b)=>a.start-b.start);
  const scheduledMinutes = sessions.reduce((s,x)=>s+x.plannedMinutes,0);
  const unscheduledMinutes = unscheduled.reduce((s,x)=>s+x.remainingMinutes,0);
  return { sessions, unscheduled, summary: { totalRequestedMinutes, scheduledMinutes, unscheduledMinutes, conflicts: countConflicts(sessions), feasible: unscheduledMinutes === 0 } };
}
function makeSession(task,start,end,minutes) { return { task: task._id, title: task.title, subjectName: task.subject?.name || '', start, end, plannedMinutes: minutes, status: 'planned', actualMinutes: 0 }; }
function countConflicts(sessions) { let n=0; const s=[...sessions].sort((a,b)=>a.start-b.start); for(let i=1;i<s.length;i++) if(new Date(s[i].start)<new Date(s[i-1].end)) n++; return n; }
