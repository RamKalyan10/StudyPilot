/**
 * @file StreakCalendarModal.jsx
 * @description Gamified Study Streak System & Cockpit Widget.
 * Formatted as a screen-docked companion HUD (like StudyTimer.jsx) rather than a modal popup window.
 * Supports minimization to floating badge, interactive calendar day checks, milestone trophies,
 * and direct task action links.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Flame,
  Calendar,
  Trophy,
  Award,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  ArrowRight,
  Zap,
  Check,
  Maximize2,
  Minimize2
} from 'lucide-react';

import { getLocalDateKey, computeStreakData } from '../utils/streakUtils';

export default function StreakCalendarModal({
  isOpen,
  onClose,
  tasks = [],
  schedule = null,
  hasActiveTimer = false,
  onNavigateToTasks
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'milestones'
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => getLocalDateKey(new Date()));

  // Reset minimized state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  const streakData = useMemo(
    () => computeStreakData(tasks, schedule),
    [tasks, schedule]
  );

  const { dayMap, currentStreak, longestStreak, totalStreakDays, todayAchieved, todayKey } = streakData;

  // Calendar month days calculation
  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startPadding = (firstDay.getDay() + 6) % 7; // Monday = 0
    const cells = [];

    // Preceding empty/padding days
    for (let i = 0; i < startPadding; i++) {
      const padDate = new Date(year, month, 1 - (startPadding - i));
      cells.push({
        date: padDate,
        dateKey: getLocalDateKey(padDate),
        isCurrentMonth: false
      });
    }

    // Days in current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const cellDate = new Date(year, month, day);
      cells.push({
        date: cellDate,
        dateKey: getLocalDateKey(cellDate),
        isCurrentMonth: true
      });
    }

    // Trailing padding days to fill complete 7 columns
    const totalCells = Math.ceil(cells.length / 7) * 7;
    const remaining = totalCells - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const padDate = new Date(year, month + 1, i);
      cells.push({
        date: padDate,
        dateKey: getLocalDateKey(padDate),
        isCurrentMonth: false
      });
    }

    return cells;
  }, [currentMonth]);

  const selectedDayInfo = useMemo(() => {
    return dayMap[selectedDateKey] || { total: 0, completed: 0, tasks: [], achieved: false };
  }, [dayMap, selectedDateKey]);

  // Milestone Badges definition
  const milestones = [
    { title: '3-Day Novice', days: 3, icon: '🥉', desc: 'Complete 3 consecutive days' },
    { title: '7-Day Warrior', days: 7, icon: '🥈', desc: '1 week unbroken streak' },
    { title: '14-Day Champion', days: 14, icon: '🥇', desc: '2 weeks of pure focus' },
    { title: '30-Day Legend', days: 30, icon: '👑', desc: 'A full month of mastery' }
  ];

  const earnedMilestonesCount = milestones.filter(
    (m) => currentStreak >= m.days || longestStreak >= m.days
  ).length;

  const currentRankName =
    currentStreak >= 30
      ? 'Master Scholar'
      : currentStreak >= 14
      ? 'Flame Veteran'
      : currentStreak >= 7
      ? 'Streak Warrior'
      : currentStreak >= 3
      ? 'Rising Spark'
      : 'Streak Starter';

  if (!isOpen) return null;

  // Minimized Widget Dock Mode (like StudyTimer mini dock)
  if (isMinimized) {
    return (
      <aside
        className={`streak-dock-minimized ${hasActiveTimer ? 'offset-timer' : ''}`}
        aria-label="Study Streak Dock"
      >
        <div className="mini-flame-dot" title="Streak Status">
          <Flame size={15} />
        </div>
        <div className="mini-info">
          <strong>{currentStreak} Day Streak</strong>
          <span>{todayAchieved ? 'Streak locked in 🔥' : 'Today in progress ⚡'}</span>
        </div>
        <button
          className="timer-ctrl-btn"
          onClick={() => setIsMinimized(false)}
          title="Expand Study Streak Cockpit"
        >
          <Maximize2 size={14} />
        </button>
        <button
          className="timer-ctrl-btn close"
          onClick={onClose}
          title="Dismiss Cockpit"
        >
          <X size={14} />
        </button>
      </aside>
    );
  }

  // Expanded Floating Cockpit HUD Widget (Screen Size Adjusted, No Blocking Modal Backdrop)
  return (
    <aside
      className={`streak-overlay-card ${hasActiveTimer ? 'offset-timer' : ''}`}
      aria-label="Study Streak Cockpit"
    >
      {/* Cockpit Header */}
      <div className="streak-card-header">
        <div className="streak-card-tag">
          <Flame size={14} className="streak-tag-flame" />
          <span>Study Streak Cockpit</span>
        </div>
        <div className="streak-header-actions">
          <button
            className="streak-icon-btn"
            onClick={() => setIsMinimized(true)}
            title="Minimize to widget dock"
          >
            <Minimize2 size={15} />
          </button>
          <button className="streak-icon-btn close" onClick={onClose} title="Close">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Cockpit Scrollable Body */}
      <div className="streak-card-body">
        {/* Compact Gamified Hero Banner */}
        <div className="streak-hero-banner-compact">
          <div className="streak-flame-circle-compact">
            <Flame size={24} className="streak-hero-flame" />
          </div>
          <div className="streak-hero-text">
            <div className="streak-hero-top-row">
              <span className="streak-hero-kicker">
                <Sparkles size={11} /> {todayAchieved ? 'TODAY COMPLETED' : 'TODAY IN PROGRESS'}
              </span>
              <div className="streak-level-pill-compact" title={`Rank: ${currentRankName}`}>
                <Zap size={11} />
                <span>{currentRankName}</span>
              </div>
            </div>
            <h4>
              <strong>{currentStreak}</strong> Day Streak!
            </h4>
            <p>
              {todayAchieved
                ? 'All study tasks done today. Streak locked in!'
                : 'Finish pending tasks due today to keep streak active.'}
            </p>
          </div>
        </div>

        {/* Quick HUD Metrics (3-column) */}
        <div className="streak-hud-row">
          <div className="streak-hud-chip">
            <div className="hud-mini-icon orange">
              <Flame size={14} />
            </div>
            <div className="hud-mini-details">
              <span className="hud-mini-label">Current</span>
              <strong className="hud-mini-val">{currentStreak}d</strong>
            </div>
          </div>

          <div className="streak-hud-chip">
            <div className="hud-mini-icon amber">
              <Trophy size={14} />
            </div>
            <div className="hud-mini-details">
              <span className="hud-mini-label">Best</span>
              <strong className="hud-mini-val">{longestStreak}d</strong>
            </div>
          </div>

          <div className="streak-hud-chip">
            <div className="hud-mini-icon green">
              <Award size={14} />
            </div>
            <div className="hud-mini-details">
              <span className="hud-mini-label">Active</span>
              <strong className="hud-mini-val">{totalStreakDays}d</strong>
            </div>
          </div>
        </div>

        {/* Navigation Tabs to keep screen height contained and organized */}
        <div className="streak-nav-tabs">
          <button
            type="button"
            className={`streak-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <Calendar size={13} />
            <span>Streak Calendar</span>
          </button>
          <button
            type="button"
            className={`streak-tab-btn ${activeTab === 'milestones' ? 'active' : ''}`}
            onClick={() => setActiveTab('milestones')}
          >
            <Trophy size={13} />
            <span>Trophies ({earnedMilestonesCount}/{milestones.length})</span>
          </button>
        </div>

        {/* TAB 1: CALENDAR VIEW */}
        {activeTab === 'calendar' && (
          <div className="streak-tab-pane">
            <div className="streak-calendar-compact">
              <div className="streak-calendar-head">
                <h5>
                  <Calendar size={14} />
                  <span>
                    {currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                  </span>
                </h5>
                <div className="streak-cal-nav">
                  <button
                    type="button"
                    className="streak-nav-arrow"
                    onClick={() =>
                      setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                    }
                    title="Previous month"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    className="streak-nav-arrow"
                    onClick={() =>
                      setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                    }
                    title="Next month"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="streak-calendar-grid header-row">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                  <div key={idx} className="streak-col-header">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="streak-calendar-grid">
                {calendarCells.map((cell) => {
                  const info = dayMap[cell.dateKey];
                  const isAchieved = info?.achieved;
                  const isToday = cell.dateKey === todayKey;
                  const isSelected = cell.dateKey === selectedDateKey;

                  return (
                    <button
                      key={cell.dateKey}
                      type="button"
                      className={`streak-cal-cell ${
                        !cell.isCurrentMonth ? 'other-month' : ''
                      } ${isAchieved ? 'achieved' : ''} ${isToday ? 'today' : ''} ${
                        isSelected ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedDateKey(cell.dateKey)}
                      title={`${cell.dateKey}: ${
                        isAchieved
                          ? 'Streak Achieved!'
                          : info?.total
                          ? `${info.completed}/${info.total} completed`
                          : 'No tasks scheduled'
                      }`}
                    >
                      <span className="cell-day-num">{cell.date.getDate()}</span>
                      {isAchieved ? (
                        <span className="cell-flame-badge">
                          <Flame size={11} />
                        </span>
                      ) : info?.total > 0 ? (
                        <span className="cell-pending-chip">
                          {info.completed}/{info.total}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Breakdown */}
            <div className="streak-breakdown-compact">
              <div className="breakdown-head-compact">
                <strong>
                  {new Date(selectedDateKey + 'T00:00:00').toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </strong>
                {selectedDayInfo.achieved ? (
                  <span className="breakdown-tag success">
                    <Check size={11} /> Streak Done
                  </span>
                ) : selectedDayInfo.total > 0 ? (
                  <span className="breakdown-tag pending">
                    {selectedDayInfo.completed}/{selectedDayInfo.total} Tasks
                  </span>
                ) : (
                  <span className="breakdown-tag neutral">No Tasks</span>
                )}
              </div>

              {selectedDayInfo.tasks.length > 0 ? (
                <div className="breakdown-task-list-compact">
                  {selectedDayInfo.tasks.map((t) => (
                    <div key={t._id} className="breakdown-task-row-compact">
                      {t.status === 'completed' ? (
                        <CheckCircle2 size={13} className="task-status-icon done" />
                      ) : (
                        <Circle size={13} className="task-status-icon todo" />
                      )}
                      <span className={`task-title-compact ${t.status === 'completed' ? 'done' : ''}`}>
                        {t.title}
                      </span>
                      <span className="task-sub-tag">{t.subject?.name || 'Task'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="breakdown-empty-compact">
                  {selectedDayInfo.achieved
                    ? 'All study milestones were met on this day.'
                    : 'No specific tasks assigned for this day.'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MILESTONES & TROPHIES */}
        {activeTab === 'milestones' && (
          <div className="streak-tab-pane">
            <div className="streak-milestones-grid-compact">
              {milestones.map((m) => {
                const unlocked = currentStreak >= m.days || longestStreak >= m.days;
                return (
                  <div
                    key={m.days}
                    className={`milestone-card-compact ${unlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="milestone-badge-icon-compact">{m.icon}</div>
                    <div className="milestone-info-compact">
                      <strong>{m.title}</strong>
                      <span>{m.desc}</span>
                    </div>
                    {unlocked ? (
                      <span className="milestone-tag-unlocked">
                        <Check size={11} /> Earned
                      </span>
                    ) : (
                      <span className="milestone-tag-locked">
                        {Math.max(0, m.days - currentStreak)}d left
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Cockpit Footer */}
      <div className="streak-card-footer">
        <button
          type="button"
          className="streak-btn-secondary"
          onClick={() => setIsMinimized(true)}
          title="Minimize to dock"
        >
          <Minimize2 size={13} />
          <span>Minimize</span>
        </button>

        {!todayAchieved && onNavigateToTasks ? (
          <button
            type="button"
            className="streak-btn-primary"
            onClick={() => {
              onClose();
              onNavigateToTasks();
            }}
          >
            <span>Complete Today's Tasks</span>
            <ArrowRight size={13} />
          </button>
        ) : (
          <button
            type="button"
            className="streak-btn-primary success"
            onClick={onClose}
          >
            <Check size={13} />
            <span>Streak Protected</span>
          </button>
        )}
      </div>
    </aside>
  );
}
