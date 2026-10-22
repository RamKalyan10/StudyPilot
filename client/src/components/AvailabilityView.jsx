import React, { useMemo } from 'react';
import {
  Clock,
  Clock3,
  CalendarDays,
  Plus,
  Trash2
} from 'lucide-react';

export default function AvailabilityView({
  availability = [],
  onOpenModal,
  onDeleteAvailability,
  onGenerateSchedule,
  busy = false
}) {
  // Compute total available minutes
  const totalMinutes = useMemo(() => {
    return availability.reduce((acc, a) => {
      const ms = new Date(a.end) - new Date(a.start);
      return acc + Math.max(0, Math.floor(ms / 60000));
    }, 0);
  }, [availability]);

  const totalHours = (totalMinutes / 60).toFixed(1);

  const fmt = (d) =>
    new Date(d).toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  return (
    <div className="avail-hub">
      {/* Top Banner Stats */}
      <div className="avail-hero-banner">
        <div className="avail-hero-info">
          <div className="avail-kicker">
            <Clock3 size={15} />
            <span>FLEXIBLE STUDY WINDOWS</span>
          </div>
          <h2>Design Your Dedicated Focus Windows</h2>
          <p>
            StudyPilot reserves sessions only inside the study windows you specify.
            Add your available time blocks and generate a schedule.
          </p>
        </div>

        <div className="avail-hero-stats">
          <div className="avail-stat-box">
            <span className="stat-label">Total Time Reserved</span>
            <strong className="stat-num">{totalHours}h</strong>
            <span className="stat-sub">{totalMinutes} minutes</span>
          </div>
          <div className="avail-stat-box">
            <span className="stat-label">Active Windows</span>
            <strong className="stat-num">{availability.length}</strong>
            <span className="stat-sub">Configured slots</span>
          </div>
          <button className="btn primary" onClick={onOpenModal}>
            <Plus size={16} /> Add Custom Window
          </button>
        </div>
      </div>

      {/* Configured Windows List */}
      <div className="avail-section">
        <div className="avail-section-head">
          <CalendarDays size={16} />
          <h3>Your Scheduled Availability Windows</h3>
          <span className="avail-count-tag">{availability.length} Windows</span>
        </div>

        {availability.length === 0 ? (
          <div className="cal-empty-state">
            <Clock size={36} />
            <h3>No study windows configured yet</h3>
            <p>
              Create your custom availability windows to let StudyPilot know when you're available to study.
            </p>
            <button className="btn primary" onClick={onOpenModal}>
              <Plus size={15} /> Add First Window
            </button>
          </div>
        ) : (
          <div className="avail-cards-list">
            {availability.map((a) => {
              const start = new Date(a.start);
              const end = new Date(a.end);
              const durationMins = Math.max(0, Math.round((end - start) / 60000));
              const hours = Math.floor(durationMins / 60);
              const mins = durationMins % 60;
              const durationStr = hours > 0 ? `${hours}h ${mins ? mins + 'm' : ''}` : `${mins}m`;

              return (
                <div key={a._id} className="avail-item-card">
                  <div className="avail-item-date">
                    <span className="date-month">
                      {start.toLocaleDateString([], { month: 'short' })}
                    </span>
                    <strong className="date-number">{start.getDate()}</strong>
                    <span className="date-day">
                      {start.toLocaleDateString([], { weekday: 'short' })}
                    </span>
                  </div>

                  <div className="avail-item-main">
                    <div className="avail-item-top">
                      <strong className="avail-item-label">{a.label || 'Study Time'}</strong>
                      <span className="avail-duration-pill">{durationStr} duration</span>
                    </div>

                    <div className="avail-item-times">
                      <Clock3 size={13} />
                      <span>
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <button
                    className="cal-icon-btn danger"
                    onClick={() => onDeleteAvailability(a._id)}
                    title="Remove window"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
