import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock3,
  Calendar,
  Search,
  Filter,
  Plus,
  Trash2,
  Kanban,
  List as ListIcon,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';

export default function TasksView({
  tasks = [],
  subjects = [],
  onAddTask,
  onUpdateTask,
  onDeleteTask
}) {
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (subjectFilter !== 'all' && t.subject?._id !== subjectFilter) return false;
      const score = t.priority || 0;
      if (priorityFilter === 'high' && score < 0.65) return false;
      if (priorityFilter === 'medium' && (score < 0.4 || score >= 0.65)) return false;
      if (priorityFilter === 'low' && score >= 0.4) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchSub = (t.subject?.name || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSub) return false;
      }
      return true;
    });
  }, [tasks, subjectFilter, priorityFilter, searchQuery]);

  // Group by status for Kanban
  const kanbanColumns = useMemo(() => {
    return [
      {
        id: 'pending',
        title: 'To Do / Pending',
        color: '#8b7cff',
        tasks: filteredTasks.filter((t) => t.status === 'pending')
      },
      {
        id: 'in-progress',
        title: 'In Progress',
        color: '#38bdf8',
        tasks: filteredTasks.filter((t) => t.status === 'in-progress')
      },
      {
        id: 'completed',
        title: 'Completed',
        color: '#34d399',
        tasks: filteredTasks.filter((t) => t.status === 'completed')
      }
    ];
  }, [filteredTasks]);

  // Urgency calculator
  const getDeadlineUrgency = (deadlineIso) => {
    const diff = new Date(deadlineIso) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: 'Overdue', tone: 'danger' };
    if (days === 0) return { label: 'Due Today', tone: 'danger' };
    if (days === 1) return { label: 'Due Tomorrow', tone: 'warning' };
    if (days <= 3) return { label: `${days}d left`, tone: 'warning' };
    return { label: `${days}d left`, tone: 'normal' };
  };

  const getSubjectColor = (subjectId) => {
    const s = subjects.find((x) => x._id === subjectId);
    return s?.color || '#8b7cff';
  };

  const moveStatus = (task, newStatus) => {
    onUpdateTask(task._id, { status: newStatus });
  };

  return (
    <div className="tasks-hub">
      {/* Top Controls Bar */}
      <div className="tasks-toolbar">
        <div className="tasks-toolbar-left">
          {/* Search Box */}
          <div className="cal-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Subject Filter */}
          <div className="cal-select-wrap">
            <BookOpen size={14} className="cal-select-icon" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="cal-select"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="cal-select-wrap">
            <Filter size={14} className="cal-select-icon" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="cal-select"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority (&gt;65)</option>
              <option value="medium">Medium Priority (40-65)</option>
              <option value="low">Low Priority (&lt;40)</option>
            </select>
          </div>
        </div>

        <div className="tasks-toolbar-right">
          {/* View Mode Toggle */}
          <div className="cal-view-toggle">
            <button
              className={`cal-view-btn ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => setViewMode('board')}
              title="Kanban Board View"
            >
              <Kanban size={14} />
              <span>Board</span>
            </button>
            <button
              className={`cal-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Table List View"
            >
              <ListIcon size={14} />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'board' && (
        <div className="kanban-board-grid">
          {kanbanColumns.map((col) => (
            <div key={col.id} className="kanban-col">
              <div className="kanban-col-header" style={{ borderTopColor: col.color }}>
                <div className="kanban-col-title">
                  <span className="kanban-dot" style={{ background: col.color }} />
                  <h3>{col.title}</h3>
                </div>
                <span className="kanban-count-badge">{col.tasks.length}</span>
              </div>

              <div className="kanban-col-cards">
                {col.tasks.length === 0 ? (
                  <div className="kanban-empty-col">
                    <span>No {col.title.toLowerCase()} tasks</span>
                  </div>
                ) : (
                  col.tasks.map((task) => {
                    const urgency = getDeadlineUrgency(task.deadline);
                    const subColor = getSubjectColor(task.subject?._id);
                    const score = Math.round((task.priority || 0) * 100);

                    return (
                      <div
                        key={task._id}
                        className={`kanban-card ${task.status}`}
                        style={{ '--subject-accent': subColor }}
                      >
                        <div className="kanban-card-top">
                          <span
                            className="cal-subject-chip"
                            style={{
                              borderColor: `${subColor}66`,
                              color: subColor
                            }}
                          >
                            <span
                              className="cal-subject-dot"
                              style={{ background: subColor }}
                            />
                            {task.subject?.name || 'General'}
                          </span>

                          <span className={`task-type-badge ${task.type}`}>
                            {task.type}
                          </span>
                        </div>

                        <h4 className="kanban-card-title">{task.title}</h4>

                        {task.notes && (
                          <p className="kanban-card-notes">{task.notes}</p>
                        )}

                        <div className="kanban-card-meta">
                          <div className={`urgency-pill ${urgency.tone}`}>
                            <Calendar size={12} />
                            <span>{urgency.label}</span>
                          </div>

                          <div className="time-pill">
                            <Clock3 size={12} />
                            <span>
                              {task.remainingMinutes ?? task.estimatedMinutes}m / {task.estimatedMinutes}m
                            </span>
                          </div>
                        </div>

                        {/* Priority Score Bar */}
                        <div className="kanban-priority-wrap">
                          <div className="priority-label-row">
                            <span>Priority Score</span>
                            <strong className={score > 65 ? 'high' : score > 40 ? 'med' : 'low'}>
                              {score} / 100
                            </strong>
                          </div>
                          <div className="priority-bar-track">
                            <div
                              className="priority-bar-fill"
                              style={{
                                width: `${score}%`,
                                background:
                                  score > 65
                                    ? 'linear-gradient(90deg, #f43f5e, #fb7185)'
                                    : score > 40
                                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                    : 'linear-gradient(90deg, #34d399, #10b981)'
                              }}
                            />
                          </div>
                        </div>

                        {/* Card Footer / Move controls */}
                        <div className="kanban-card-footer">
                          <div className="kanban-shift-btns">
                            {col.id !== 'pending' && (
                              <button
                                className="shift-btn"
                                onClick={() =>
                                  moveStatus(
                                    task,
                                    col.id === 'completed' ? 'in-progress' : 'pending'
                                  )
                                }
                                title="Move backwards"
                              >
                                <ChevronLeft size={13} />
                              </button>
                            )}

                            {col.id !== 'completed' && (
                              <button
                                className="shift-btn primary"
                                onClick={() =>
                                  moveStatus(
                                    task,
                                    col.id === 'pending' ? 'in-progress' : 'completed'
                                  )
                                }
                                title="Advance task"
                              >
                                <span>Advance</span>
                                <ChevronRight size={13} />
                              </button>
                            )}
                          </div>

                          <button
                            className="cal-icon-btn danger"
                            onClick={() => onDeleteTask(task._id)}
                            title="Delete task"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIST / TABLE VIEW */}
      {viewMode === 'list' && (
        <div className="tasks-table-card">
          {filteredTasks.length === 0 ? (
            <div className="cal-empty-state">
              <CheckCircle2 size={36} />
              <h3>No tasks found</h3>
              <p>Add your first study assignment or revise your search criteria.</p>
              <button className="btn primary" onClick={onAddTask}>
                <Plus size={15} /> Add Task
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>Done</th>
                    <th>Task & Subject</th>
                    <th>Type</th>
                    <th>Deadline</th>
                    <th>Time Needed</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th style={{ width: 60 }} />
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t) => {
                    const urgency = getDeadlineUrgency(t.deadline);
                    const subColor = getSubjectColor(t.subject?._id);
                    const score = Math.round((t.priority || 0) * 100);

                    return (
                      <tr key={t._id} className={t.status === 'completed' ? 'row-done' : ''}>
                        <td>
                          <button
                            className={`table-check-btn ${t.status === 'completed' ? 'checked' : ''}`}
                            onClick={() =>
                              moveStatus(
                                t,
                                t.status === 'completed' ? 'pending' : 'completed'
                              )
                            }
                            title={
                              t.status === 'completed'
                                ? 'Mark as Pending'
                                : 'Mark as Completed'
                            }
                          >
                            {t.status === 'completed' && <Check size={13} />}
                          </button>
                        </td>

                        <td>
                          <div className="table-task-main">
                            <span
                              className="table-subject-dot"
                              style={{ background: subColor }}
                              title={t.subject?.name}
                            />
                            <div>
                              <strong className="table-task-title">{t.title}</strong>
                              <span className="table-sub-name">
                                {t.subject?.name || 'General'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className={`task-type-badge ${t.type}`}>{t.type}</span>
                        </td>

                        <td>
                          <div className={`table-urgency ${urgency.tone}`}>
                            <span>{new Date(t.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            <small>({urgency.label})</small>
                          </div>
                        </td>

                        <td>
                          <span className="table-minutes">
                            <strong>{t.remainingMinutes ?? t.estimatedMinutes}m</strong> / {t.estimatedMinutes}m
                          </span>
                        </td>

                        <td>
                          <span
                            className={`priority-pill ${
                              score > 65 ? 'high' : score > 40 ? 'medium' : 'low'
                            }`}
                          >
                            {score} / 100
                          </span>
                        </td>

                        <td>
                          <select
                            className={`status-select ${t.status}`}
                            value={t.status}
                            onChange={(e) => moveStatus(t, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>

                        <td>
                          <button
                            className="cal-icon-btn danger"
                            onClick={() => onDeleteTask(t._id)}
                            title="Delete task"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
