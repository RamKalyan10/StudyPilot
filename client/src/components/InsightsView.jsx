import React from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock3,
  CalendarDays,
  Target,
  BookOpen,
  PieChart,
  Activity
} from 'lucide-react';

export default function InsightsView({ analytics }) {
  const minutesLabel = (m) => {
    if (!m) return '0m';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const min = m % 60;
    return min ? `${h}h ${min}m` : `${h}h`;
  };

  return (
    <div className="insights-hub">
      {/* Metrics Row */}
      <div className="insights-metrics-grid">
        <div className="insight-card-metric purple">
          <div className="metric-icon">
            <CheckCircle2 size={20} />
          </div>
          <div className="metric-body">
            <span className="metric-title">Completion Rate</span>
            <strong className="metric-val">{analytics?.completionRate || 0}%</strong>
            <span className="metric-sub">
              {analytics?.completedTasks || 0} of {analytics?.totalTasks || 0} tasks done
            </span>
          </div>
        </div>

        <div className="insight-card-metric blue">
          <div className="metric-icon">
            <Clock3 size={20} />
          </div>
          <div className="metric-body">
            <span className="metric-title">Total Study Logged</span>
            <strong className="metric-val">
              {minutesLabel(analytics?.actualStudyMinutes || 0)}
            </strong>
            <span className="metric-sub">Across completed sessions</span>
          </div>
        </div>

        <div className="insight-card-metric orange">
          <div className="metric-icon">
            <CalendarDays size={20} />
          </div>
          <div className="metric-body">
            <span className="metric-title">Schedule Versions</span>
            <strong className="metric-val">{analytics?.scheduleVersions || 0}</strong>
            <span className="metric-sub">Adaptive plan iterations</span>
          </div>
        </div>

        <div className="insight-card-metric green">
          <div className="metric-icon">
            <Target size={20} />
          </div>
          <div className="metric-body">
            <span className="metric-title">Tasks in Queue</span>
            <strong className="metric-val">{analytics?.pendingTasks || 0}</strong>
            <span className="metric-sub">Active remaining work</span>
          </div>
        </div>
      </div>

      {/* Grid: Subject Progress & Study Efficiency */}
      <div className="insights-panels-grid">
        {/* Subject Progress */}
        <div className="insights-panel">
          <div className="panel-header-clean">
            <div className="panel-header-title">
              <BookOpen size={17} />
              <h3>Progress by Subject</h3>
            </div>
            <span className="panel-tag">{analytics?.bySubject?.length || 0} Subjects</span>
          </div>

          <div className="subject-analytics-list">
            {!analytics?.bySubject?.length ? (
              <p className="empty-hint">Add subjects and tasks to see analytics.</p>
            ) : (
              analytics.bySubject.map((s) => {
                const percent = s.total ? Math.round((s.completed / s.total) * 100) : 0;
                return (
                  <div key={s.subject} className="subject-bar-row">
                    <div className="subject-bar-info">
                      <strong>{s.subject}</strong>
                      <span>
                        {s.completed} / {s.total} Tasks ({s.remainingMinutes}m left)
                      </span>
                    </div>

                    <div className="subject-bar-track">
                      <div
                        className="subject-bar-fill"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Study Execution & Efficiency Summary */}
        <div className="insights-panel">
          <div className="panel-header-clean">
            <div className="panel-header-title">
              <Activity size={17} />
              <h3>Study Efficiency & Workload Summary</h3>
            </div>
            <span className="panel-tag">Live Analytics</span>
          </div>

          <div className="analytics-summary-body">
            <div className="analytics-stat-row">
              <span className="summary-label">Total Completed Work</span>
              <strong className="summary-val">{analytics?.completedTasks || 0} Tasks</strong>
            </div>

            <div className="analytics-stat-row">
              <span className="summary-label">Total Backlog Work</span>
              <strong className="summary-val">{analytics?.pendingTasks || 0} Tasks Remaining</strong>
            </div>

            <div className="analytics-stat-row">
              <span className="summary-label">Total Study Time Logged</span>
              <strong className="summary-val">{minutesLabel(analytics?.actualStudyMinutes || 0)}</strong>
            </div>

            <div className="analytics-stat-row">
              <span className="summary-label">Planned Schedule Load</span>
              <strong className="summary-val">{minutesLabel(analytics?.latestPlannedMinutes || 0)}</strong>
            </div>

            <div className="analytics-stat-row">
              <span className="summary-label">Schedule Adaptive Iterations</span>
              <strong className="summary-val">v{analytics?.scheduleVersions || 1} Generated</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
