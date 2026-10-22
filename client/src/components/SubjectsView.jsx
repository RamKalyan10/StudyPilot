import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
  FileText,
  Sparkles,
  Search,
  Check,
  GraduationCap,
  ListTodo
} from 'lucide-react';

export default function SubjectsView({
  subjects = [],
  tasks = [],
  syllabi = [],
  onOpenAddModal,
  onOpenSyllabusModal,
  onDeleteSubject,
  onSelectSubjectFilter,
  onAddTaskForSubject
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'with-syllabus' | 'pending' | 'completed'
  const [sortBy, setSortBy] = useState('tasks-desc'); // 'tasks-desc' | 'progress-desc' | 'name-asc'

  // Calculate rich stats per subject
  const subjectStats = useMemo(() => {
    return subjects.map((sub) => {
      const subTasks = tasks.filter((t) => t.subject?._id === sub._id || t.subject === sub._id);
      const totalTasks = subTasks.length;
      const completedTasks = subTasks.filter((t) => t.status === 'completed').length;
      const pendingTasks = totalTasks - completedTasks;
      const totalMinutes = subTasks.reduce(
        (sum, t) => sum + (t.remainingMinutes ?? t.estimatedMinutes ?? 0),
        0
      );
      const percent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const syllabus = syllabi.find((s) => s.subject?._id === sub._id || s.subject === sub._id);

      return {
        ...sub,
        totalTasks,
        completedTasks,
        pendingTasks,
        totalMinutes,
        percent,
        syllabus
      };
    });
  }, [subjects, tasks, syllabi]);

  // Overall workspace KPI calculations
  const totalStats = useMemo(() => {
    const totalSubs = subjects.length;
    const totalT = tasks.length;
    const completedT = tasks.filter((t) => t.status === 'completed').length;
    const withSyllabus = subjectStats.filter((s) => s.syllabus).length;
    const totalMinutes = subjectStats.reduce((sum, s) => sum + s.totalMinutes, 0);
    const avgPercent = totalSubs
      ? Math.round(subjectStats.reduce((sum, s) => sum + s.percent, 0) / totalSubs)
      : 0;

    return {
      totalSubs,
      totalT,
      completedT,
      withSyllabus,
      totalMinutes,
      avgPercent
    };
  }, [subjects, tasks, subjectStats]);

  // Filtered and sorted subjects list
  const filteredSubjects = useMemo(() => {
    let result = [...subjectStats];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.semester?.toLowerCase().includes(q) ||
          s.syllabus?.units?.some((u) => u.title?.toLowerCase().includes(q))
      );
    }

    if (filterMode === 'with-syllabus') {
      result = result.filter((s) => Boolean(s.syllabus));
    } else if (filterMode === 'pending') {
      result = result.filter((s) => s.pendingTasks > 0);
    } else if (filterMode === 'completed') {
      result = result.filter((s) => s.totalTasks > 0 && s.percent === 100);
    }

    if (sortBy === 'tasks-desc') {
      result.sort((a, b) => b.totalTasks - a.totalTasks);
    } else if (sortBy === 'progress-desc') {
      result.sort((a, b) => b.percent - a.percent);
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [subjectStats, searchQuery, filterMode, sortBy]);

  return (
    <div className="subjects-hub">
      {/* =========================================================================
          EMPTY STATE: High-conversion, beautiful visual onboarding
         ========================================================================= */}
      {subjects.length === 0 ? (
        <div className="subjects-onboarding-wrapper">
          {/* Hero Welcome Card */}
          <div className="subjects-empty-hero">
            <div className="empty-hero-glow" />
            <div className="empty-hero-badge">
              <Sparkles size={14} />
              <span>Academic Workspace Hub</span>
            </div>

            <div className="empty-hero-icon-ring">
              <GraduationCap size={38} />
            </div>

            <h2 className="empty-hero-title">Build Your Course Workspace</h2>
            <p className="empty-hero-desc">
              Organize your academic coursework, upload course syllabus documents for unit
              breakdowns, and let StudyPilot generate balanced, conflict-free study timetables.
            </p>

            <div className="empty-hero-cta-group">
              <button className="btn primary btn-lg" onClick={onOpenAddModal}>
                <Plus size={18} />
                <span>Add Custom Subject</span>
              </button>
              <button
                className="btn secondary btn-lg"
                onClick={() => onOpenSyllabusModal(null, null)}
              >
                <FileText size={17} />
                <span>Upload Course Syllabus</span>
              </button>
            </div>
          </div>

          {/* 3-Step Lifecycle Visual Guide */}
          <div className="subjects-workflow-guide">
            <div className="workflow-card">
              <div className="workflow-step-num">01</div>
              <h4>1. Organize Subjects</h4>
              <p>Assign distinct colors and semester labels to keep your calendar distinct and clean.</p>
            </div>

            <div className="workflow-card">
              <div className="workflow-step-num">02</div>
              <h4>2. Attach Syllabi & Topics</h4>
              <p>Upload PDF/DOCX course syllabi to extract units, calculate priorities, and create tasks.</p>
            </div>

            <div className="workflow-card">
              <div className="workflow-step-num">03</div>
              <h4>3. Auto-Schedule</h4>
              <p>Generate greedy and adaptive study sessions mapped against your weekly availability.</p>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            POPULATED STATE: High-end KPI metrics, Toolbar & Responsive Subject Cards
           ========================================================================= */
        <div className="subjects-populated-view">
          {/* Top KPI Metrics Summary Bar */}
          <div className="subjects-kpi-bar">
            <div className="kpi-metric-card">
              <div className="kpi-icon-box brand">
                <BookOpen size={20} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Active Subjects</span>
                <div className="kpi-value-row">
                  <span className="kpi-num">{totalStats.totalSubs}</span>
                  <span className="kpi-subtext">
                    ({totalStats.withSyllabus} with syllabus)
                  </span>
                </div>
              </div>
            </div>

            <div className="kpi-metric-card">
              <div className="kpi-icon-box green">
                <CheckCircle2 size={20} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Study Tasks</span>
                <div className="kpi-value-row">
                  <span className="kpi-num">{totalStats.totalT}</span>
                  <span className="kpi-subtext">
                    ({totalStats.completedT} done · {totalStats.totalT - totalStats.completedT} pending)
                  </span>
                </div>
              </div>
            </div>

            <div className="kpi-metric-card">
              <div className="kpi-icon-box blue">
                <Clock size={20} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Planned Study Load</span>
                <div className="kpi-value-row">
                  <span className="kpi-num">
                    {Math.floor(totalStats.totalMinutes / 60)}h {totalStats.totalMinutes % 60}m
                  </span>
                  <span className="kpi-subtext">estimated total</span>
                </div>
              </div>
            </div>

            <div className="kpi-metric-card">
              <div className="kpi-icon-box purple">
                <Layers size={20} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Avg Syllabus Progress</span>
                <div className="kpi-value-row">
                  <span className="kpi-num">{totalStats.avgPercent}%</span>
                  <span className="kpi-subtext">across all courses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar: Search, Filters & Sorters */}
          <div className="subjects-toolbar">
            <div className="subjects-search-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search subjects, units, or semester tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="subjects-search-input"
              />
              {searchQuery && (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="subjects-filter-chips">
              <button
                className={`filter-chip ${filterMode === 'all' ? 'active' : ''}`}
                onClick={() => setFilterMode('all')}
              >
                All ({subjects.length})
              </button>
              <button
                className={`filter-chip ${filterMode === 'with-syllabus' ? 'active' : ''}`}
                onClick={() => setFilterMode('with-syllabus')}
              >
                <FileText size={12} />
                <span>Has Syllabus ({totalStats.withSyllabus})</span>
              </button>
              <button
                className={`filter-chip ${filterMode === 'pending' ? 'active' : ''}`}
                onClick={() => setFilterMode('pending')}
              >
                <ListTodo size={12} />
                <span>Pending Tasks</span>
              </button>
              <button
                className={`filter-chip ${filterMode === 'completed' ? 'active' : ''}`}
                onClick={() => setFilterMode('completed')}
              >
                <Check size={12} />
                <span>100% Done</span>
              </button>
            </div>

            <div className="subjects-sort-wrapper">
              <span className="sort-label">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="subjects-sort-select"
              >
                <option value="tasks-desc">Most Tasks</option>
                <option value="progress-desc">Highest Progress</option>
                <option value="name-asc">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredSubjects.length === 0 ? (
            <div className="subjects-empty-filter-state">
              <BookOpen size={32} />
              <h4>No subjects match your search or filter</h4>
              <p>Try searching for a different keyword or switch the filter tab above.</p>
              <button
                className="btn secondary btn-sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterMode('all');
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="subjects-cards-grid">
              {filteredSubjects.map((sub) => {
                const color = sub.color || '#8b7cff';

                return (
                  <div
                    key={sub._id}
                    className="subject-card-modern"
                    style={{ '--subject-theme': color }}
                  >
                    {/* Glowing Top Accent Line */}
                    <div
                      className="subject-card-glow-bar"
                      style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }}
                    />

                    {/* Card Top Row */}
                    <div className="subject-card-top-row">
                      <div
                        className="subject-icon-box"
                        style={{
                          background: `${color}18`,
                          color: color,
                          border: `1px solid ${color}35`
                        }}
                      >
                        <BookOpen size={18} />
                      </div>

                      <div className="subject-badges">
                        {sub.semester && (
                          <span className="subject-semester-pill">{sub.semester}</span>
                        )}
                        <button
                          className="cal-icon-btn danger"
                          onClick={() => onDeleteSubject(sub._id)}
                          title="Delete Subject"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="subject-title">{sub.name}</h3>

                    {/* Syllabus Attachment Pill */}
                    <div className="subject-syllabus-banner">
                      {sub.syllabus ? (
                        <button
                          type="button"
                          className="syllabus-attached-btn"
                          onClick={() => onOpenSyllabusModal(sub, sub.syllabus)}
                          title="Click to view units and syllabus breakdown"
                        >
                          <FileText size={14} style={{ color }} />
                          <span className="syllabus-attached-text">
                            <strong>{sub.syllabus.totalUnits || sub.syllabus.units?.length || 0} Units</strong>
                            <span>({sub.syllabus.totalTopics || 0} topics analyzed)</span>
                          </span>
                          <ArrowUpRight size={13} className="syllabus-arrow" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="syllabus-add-prompt-btn"
                          onClick={() => onOpenSyllabusModal(sub, null)}
                        >
                          <Plus size={13} />
                          <span>Attach Syllabus Document</span>
                        </button>
                      )}
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="subject-quick-stats">
                      <div className="stat-pill">
                        <CheckCircle2 size={13} style={{ color: sub.percent === 100 ? '#34d399' : undefined }} />
                        <span>
                          {sub.completedTasks} of {sub.totalTasks} Tasks
                        </span>
                      </div>
                      <div className="stat-pill">
                        <Clock size={13} />
                        <span>~{sub.totalMinutes}m study load</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="subject-progress-container">
                      <div className="progress-labels">
                        <span>Course Completion</span>
                        <strong>{sub.percent}%</strong>
                      </div>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${sub.percent}%`,
                            background: `linear-gradient(90deg, ${color}, ${color}cc)`
                          }}
                        />
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="subject-card-bottom">
                      {onAddTaskForSubject && (
                        <button
                          type="button"
                          className="subject-add-task-btn"
                          onClick={() => onAddTaskForSubject(sub._id)}
                          title="Quick add a new task for this subject"
                        >
                          <Plus size={12} />
                          <span>New Task</span>
                        </button>
                      )}

                      <button
                        className="subject-filter-btn"
                        onClick={() => onSelectSubjectFilter(sub._id)}
                        title="View all tasks belonging to this subject"
                      >
                        <span>View in Tasks</span>
                        <ArrowUpRight size={13} />
                      </button>
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
