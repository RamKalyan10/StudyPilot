import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  Check,
  X,
  Target,
  Filter,
  Search,
  Plus,
  RefreshCw,
  BookOpen
} from 'lucide-react';

export const getLocalDateKey = (d) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CalendarView({
  schedule,
  availability = [],
  subjects = [],
  onAction,
  onGenerate,
  onOpenTimer,
  onSetAvailability,
  onAddTask,
  busy = false
}) {
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month' | 'agenda'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDaySessions, setSelectedDaySessions] = useState(null);

  // Helper date functions
  const startOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const currentWeekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentWeekStart]);

  const currentMonthDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Padding before first day
    const startPadding = (firstDay.getDay() + 6) % 7; // Monday = 0
    const days = [];

    for (let i = startPadding; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    // Padding after last day to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  }, [selectedDate]);

  // All sessions filtered
  const filteredSessions = useMemo(() => {
    const sessions = schedule?.sessions || [];
    return sessions.filter((s) => {
      if (subjectFilter !== 'all' && s.subjectName !== subjectFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesSubject = (s.subjectName || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubject) return false;
      }
      return true;
    });
  }, [schedule, subjectFilter, statusFilter, searchQuery]);

  // Map of sessions keyed by local 'YYYY-MM-DD'
  const sessionsByDate = useMemo(() => {
    const map = new Map();
    filteredSessions.forEach((s) => {
      const key = getLocalDateKey(s.start);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    });
    // Sort sessions in each day by start time
    map.forEach((list) => list.sort((a, b) => new Date(a.start) - new Date(b.start)));
    return map;
  }, [filteredSessions]);

  // Map of availability windows keyed by local 'YYYY-MM-DD'
  const availabilityByDate = useMemo(() => {
    const map = new Map();
    (availability || []).forEach((a) => {
      const key = getLocalDateKey(a.start);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    });
    map.forEach((list) => list.sort((a, b) => new Date(a.start) - new Date(b.start)));
    return map;
  }, [availability]);

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setSelectedDate(d);
  };

  const handleNext = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setSelectedDate(d);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Header range label
  const rangeLabel = useMemo(() => {
    if (viewMode === 'week') {
      const end = new Date(currentWeekStart);
      end.setDate(end.getDate() + 6);
      return `${currentWeekStart.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (viewMode === 'month') {
      return selectedDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
    }
    return selectedDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  }, [viewMode, currentWeekStart, selectedDate]);

  const isToday = (d) => {
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Find subject color
  const getSubjectColor = (subjectName) => {
    const s = subjects.find((x) => x.name === subjectName);
    return s?.color || '#8b7cff';
  };

  return (
    <div className="cal-container">
      {/* Top calendar toolbar */}
      <div className="cal-toolbar">
        <div className="cal-nav-group">
          <div className="cal-nav-buttons">
            <button className="cal-icon-btn" onClick={handlePrev} title="Previous">
              <ChevronLeft size={17} />
            </button>
            <button className="cal-today-btn" onClick={handleToday}>
              Today
            </button>
            <button className="cal-icon-btn" onClick={handleNext} title="Next">
              <ChevronRight size={17} />
            </button>
          </div>
          <h2 className="cal-range-title">{rangeLabel}</h2>
          <div className="cal-header-quick-actions">
            <button
              className="cal-quick-action-btn"
              onClick={onSetAvailability}
              title="Add study availability window"
            >
              <Clock size={13} />
              <span>+ Window</span>
            </button>
            <button
              className="cal-quick-action-btn primary"
              onClick={onAddTask}
              title="Add a new task"
            >
              <Plus size={13} />
              <span>+ Task</span>
            </button>
          </div>
        </div>

        <div className="cal-controls-right">
          {/* Search box */}
          <div className="cal-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="cal-clear-btn" onClick={() => setSearchQuery('')}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Subject filter */}
          <div className="cal-select-wrap">
            <BookOpen size={14} className="cal-select-icon" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="cal-select"
            >
              <option value="all">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub._id} value={sub.name}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="cal-select-wrap">
            <Filter size={14} className="cal-select-icon" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="cal-select"
            >
              <option value="all">All Statuses</option>
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="cal-view-toggle">
            <button
              className={`cal-view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button
              className={`cal-view-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              className={`cal-view-btn ${viewMode === 'agenda' ? 'active' : ''}`}
              onClick={() => setViewMode('agenda')}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>


      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="cal-week-grid">
          {weekDays.map((day) => {
            const dateKey = getLocalDateKey(day);
            const sessions = sessionsByDate.get(dateKey) || [];
            const dayAvail = availabilityByDate.get(dateKey) || [];
            const dayIsToday = isToday(day);

            return (
              <div
                key={dateKey}
                className={`cal-day-col ${dayIsToday ? 'today' : ''} ${dayAvail.length > 0 ? 'has-window' : ''}`}
              >
                {/* Day Header */}
                <div className="cal-day-header">
                  <span className="cal-day-name">
                    {day.toLocaleDateString([], { weekday: 'short' })}
                  </span>
                  <div className={`cal-day-number ${dayIsToday ? 'active-today' : ''}`}>
                    {day.getDate()}
                  </div>
                  <div className="cal-day-badges-row">
                    {dayAvail.length > 0 && (
                      <span className="cal-day-window-chip" title={`${dayAvail.length} active study window(s)`}>
                        <Clock size={9} /> Window
                      </span>
                    )}
                    {sessions.length > 0 && (
                      <span className="cal-day-badge">
                        {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Configured Availability Windows for this day */}
                {dayAvail.length > 0 && (
                  <div className="cal-day-windows-strip">
                    {dayAvail.map((av) => (
                      <div
                        key={av._id}
                        className="cal-day-window-badge"
                        title={`${av.label || 'Available Study Window'}: ${fmtTime(av.start)} – ${fmtTime(av.end)}`}
                      >
                        <div className="cal-day-window-info">
                          <Clock size={10} className="window-icon" />
                          <span className="cal-day-window-time">
                            {fmtTime(av.start)} – {fmtTime(av.end)}
                          </span>
                        </div>
                        <span className="cal-day-window-label">
                          {av.label || 'Study Time'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Day Sessions Container */}
                <div className="cal-day-content">
                  {sessions.length === 0 ? (
                    dayAvail.length > 0 ? (
                      <div className="cal-day-empty has-avail">
                        <Clock size={20} className="empty-icon text-brand" />
                        <span className="empty-title">Window Open</span>
                        <span className="empty-sub">Add tasks to schedule sessions here</span>
                        <button className="cal-day-quick-btn" onClick={onAddTask}>
                          <Plus size={12} /> Add Task
                        </button>
                      </div>
                    ) : (
                      <div className="cal-day-empty">
                        <span className="empty-title">Free Day</span>
                        <span className="empty-sub">No study window set</span>
                        <button className="cal-day-quick-btn secondary" onClick={onSetAvailability}>
                          <Plus size={12} /> Add Window
                        </button>
                      </div>
                    )
                  ) : (
                    sessions.map((session) => {
                      const color = getSubjectColor(session.subjectName);
                      return (
                        <div
                          key={session._id}
                          className={`cal-session-card ${session.status}`}
                          style={{ '--subject-color': color }}
                        >
                          <div className="cal-session-top">
                            <span
                              className="cal-subject-chip"
                              style={{ borderColor: `${color}55`, color }}
                              title={session.subjectName || 'Study'}
                            >
                              <span
                                className="cal-subject-dot"
                                style={{ background: color }}
                              />
                              <span className="chip-text">{session.subjectName || 'Study'}</span>
                            </span>
                            <span className={`cal-status-pill ${session.status}`}>
                              {session.status}
                            </span>
                          </div>

                          <h4 className="cal-session-title" title={session.title}>
                            {session.title}
                          </h4>

                          <div className="cal-session-meta">
                            <span className="cal-time-range">
                              <Clock size={11} />
                              {fmtTime(session.start)} – {fmtTime(session.end)}
                            </span>
                            <span className="cal-duration-pill">
                              {session.plannedMinutes}m
                            </span>
                          </div>

                          {/* Quick Actions */}
                          <div className="cal-session-actions">
                            {session.status === 'planned' && (
                              <>
                                <button
                                  className="cal-action-btn start"
                                  onClick={() => onAction(session._id, 'start')}
                                  title="Start Session"
                                >
                                  <Play size={12} />
                                  <span>Start</span>
                                </button>
                                <button
                                  className="cal-action-btn focus"
                                  onClick={() => onOpenTimer(session)}
                                  title="Launch Focus Timer"
                                >
                                  <Target size={12} />
                                  <span>Timer</span>
                                </button>
                                <button
                                  className="cal-action-btn complete"
                                  onClick={() => onAction(session._id, 'complete')}
                                  title="Mark Completed"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  className="cal-action-btn miss"
                                  onClick={() => onAction(session._id, 'miss')}
                                  title="Mark Missed & Auto-Reschedule"
                                >
                                  <X size={12} />
                                </button>
                              </>
                            )}

                            {session.status === 'in-progress' && (
                              <>
                                <button
                                  className="cal-action-btn focus active"
                                  onClick={() => onOpenTimer(session)}
                                  title="Resume Focus Timer"
                                >
                                  <Target size={12} />
                                  <span>Focus Now</span>
                                </button>
                                <button
                                  className="cal-action-btn complete"
                                  onClick={() => onAction(session._id, 'complete')}
                                  title="Finish Session"
                                >
                                  <Check size={12} />
                                  <span>Finish</span>
                                </button>
                              </>
                            )}

                            {session.status === 'completed' && (
                              <div className="cal-completed-tag">
                                <Check size={12} /> Logged {session.actualMinutes || session.plannedMinutes}m
                              </div>
                            )}

                            {session.status === 'missed' && (
                              <span className="cal-missed-tag">Rescheduled</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="cal-month-wrap">
          <div className="cal-month-header-days">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName) => (
              <div key={dayName} className="cal-month-col-title">
                {dayName}
              </div>
            ))}
          </div>

          <div className="cal-month-grid">
            {currentMonthDays.map(({ date, isCurrentMonth }, idx) => {
              const dateKey = getLocalDateKey(date);
              const sessions = sessionsByDate.get(dateKey) || [];
              const dayAvail = availabilityByDate.get(dateKey) || [];
              const dayIsToday = isToday(date);
              const isSelected = selectedDaySessions?.dateKey === dateKey;

              return (
                <div
                  key={idx}
                  className={`cal-month-cell ${!isCurrentMonth ? 'outside' : ''} ${
                    dayIsToday ? 'today' : ''
                  } ${isSelected ? 'selected' : ''}`}
                  onClick={() =>
                    setSelectedDaySessions({
                      date,
                      dateKey,
                      sessions
                    })
                  }
                >
                  <div className="cal-month-cell-top">
                    <span
                      className={`cal-month-cell-num ${dayIsToday ? 'today-pill' : ''}`}
                    >
                      {date.getDate()}
                    </span>
                    <div className="cal-month-cell-badges">
                      {dayAvail.length > 0 && (
                        <span className="cal-month-avail-dot" title={`${dayAvail.length} study window(s)`} />
                      )}
                      {sessions.length > 0 && (
                        <span className="cal-month-count">{sessions.length}</span>
                      )}
                    </div>
                  </div>

                  <div className="cal-month-dots">
                    {sessions.slice(0, 3).map((s) => (
                      <div
                        key={s._id}
                        className="cal-month-session-pill"
                        style={{
                          borderLeft: `3px solid ${getSubjectColor(s.subjectName)}`
                        }}
                        title={`${fmtTime(s.start)}: ${s.title}`}
                      >
                        <span className="pill-time">{fmtTime(s.start)}</span>
                        <span className="pill-title">{s.title}</span>
                      </div>
                    ))}
                    {sessions.length > 3 && (
                      <span className="cal-month-more">
                        +{sessions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Month Day Details Drawer / Popout */}
          {selectedDaySessions && (
            <div className="cal-day-detail-panel">
              <div className="cal-detail-head">
                <div>
                  <span className="cal-eyebrow">DAY OVERVIEW</span>
                  <h3>
                    {selectedDaySessions.date.toLocaleDateString([], {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                </div>
                <button
                  className="cal-icon-btn"
                  onClick={() => setSelectedDaySessions(null)}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="cal-detail-body">
                {selectedDaySessions.sessions.length === 0 ? (
                  <div className="cal-detail-empty">
                    <p>No study sessions scheduled for this day.</p>
                    <button className="btn secondary small-btn" onClick={onSetAvailability}>
                      + Add Availability
                    </button>
                  </div>
                ) : (
                  <div className="cal-detail-list">
                    {selectedDaySessions.sessions.map((session) => (
                      <div
                        key={session._id}
                        className={`cal-detail-item ${session.status}`}
                      >
                        <div className="cal-detail-time">
                          <strong>{fmtTime(session.start)}</strong>
                          <span>{session.plannedMinutes} min</span>
                        </div>
                        <div className="cal-detail-info">
                          <span
                            className="cal-subject-chip"
                            style={{ color: getSubjectColor(session.subjectName) }}
                          >
                            {session.subjectName}
                          </span>
                          <h4>{session.title}</h4>
                        </div>
                        <div className="cal-detail-actions">
                          {session.status === 'planned' && (
                            <button
                              className="cal-action-btn start"
                              onClick={() => onAction(session._id, 'start')}
                            >
                              <Play size={12} />
                            </button>
                          )}
                          <button
                            className="cal-action-btn focus"
                            onClick={() => onOpenTimer(session)}
                          >
                            <Target size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AGENDA / TIMELINE VIEW */}
      {viewMode === 'agenda' && (
        <div className="cal-agenda-wrap">
          {filteredSessions.length === 0 ? (
            <div className="cal-empty-state">
              <CalendarIcon size={36} />
              <h3>No study sessions found</h3>
              <p>Try clearing filters or generate a fresh schedule with your availability.</p>
              <button className="btn primary" onClick={() => onGenerate(false)}>
                <RefreshCw size={15} /> Generate Schedule
              </button>
            </div>
          ) : (
            <div className="cal-agenda-timeline">
              {Array.from(sessionsByDate.entries()).map(([dateStr, sessions]) => {
                const dateObj = new Date(dateStr + 'T00:00:00');
                const dayIsToday = isToday(dateObj);

                return (
                  <div key={dateStr} className="cal-agenda-day-group">
                    <div className={`cal-agenda-date-badge ${dayIsToday ? 'today' : ''}`}>
                      <span className="badge-weekday">
                        {dateObj.toLocaleDateString([], { weekday: 'short' })}
                      </span>
                      <strong className="badge-day">{dateObj.getDate()}</strong>
                      <span className="badge-month">
                        {dateObj.toLocaleDateString([], { month: 'short' })}
                      </span>
                    </div>

                    <div className="cal-agenda-cards">
                      {sessions.map((session) => {
                        const color = getSubjectColor(session.subjectName);
                        return (
                          <div
                            key={session._id}
                            className={`cal-agenda-card ${session.status}`}
                            style={{ '--subject-color': color }}
                          >
                            <div className="agenda-card-time">
                              <strong>{fmtTime(session.start)}</strong>
                              <span>{fmtTime(session.end)}</span>
                              <div className="agenda-card-duration">
                                {session.plannedMinutes}m
                              </div>
                            </div>

                            <div className="agenda-card-body">
                              <div className="agenda-card-top">
                                <span
                                  className="cal-subject-chip"
                                  style={{
                                    borderColor: `${color}66`,
                                    color
                                  }}
                                >
                                  <span
                                    className="cal-subject-dot"
                                    style={{ background: color }}
                                  />
                                  {session.subjectName || 'Study'}
                                </span>
                                <span className={`cal-status-pill ${session.status}`}>
                                  {session.status}
                                </span>
                              </div>
                              <h4 className="agenda-card-title">{session.title}</h4>
                            </div>

                            <div className="agenda-card-actions">
                              {session.status === 'planned' && (
                                <>
                                  <button
                                    className="btn secondary small-btn"
                                    onClick={() => onOpenTimer(session)}
                                  >
                                    <Target size={14} /> Focus
                                  </button>
                                  <button
                                    className="btn primary small-btn"
                                    onClick={() => onAction(session._id, 'start')}
                                  >
                                    <Play size={14} /> Start
                                  </button>
                                  <button
                                    className="cal-icon-btn success"
                                    onClick={() => onAction(session._id, 'complete')}
                                    title="Complete"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    className="cal-icon-btn danger"
                                    onClick={() => onAction(session._id, 'miss')}
                                    title="Mark Missed"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              )}

                              {session.status === 'in-progress' && (
                                <>
                                  <button
                                    className="btn primary small-btn pulse-glow"
                                    onClick={() => onOpenTimer(session)}
                                  >
                                    <Target size={14} /> Focus Timer
                                  </button>
                                  <button
                                    className="btn secondary small-btn"
                                    onClick={() => onAction(session._id, 'complete')}
                                  >
                                    <Check size={14} /> Finish
                                  </button>
                                </>
                              )}

                              {session.status === 'completed' && (
                                <span className="cal-completed-tag">
                                  <Check size={14} /> Completed (
                                  {session.actualMinutes || session.plannedMinutes}m)
                                </span>
                              )}

                              {session.status === 'missed' && (
                                <span className="cal-missed-tag">
                                  Missed · Rescheduled
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
