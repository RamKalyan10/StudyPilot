import React, { useEffect, useMemo, useState } from 'react';
import {
  Compass,
  LayoutDashboard,
  CalendarDays,
  CheckCircle2,
  BookOpen,
  Clock3,
  TrendingUp,
  LogOut,
  Plus,
  RefreshCw,
  Target,
  Flame,
  Check,
  X,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Play,
  Calendar,
  AlertCircle,
  Sun,
  Moon,
  FileText,
  Upload,
  Loader2,
  FileCheck
} from 'lucide-react';
import { api, getToken, setToken } from './api';
import CalendarView from './components/CalendarView';
import StudyTimer from './components/StudyTimer';
import TasksView from './components/TasksView';
import AvailabilityView from './components/AvailabilityView';
import SubjectsView from './components/SubjectsView';
import InsightsView from './components/InsightsView';
import SyllabusModal, { SAMPLE_DSA_SYLLABUS, SAMPLE_DBMS_SYLLABUS } from './components/SyllabusModal';
import { extractDocumentText } from './utils/docExtractor';

const dateInput = (date = new Date()) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};

const COLOR_PALETTE = [
  { name: 'Royal Purple', hex: '#8b7cff' },
  { name: 'Electric Sky', hex: '#38bdf8' },
  { name: 'Emerald Mint', hex: '#34d399' },
  { name: 'Warm Amber', hex: '#fb923c' },
  { name: 'Rose Pink', hex: '#f472b6' },
  { name: 'Soft Violet', hex: '#a78bfa' },
  { name: 'Coral Red', hex: '#fb7185' }
];

function AuthScreen({ onAuth, theme = 'dark', onToggleTheme }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
      setToken(data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-art">
        <div className="brand">
          <div className="brand-icon">
            <Compass />
          </div>
          <span>StudyPilot</span>
        </div>
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="pulse" /> ADAPTIVE STUDY PLANNER & CALENDAR
          </div>
          <h1>
            Study with clarity.<br />
            <em>Achieve with ease.</em>
          </h1>
          <p>
            An intelligent study companion that balances your subjects, deadlines, and
            daily availability into an adaptive visual timetable.
          </p>
          <div className="hero-stats">
            <div>
              <strong>01</strong>
              <span>Interactive Calendar</span>
            </div>
            <div>
              <strong>02</strong>
              <span>Priority Scheduler</span>
            </div>
            <div>
              <strong>03</strong>
              <span>Live Study Timer</span>
            </div>
          </div>
        </div>
        <div className="art-orbit orbit-one" />
        <div className="art-orbit orbit-two" />
        <div className="art-glow" />
      </div>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-top-actions">
            <div className="mobile-brand">
              <div className="brand-icon">
                <Compass />
              </div>
              <span>StudyPilot</span>
            </div>
            {onToggleTheme && (
              <button
                type="button"
                className="theme-toggle-btn"
                onClick={onToggleTheme}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            )}
          </div>
          <span className="eyebrow">WELCOME {mode === 'login' ? 'BACK' : 'ABOARD'}</span>
          <h2>
            {mode === 'login'
              ? 'Your study workspace awaits.'
              : 'Start your study journey.'}
          </h2>
          <p className="muted">
            {mode === 'login'
              ? 'Sign in to access your customized study schedule.'
              : 'Create an account to start generating visual study plans.'}
          </p>

          <form onSubmit={submit} className="form-stack">
            {mode === 'register' && (
              <label>
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Alex Mercer"
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                placeholder="At least 8 characters"
              />
            </label>
            {error && <div className="error-msg">{error}</div>}
            <button className="btn primary full" disabled={busy}>
              {busy
                ? 'Please wait…'
                : mode === 'login'
                ? 'Sign in to StudyPilot'
                : 'Create Account'}{' '}
              <ArrowUpRight size={17} />
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'login' ? 'New to StudyPilot?' : 'Already have an account?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
            >
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </p>

          <div className="secure-note">
            <ShieldCheck size={15} /> Data secured & isolated to your account.
          </div>
        </div>
      </section>
    </main>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section className="modal">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('studypilot_theme') || 'dark');
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [page, setPage] = useState('Overview');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('studypilot_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [syllabi, setSyllabi] = useState([]);
  const [syllabusModal, setSyllabusModal] = useState({ isOpen: false, subject: null, syllabus: null });
  const [modal, setModal] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);

  // Active study companion timer
  const [activeTimerSession, setActiveTimerSession] = useState(null);

  // Forms
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    semester: '',
    color: '#8b7cff',
    syllabusText: '',
    syllabusFileName: ''
  });
  const [showSyllabusInput, setShowSyllabusInput] = useState(false);
  const [subjectDocExtracting, setSubjectDocExtracting] = useState(false);
  const [subjectDocError, setSubjectDocError] = useState('');
  const [subjectDocMeta, setSubjectDocMeta] = useState(null);

  async function handleSubjectDocUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubjectDocExtracting(true);
    setSubjectDocError('');
    try {
      const res = await extractDocumentText(file);
      setSubjectForm((prev) => ({
        ...prev,
        syllabusText: res.text || '',
        syllabusFileName: res.fileName || file.name,
        name: prev.name.trim() ? prev.name : file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      }));
      setSubjectDocMeta({
        fileName: file.name,
        detectedType: res.detectedType || (file.name.split('.').pop()?.toUpperCase() + ' Document'),
        pages: res.pages,
        totalUnits: res.totalUnits,
        totalTopics: res.totalTopics
      });
      notify(`Parsed ${file.name} successfully!`);
    } catch (err) {
      setSubjectDocError(err.message || 'Could not parse document.');
    } finally {
      setSubjectDocExtracting(false);
    }
  }

  const [taskForm, setTaskForm] = useState({
    title: '',
    subject: '',
    type: 'topic',
    deadline: dateInput(new Date(Date.now() + 3 * 86400000)),
    estimatedMinutes: 60,
    importance: 3,
    difficulty: 3,
    confidence: 3,
    notes: ''
  });

  const [availForm, setAvailForm] = useState({
    start: dateInput(new Date(Date.now() + 3600000)),
    end: dateInput(new Date(Date.now() + 3 * 3600000)),
    label: 'Evening Study Time'
  });

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          const d = await api('/auth/me');
          setUser(d.user);
        } catch {
          setToken(null);
        }
      }
      setChecking(false);
    })();
  }, []);

  useEffect(() => {
    if (user) refresh();
  }, [user]);

  async function refresh() {
    setError('');
    try {
      const [s, t, a, sc, an, syl] = await Promise.all([
        api('/subjects'),
        api('/tasks'),
        api('/availability'),
        api('/schedules/latest'),
        api('/analytics/progress'),
        api('/syllabus')
      ]);
      setSubjects(s);
      setTasks(t);
      setAvailability(a);
      setSchedule(sc);
      setAnalytics(an);
      setSyllabi(syl || []);
      if (!taskForm.subject && s[0]) {
        setTaskForm((f) => ({ ...f, subject: s[0]._id }));
      }
    } catch (e) {
      setError(e.message);
    }
  }

  function notify(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  async function act(fn, success) {
    setBusy(true);
    setError('');
    try {
      await fn();
      await refresh();
      if (success) notify(success);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // Syllabus Handlers
  async function saveSyllabus(payload) {
    await act(async () => {
      await api('/syllabus', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSyllabusModal({ isOpen: false, subject: null, syllabus: null });
    }, 'Syllabus analyzed & stored with unit breakdown!');
  }

  async function deleteSyllabus(id) {
    await act(async () => {
      await api(`/syllabus/${id}`, { method: 'DELETE' });
      setSyllabusModal({ isOpen: false, subject: null, syllabus: null });
    }, 'Syllabus removed');
  }

  async function createTasksFromSyllabus(syllabusId, unitNumbers) {
    await act(async () => {
      const res = await api(`/syllabus/${syllabusId}/create-tasks`, {
        method: 'POST',
        body: JSON.stringify({ unitNumbers })
      });
      notify(res.message || 'Tasks created from syllabus!');
    });
  }

  // Subjects
  async function addSubject(e) {
    e.preventDefault();
    await act(async () => {
      await api('/subjects', {
        method: 'POST',
        body: JSON.stringify(subjectForm)
      });
      setSubjectForm({ name: '', semester: '', color: '#8b7cff', syllabusText: '', syllabusFileName: '' });
      setShowSyllabusInput(false);
      setSubjectDocMeta(null);
      setSubjectDocError('');
      setModal('');
    }, subjectForm.syllabusText?.trim() ? 'Subject and syllabus created with unit breakdown!' : 'Subject created successfully');
  }

  async function quickAddSubject({ name, semester, color }) {
    await act(async () => {
      await api('/subjects', {
        method: 'POST',
        body: JSON.stringify({ name, semester: semester || '', color: color || '#8b7cff' })
      });
    }, `Subject "${name}" added to your workspace!`);
  }

  async function deleteSubject(id) {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    await act(() => api(`/subjects/${id}`, { method: 'DELETE' }), 'Subject deleted');
  }

  // Tasks
  async function addTask(e) {
    e.preventDefault();
    await act(async () => {
      await api('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          ...taskForm,
          estimatedMinutes: Number(taskForm.estimatedMinutes),
          importance: Number(taskForm.importance),
          difficulty: Number(taskForm.difficulty),
          confidence: Number(taskForm.confidence),
          deadline: new Date(taskForm.deadline).toISOString()
        })
      });
      setModal('');
      setTaskForm((f) => ({ ...f, title: '', notes: '' }));
    }, 'Task added to your study backlog');
  }

  async function updateTask(id, patch) {
    await act(() => {
      return api(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch)
      });
    }, 'Task updated');
  }

  async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    await act(() => api(`/tasks/${id}`, { method: 'DELETE' }), 'Task removed');
  }

  // Availability
  async function addAvailability(e) {
    e.preventDefault();
    await act(async () => {
      await api('/availability', {
        method: 'POST',
        body: JSON.stringify({
          ...availForm,
          start: new Date(availForm.start).toISOString(),
          end: new Date(availForm.end).toISOString()
        })
      });
      setModal('');
    }, 'Study window saved');
  }

  async function addPresetAvailability({ start, end, label }) {
    await act(async () => {
      await api('/availability', {
        method: 'POST',
        body: JSON.stringify({
          label,
          start: start.toISOString(),
          end: end.toISOString()
        })
      });
    }, `Added ${label}`);
  }

  async function deleteAvailability(id) {
    await act(() => api(`/availability/${id}`, { method: 'DELETE' }), 'Availability removed');
  }

  // Schedules
  async function generate(recovery = false) {
    await act(async () => {
      const d = await api(`/schedules/${recovery ? 'reschedule' : 'generate'}`, {
        method: 'POST',
        body: JSON.stringify({
          reason: recovery ? 'missed session recovery' : 'manual regeneration'
        })
      });
      setSchedule(d);
      setPage('Schedule');
    }, recovery ? 'Schedule recovered & updated' : 'New study schedule generated!');
  }

  // Session Actions
  async function sessionAction(id, action, payload = {}) {
    await act(async () => {
      await api(`/sessions/${id}/${action}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (action === 'miss') {
        await api('/schedules/reschedule', {
          method: 'POST',
          body: JSON.stringify({ reason: 'missed session recovery' })
        });
      }
    }, action === 'complete' ? 'Session completed & logged!' : action === 'miss' ? 'Session marked missed and recovered' : 'Session started!');
  }

  const upcoming = useMemo(
    () =>
      [...(schedule?.sessions || [])]
        .filter((s) => s.status === 'planned' || s.status === 'in-progress')
        .sort((a, b) => new Date(a.start) - new Date(b.start)),
    [schedule]
  );

  const nextSession = upcoming[0];

  if (checking) {
    return (
      <div className="loading-screen">
        <div className="brand-icon">
          <Compass />
        </div>
        <span>Preparing your study cockpit…</span>
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={setUser} theme={theme} onToggleTheme={toggleTheme} />;

  const nav = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Schedule', icon: CalendarDays },
    { label: 'My tasks', icon: CheckCircle2 },
    { label: 'Availability', icon: Clock3 },
    { label: 'Subjects', icon: BookOpen },
    { label: 'Insights', icon: TrendingUp }
  ];

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Compass />
          </div>
          <span>StudyPilot</span>
          <span className="brand-dot">.</span>
        </div>

        <div className="workspace-label">STUDY WORKSPACE</div>

        <nav>
          {nav.map((n) => {
            const count =
              n.label === 'My tasks'
                ? tasks.filter((t) => t.status !== 'completed').length
                : n.label === 'Schedule'
                ? upcoming.length
                : null;

            return (
              <button
                key={n.label}
                className={`nav-item ${page === n.label ? 'active' : ''}`}
                onClick={() => setPage(n.label)}
              >
                <n.icon size={18} />
                <span>{n.label}</span>
                {count > 0 && <b className="nav-count">{count}</b>}
              </button>
            );
          })}
        </nav>

        {/* Live companion button in sidebar if active session exists */}
        {nextSession && (
          <div className="sidebar-companion-widget">
            <div className="companion-head">
              <Sparkles size={13} />
              <span>Next Up</span>
            </div>
            <strong>{nextSession.title}</strong>
            <span>{nextSession.plannedMinutes}m · {nextSession.subjectName}</span>
            <button
              className="companion-start-btn"
              onClick={() => setActiveTimerSession(nextSession)}
            >
              <Target size={14} />
              <span>Launch Focus Timer</span>
            </button>
          </div>
        )}

        <div className="sidebar-bottom">
          <div className="focus-card">
            <div className="focus-icon">
              <Flame size={18} />
            </div>
            <strong>Daily Study Rhythm</strong>
            <p>Consistency beats cramming. Build your streak one session at a time.</p>
            <div className="focus-line">
              <span />
            </div>
          </div>

          <div className="user-mini">
            <div className="avatar">{user.name?.slice(0, 1).toUpperCase()}</div>
            <div className="user-info">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
            <button
              className="icon-btn logout"
              title="Sign out"
              onClick={() => {
                setToken(null);
                setUser(null);
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{page}</strong>
          </div>

          <div className="topbar-right">
            {/* Quick Focus Button if timer session is active */}
            {activeTimerSession && (
              <button
                className="topbar-timer-chip"
                onClick={() => setActiveTimerSession({ ...activeTimerSession })}
              >
                <span className="live-dot" />
                <span>Focus Active: {activeTimerSession.title}</span>
              </button>
            )}

            <span className="today-label">
              <span className="status-dot" />
              {new Date().toLocaleDateString([], {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </span>

            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <div className="avatar small">{user.name?.slice(0, 1).toUpperCase()}</div>
          </div>
        </header>

        <div className="page-content">
          {/* Page Heading */}
          <div className="page-heading">
            <div>
              <span className="eyebrow">YOUR PERSONAL STUDY SPACE</span>
              <h1>
                {page === 'Overview' ? (
                  <>
                    Welcome back, {user.name.split(' ')[0]}
                    <span className="wave">✦</span>
                  </>
                ) : page === 'Schedule' ? (
                  'Interactive Study Calendar'
                ) : page === 'My tasks' ? (
                  'Task Management Hub'
                ) : (
                  page
                )}
              </h1>
              <p>
                {page === 'Overview'
                  ? "Here's an overview of your study progress and upcoming scheduled sessions."
                  : page === 'Schedule'
                  ? 'Visual week and month calendar of all your planned study sessions.'
                  : page === 'My tasks'
                  ? 'Organize assignments and topics with Kanban boards and priority scoring.'
                  : page === 'Subjects'
                  ? 'Manage your academic coursework, colors, and progress tracking.'
                  : page === 'Availability'
                  ? 'Define your dedicated focus hours so StudyPilot can build the ideal schedule.'
                  : 'Deep dive into your learning analytics and study progress.'}
              </p>
            </div>

            <div className="heading-actions">
              {page === 'Overview' && (
                <>
                  <button
                    className="btn secondary"
                    onClick={() => generate(true)}
                    disabled={busy}
                  >
                    <RefreshCw size={15} className={busy ? 'spin' : ''} /> Reschedule
                  </button>
                  <button className="btn primary" onClick={() => setModal('task')}>
                    <Plus size={16} /> New Task
                  </button>
                </>
              )}

              {page === 'Schedule' && (
                <>
                  <button
                    className="btn secondary"
                    onClick={() => generate(true)}
                    disabled={busy}
                  >
                    <RefreshCw size={15} className={busy ? 'spin' : ''} /> Reschedule
                  </button>
                  <button className="btn primary" onClick={() => setModal('task')}>
                    <Plus size={16} /> New Task
                  </button>
                </>
              )}

              {page === 'My tasks' && (
                <button className="btn primary" onClick={() => setModal('task')}>
                  <Plus size={16} /> New Task
                </button>
              )}

              {page === 'Availability' && (
                <>
                  <button
                    className="btn secondary"
                    onClick={() => generate(false)}
                    disabled={busy}
                  >
                    <RefreshCw size={15} className={busy ? 'spin' : ''} /> Generate Schedule
                  </button>
                  <button className="btn primary" onClick={() => setModal('availability')}>
                    <Plus size={16} /> Add Focus Window
                  </button>
                </>
              )}

              {page === 'Subjects' && (
                <>
                  <button
                    className="btn secondary"
                    onClick={() => setSyllabusModal({ isOpen: true, subject: null, syllabus: null })}
                    title="Upload or analyze course syllabus"
                  >
                    <FileText size={15} />
                    <span>Syllabus AI Analyzer</span>
                  </button>
                  <button className="btn primary" onClick={() => setModal('subject')}>
                    <Plus size={16} /> Add Subject
                  </button>
                </>
              )}

              {page === 'Insights' && null}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="banner error-banner">
              <div className="banner-left">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
              <button onClick={() => setError('')}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* PAGE: OVERVIEW */}
          {page === 'Overview' && (
            <>
              {/* Focus Banner */}
              <section className="welcome-banner">
                <div className="welcome-copy">
                  <div className="banner-kicker">
                    <span /> YOUR NEXT STUDY FOCUS
                  </div>
                  {nextSession ? (
                    <>
                      <h2>
                        Next: {nextSession.title}
                        <br />
                        <em>{nextSession.plannedMinutes} min planned session</em>
                      </h2>
                      <p>
                        Scheduled for{' '}
                        {new Date(nextSession.start).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}{' '}
                        ({nextSession.subjectName}). Launch the timer to begin focusing.
                      </p>
                      <button
                        className="btn light"
                        onClick={() => setActiveTimerSession(nextSession)}
                      >
                        <Target size={16} /> Launch Focus Timer <ArrowUpRight size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <h2>
                        Ready to plan
                        <br />
                        <em>your study week?</em>
                      </h2>
                      <p>
                        Configure your availability and add tasks to generate your visual
                        study calendar.
                      </p>
                      <button className="btn light" onClick={() => setPage('Schedule')}>
                        <CalendarDays size={16} /> View Visual Calendar{' '}
                        <ArrowUpRight size={16} />
                      </button>
                    </>
                  )}
                </div>

                <div className="banner-graphic">
                  <div className="graphic-ring ring-a" />
                  <div className="graphic-ring ring-b" />
                  <div className="graphic-core">
                    <Target size={38} />
                  </div>
                  <div className="floating-chip chip-one">
                    <Check size={14} /> One task at a time
                  </div>
                  <div className="floating-chip chip-two">
                    <Flame size={14} /> Build your streak
                  </div>
                </div>
              </section>

              {/* Stats Grid */}
              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon purple">
                    <CheckCircle2 size={19} />
                  </div>
                  <span className="stat-label">Tasks Completed</span>
                  <strong className="stat-value">{analytics?.completedTasks || 0}</strong>
                  <span className="stat-sub">
                    {analytics?.completionRate || 0}% completion rate
                  </span>
                </div>

                <div className="stat-card">
                  <div className="stat-icon blue">
                    <Clock3 size={19} />
                  </div>
                  <span className="stat-label">Study Time Logged</span>
                  <strong className="stat-value">
                    {Math.round((analytics?.actualStudyMinutes || 0) / 60)}h{' '}
                    {(analytics?.actualStudyMinutes || 0) % 60}m
                  </strong>
                  <span className="stat-sub">Across completed sessions</span>
                </div>

                <div className="stat-card">
                  <div className="stat-icon orange">
                    <CalendarDays size={19} />
                  </div>
                  <span className="stat-label">Planned Sessions</span>
                  <strong className="stat-value">{upcoming.length}</strong>
                  <span className="stat-sub">In your active schedule</span>
                </div>

                <div className="stat-card">
                  <div className="stat-icon green">
                    <Target size={19} />
                  </div>
                  <span className="stat-label">Tasks In Queue</span>
                  <strong className="stat-value">{analytics?.pendingTasks || 0}</strong>
                  <span className="stat-sub">Active backlog</span>
                </div>
              </section>

              {/* Upcoming sessions & priority list */}
              <div className="content-grid">
                {/* Upcoming sessions card */}
                <section className="panel schedule-panel">
                  <div className="panel-head">
                    <div>
                      <span className="eyebrow">YOUR PLAN</span>
                      <h3>Upcoming Sessions</h3>
                    </div>
                    <button className="text-btn" onClick={() => setPage('Schedule')}>
                      Full Calendar <ArrowUpRight size={15} />
                    </button>
                  </div>

                  {upcoming.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <CalendarDays size={23} />
                      </div>
                      <strong>No sessions scheduled yet</strong>
                      <p>Add availability windows and tasks, then generate a study plan.</p>
                      <button
                        className="btn secondary"
                        onClick={() => setPage('Availability')}
                      >
                        Set Availability <ArrowUpRight size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="session-list">
                      {upcoming.slice(0, 4).map((s) => (
                        <div key={s._id} className={`session-row ${s.status}`}>
                          <div className="session-date">
                            <strong>
                              {new Date(s.start).toLocaleDateString([], {
                                day: '2-digit'
                              })}
                            </strong>
                            <span>
                              {new Date(s.start).toLocaleDateString([], {
                                month: 'short'
                              })}
                            </span>
                          </div>
                          <div className="session-time">
                            <strong>
                              {new Date(s.start).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </strong>
                            <span>{s.plannedMinutes} min</span>
                          </div>
                          <div className="session-detail">
                            <strong>{s.title}</strong>
                            <span>
                              {s.subjectName || 'Study session'} ·{' '}
                              {new Date(s.start).toLocaleDateString([], {
                                weekday: 'short'
                              })}
                            </span>
                          </div>
                          <div className="session-actions">
                            <button
                              className="cal-action-btn focus"
                              onClick={() => setActiveTimerSession(s)}
                              title="Focus in timer"
                            >
                              <Target size={13} />
                            </button>
                            {s.status === 'planned' && (
                              <button
                                className="icon-btn"
                                onClick={() => sessionAction(s._id, 'start')}
                                title="Start"
                              >
                                <Play size={14} />
                              </button>
                            )}
                            <button
                              className="icon-btn success-icon"
                              onClick={() => sessionAction(s._id, 'complete')}
                              title="Complete"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Priority tasks panel */}
                <section className="panel priority-panel">
                  <div className="panel-head">
                    <div>
                      <span className="eyebrow">TASK PRIORITY</span>
                      <h3>Top Priority Tasks</h3>
                    </div>
                    <button className="icon-btn" onClick={() => setPage('My tasks')}>
                      <ArrowUpRight size={17} />
                    </button>
                  </div>

                  {tasks.filter((t) => t.status !== 'completed').length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <CheckCircle2 size={23} />
                      </div>
                      <strong>All caught up!</strong>
                      <p>You have no pending tasks right now. Add a task to keep progressing.</p>
                      <button className="btn secondary" onClick={() => setModal('task')}>
                        + Add Task
                      </button>
                    </div>
                  ) : (
                    <div className="priority-list">
                      {tasks
                        .filter((t) => t.status !== 'completed')
                        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                        .slice(0, 4)
                        .map((t) => (
                          <div className="priority-row" key={t._id}>
                            <div className="priority-mark" />
                            <div className="priority-main">
                              <strong>{t.title}</strong>
                              <span>
                                {t.subject?.name || 'General'} · Due{' '}
                                {new Date(t.deadline).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="priority-score">
                              {Math.round((t.priority || 0) * 100)}
                              <small>score</small>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Quick Actions */}
              <section className="panel quick-panel">
                <div className="panel-head">
                  <div>
                    <span className="eyebrow">QUICK ACTIONS</span>
                    <h3>Prepare Your Schedule</h3>
                  </div>
                </div>

                <div className="quick-grid">
                  <button className="quick-action" onClick={() => setModal('task')}>
                    <div className="quick-icon">
                      <Plus size={19} />
                    </div>
                    <div>
                      <strong>Add a Task</strong>
                      <span>Capture topics, assignments & exams</span>
                    </div>
                    <ArrowUpRight className="quick-arrow" size={16} />
                  </button>

                  <button
                    className="quick-action"
                    onClick={() => setPage('Availability')}
                  >
                    <div className="quick-icon">
                      <Clock3 size={19} />
                    </div>
                    <div>
                      <strong>Set Availability</strong>
                      <span>Reserve blocks for focused work</span>
                    </div>
                    <ArrowUpRight className="quick-arrow" size={16} />
                  </button>

                  <button className="quick-action" onClick={() => generate(false)}>
                    <div className="quick-icon">
                      <RefreshCw size={19} />
                    </div>
                    <div>
                      <strong>Generate Plan</strong>
                      <span>Auto-slot tasks into study calendar</span>
                    </div>
                    <ArrowUpRight className="quick-arrow" size={16} />
                  </button>

                  <button className="quick-action" onClick={() => setModal('subject')}>
                    <div className="quick-icon">
                      <BookOpen size={19} />
                    </div>
                    <div>
                      <strong>Add Subject</strong>
                      <span>Organize your syllabus with colors</span>
                    </div>
                    <ArrowUpRight className="quick-arrow" size={16} />
                  </button>

                  <button
                    className="quick-action"
                    onClick={() => setSyllabusModal({ isOpen: true, subject: null, syllabus: null })}
                  >
                    <div className="quick-icon">
                      <Sparkles size={19} />
                    </div>
                    <div>
                      <strong>Analyze Syllabus</strong>
                      <span>Extract & summarize topics by unit</span>
                    </div>
                    <ArrowUpRight className="quick-arrow" size={16} />
                  </button>
                </div>
              </section>
            </>
          )}

          {/* PAGE: SCHEDULE / CALENDAR */}
          {page === 'Schedule' && (
            <CalendarView
              schedule={schedule}
              subjects={subjects}
              onAction={sessionAction}
              onGenerate={generate}
              onOpenTimer={(session) => setActiveTimerSession(session)}
              onSetAvailability={() => setPage('Availability')}
              onAddTask={() => setModal('task')}
              busy={busy}
            />
          )}

          {/* PAGE: MY TASKS */}
          {page === 'My tasks' && (
            <TasksView
              tasks={tasks}
              subjects={subjects}
              onAddTask={() => setModal('task')}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
            />
          )}

          {/* PAGE: AVAILABILITY */}
          {page === 'Availability' && (
            <AvailabilityView
              availability={availability}
              onOpenModal={() => setModal('availability')}
              onDeleteAvailability={deleteAvailability}
              onGenerateSchedule={() => generate(false)}
              busy={busy}
            />
          )}

          {/* PAGE: SUBJECTS */}
          {page === 'Subjects' && (
            <SubjectsView
              subjects={subjects}
              tasks={tasks}
              syllabi={syllabi}
              onOpenAddModal={() => setModal('subject')}
              onOpenSyllabusModal={(sub, syl) =>
                setSyllabusModal({ isOpen: true, subject: sub, syllabus: syl })
              }
              onDeleteSubject={deleteSubject}
              onSelectSubjectFilter={(subId) => {
                setPage('My tasks');
              }}
              onAddTaskForSubject={(subId) => {
                setTaskForm((f) => ({ ...f, subject: subId }));
                setModal('task');
              }}
            />
          )}

          {/* PAGE: INSIGHTS */}
          {page === 'Insights' && <InsightsView analytics={analytics} />}
        </div>
      </main>

      {/* Floating Active Study Companion Timer */}
      {activeTimerSession && (
        <StudyTimer
          activeSession={activeTimerSession}
          subjects={subjects}
          onClose={() => setActiveTimerSession(null)}
          onCompleteSession={(sessionId, actualMinutes) => {
            sessionAction(sessionId, 'complete', { actualMinutes });
          }}
        />
      )}

      {/* Syllabus Modal */}
      {syllabusModal.isOpen && (
        <SyllabusModal
          subject={syllabusModal.subject}
          existingSyllabus={syllabusModal.syllabus}
          subjects={subjects}
          onClose={() => setSyllabusModal({ isOpen: false, subject: null, syllabus: null })}
          onSaveSyllabus={saveSyllabus}
          onDeleteSyllabus={deleteSyllabus}
          onCreateTasksFromSyllabus={createTasksFromSyllabus}
          busy={busy}
        />
      )}

      {/* MODAL: ADD TASK */}
      {modal === 'task' && (
        <Modal title="Add a Study Task" onClose={() => setModal('')}>
          <form className="form-stack" onSubmit={addTask}>
            <div className="form-row">
              <label>
                Subject
                <select
                  required
                  value={taskForm.subject}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, subject: e.target.value })
                  }
                >
                  <option value="">Choose subject</option>
                  {subjects.map((s) => (
                    <option value={s._id} key={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Task type
                <select
                  value={taskForm.type}
                  onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
                >
                  {['topic', 'assignment', 'exam', 'project', 'revision'].map((x) => (
                    <option key={x} value={x}>
                      {x[0].toUpperCase() + x.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {subjects.length === 0 && (
              <p className="field-hint">
                You have not added any subjects yet.{' '}
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => setModal('subject')}
                >
                  Create a subject first
                </button>
              </p>
            )}

            {/* Syllabus Topic Selector Dropdown */}
            {(() => {
              const activeSyllabus = syllabi.find(
                (s) => s.subject?._id === taskForm.subject || s.subject === taskForm.subject
              );

              if (activeSyllabus && activeSyllabus.units?.length > 0) {
                return (
                  <div className="syllabus-topic-picker-box">
                    <div className="topic-picker-header">
                      <span className="topic-picker-label">
                        <Sparkles size={13} /> Pick from Syllabus Topics ({activeSyllabus.totalTopics || 0} topics available)
                      </span>
                      <span className="topic-picker-hint">Choosing a topic auto-fills title & details</span>
                    </div>

                    <select
                      className="syllabus-topic-select"
                      defaultValue=""
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        if (!selectedValue) return;
                        for (const u of activeSyllabus.units) {
                          if (u.topics?.includes(selectedValue)) {
                            setTaskForm((prev) => ({
                              ...prev,
                              title: selectedValue,
                              notes: `Unit ${u.unitNumber}: ${u.title}${u.keyTerms?.length ? ` · Key terms: ${u.keyTerms.join(', ')}` : ''}`,
                              difficulty: u.difficulty === 'Hard' ? 5 : u.difficulty === 'Easy' ? 2 : 3,
                              estimatedMinutes: Math.min(180, Math.max(30, Math.round((u.estimatedHours * 60) / (u.topics.length || 1))))
                            }));
                            break;
                          }
                        }
                      }}
                    >
                      <option value="">-- Choose a topic from {activeSyllabus.title || 'Course Syllabus'} --</option>
                      {activeSyllabus.units.map((u) => (
                        <optgroup
                          key={u.unitNumber}
                          label={`Unit ${u.unitNumber}: ${u.title} (~${u.estimatedHours}h · ${u.difficulty})`}
                        >
                          {u.topics?.map((t, idx) => (
                            <option key={idx} value={t}>
                              • {t}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                );
              }

              if (taskForm.subject) {
                return (
                  <div className="no-syllabus-prompt">
                    <FileText size={13} />
                    <span>No syllabus attached yet.</span>
                    <button
                      type="button"
                      className="inline-link"
                      onClick={() => {
                        const s = subjects.find((x) => x._id === taskForm.subject);
                        setSyllabusModal({ isOpen: true, subject: s, syllabus: null });
                      }}
                    >
                      + Add Syllabus Now
                    </button>
                    <span>to enable 1-click topic dropdown, or type title manually below:</span>
                  </div>
                );
              }

              return null;
            })()}

            <label>
              Task title {taskForm.title && <span className="title-edit-hint">(Selected or editable)</span>}
              <input
                required
                maxLength="180"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="e.g. Implement Dijkstra's Algorithm or pick from syllabus above"
              />
            </label>

            <div className="form-row">
              <label>
                Deadline
                <input
                  type="datetime-local"
                  required
                  value={taskForm.deadline}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, deadline: e.target.value })
                  }
                />
              </label>

              <label>
                Estimated minutes
                <input
                  type="number"
                  min="15"
                  max="10000"
                  step="15"
                  required
                  value={taskForm.estimatedMinutes}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, estimatedMinutes: e.target.value })
                  }
                />
              </label>
            </div>

            <div className="form-row">
              <label className="range-field">
                <span>
                  Importance <strong>{taskForm.importance} / 5</strong>
                </span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={taskForm.importance}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, importance: Number(e.target.value) })
                  }
                />
                <span className="range-ends">
                  <small>Low</small>
                  <small>Critical</small>
                </span>
              </label>

              <label className="range-field">
                <span>
                  Difficulty <strong>{taskForm.difficulty} / 5</strong>
                </span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={taskForm.difficulty}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, difficulty: Number(e.target.value) })
                  }
                />
                <span className="range-ends">
                  <small>Easy</small>
                  <small>Complex</small>
                </span>
              </label>
            </div>

            <label className="range-field">
              <span>
                Confidence level <strong>{taskForm.confidence} / 5</strong>
              </span>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={taskForm.confidence}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, confidence: Number(e.target.value) })
                }
              />
              <span className="range-ends">
                <small>Need practice (higher priority)</small>
                <small>Mastered</small>
              </span>
            </label>

            <label>
              Notes (optional)
              <textarea
                rows="2"
                maxLength="1000"
                value={taskForm.notes}
                onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                placeholder="Key chapters, formula sheets, or references"
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setModal('')}
              >
                Cancel
              </button>
              <button
                className="btn primary"
                disabled={busy || !subjects.length}
              >
                {busy ? 'Saving…' : 'Save Task'}{' '}
                <ArrowUpRight size={15} />
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: ADD SUBJECT */}
      {modal === 'subject' && (
        <Modal title="Create New Subject" onClose={() => setModal('')}>
          <form className="form-stack" onSubmit={addSubject}>
            <label>
              Subject name
              <input
                required
                maxLength="100"
                value={subjectForm.name}
                onChange={(e) =>
                  setSubjectForm({ ...subjectForm, name: e.target.value })
                }
                placeholder="e.g. Distributed Systems"
              />
            </label>

            <label>
              Semester or tag (optional)
              <input
                maxLength="50"
                value={subjectForm.semester}
                onChange={(e) =>
                  setSubjectForm({ ...subjectForm, semester: e.target.value })
                }
                placeholder="e.g. Semester 6, Core, Elective"
              />
            </label>

            <div className="color-picker-wrap">
              <span className="color-label">Theme Color</span>
              <div className="color-options-row">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    className={`color-choice-btn ${
                      subjectForm.color === c.hex ? 'selected' : ''
                    }`}
                    style={{ background: c.hex }}
                    onClick={() =>
                      setSubjectForm({ ...subjectForm, color: c.hex })
                    }
                    title={c.name}
                  >
                    {subjectForm.color === c.hex && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Syllabus Input */}
            <div className="optional-syllabus-box">
              <div className="optional-syllabus-header">
                <div className="opt-title">
                  <FileText size={15} />
                  <span>Course Syllabus (Optional)</span>
                </div>
                <button
                  type="button"
                  className="opt-toggle-btn"
                  onClick={() => setShowSyllabusInput(!showSyllabusInput)}
                >
                  {showSyllabusInput ? '− Hide (I will add later)' : '+ Paste Syllabus Now'}
                </button>
              </div>

              {showSyllabusInput ? (
                <div className="optional-syllabus-content">
                  <p className="field-hint">
                    Upload a syllabus document (PDF, Word .docx, Markdown, Text) or paste below to auto-extract topics.
                  </p>

                  {/* Multi-Format Document Uploader */}
                  <div className="mini-doc-uploader">
                    <input
                      type="file"
                      id="opt-subject-doc-file"
                      accept=".pdf,.docx,.doc,.txt,.md,.markdown,.csv,.json"
                      onChange={handleSubjectDocUpload}
                      style={{ display: 'none' }}
                    />
                    {subjectDocExtracting ? (
                      <div className="mini-doc-loading">
                        <Loader2 className="spinner" size={16} />
                        <span>Extracting text from document…</span>
                      </div>
                    ) : subjectDocMeta ? (
                      <div className="mini-doc-chip">
                        <FileCheck size={16} className="text-green" />
                        <div className="mini-doc-meta">
                          <strong>{subjectDocMeta.fileName}</strong>
                          <span>
                            {subjectDocMeta.detectedType}
                            {subjectDocMeta.pages ? ` · ${subjectDocMeta.pages} pages` : ''}
                            {subjectDocMeta.totalUnits ? ` · ${subjectDocMeta.totalUnits} Units` : ''}
                            {subjectDocMeta.totalTopics ? ` (${subjectDocMeta.totalTopics} topics)` : ''}
                          </span>
                        </div>
                        <label htmlFor="opt-subject-doc-file" className="btn secondary tiny-btn">
                          Change
                        </label>
                        <button
                          type="button"
                          className="cal-icon-btn danger"
                          title="Remove attached document"
                          onClick={() => {
                            setSubjectForm((f) => ({ ...f, syllabusText: '', syllabusFileName: '' }));
                            setSubjectDocMeta(null);
                          }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="opt-subject-doc-file" className="mini-doc-btn">
                        <Upload size={14} />
                        <span>Upload Document (.pdf, .docx, .txt, .md)</span>
                      </label>
                    )}
                  </div>

                  {subjectDocError && (
                    <div className="error-msg mini-err">
                      <AlertCircle size={13} />
                      <span>{subjectDocError}</span>
                    </div>
                  )}

                  <div className="sample-presets-mini">
                    <span className="sample-label-mini">Or sample:</span>
                    <button
                      type="button"
                      className="sample-btn"
                      onClick={() => {
                        setSubjectForm((f) => ({ ...f, syllabusText: SAMPLE_DSA_SYLLABUS, syllabusFileName: 'sample_dsa.txt' }));
                        setSubjectDocMeta({ fileName: 'sample_dsa.txt', detectedType: 'Sample Syllabus', totalUnits: 5, totalTopics: 26 });
                      }}
                    >
                      Sample DSA
                    </button>
                    <button
                      type="button"
                      className="sample-btn"
                      onClick={() => {
                        setSubjectForm((f) => ({ ...f, syllabusText: SAMPLE_DBMS_SYLLABUS, syllabusFileName: 'sample_dbms.txt' }));
                        setSubjectDocMeta({ fileName: 'sample_dbms.txt', detectedType: 'Sample Syllabus', totalUnits: 5, totalTopics: 24 });
                      }}
                    >
                      Sample DBMS
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={subjectForm.syllabusText || ''}
                    onChange={(e) => setSubjectForm({ ...subjectForm, syllabusText: e.target.value })}
                    placeholder="Document text appears here automatically... Or paste syllabus manually (Unit 1: ..., Unit 2: ...)."
                  />
                </div>
              ) : (
                <span className="opt-hint-muted">
                  No syllabus? No problem! You can add it later at any time from the Subjects page.
                </span>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setModal('')}
              >
                Cancel
              </button>
              <button className="btn primary" disabled={busy}>
                {busy ? 'Saving…' : 'Create Subject'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: ADD AVAILABILITY */}
      {modal === 'availability' && (
        <Modal title="Add Study Window" onClose={() => setModal('')}>
          <form className="form-stack" onSubmit={addAvailability}>
            <label>
              Label
              <input
                maxLength="100"
                value={availForm.label}
                onChange={(e) =>
                  setAvailForm({ ...availForm, label: e.target.value })
                }
                placeholder="e.g. Evening Lab Prep"
              />
            </label>

            <div className="form-row">
              <label>
                Start date & time
                <input
                  type="datetime-local"
                  required
                  value={availForm.start}
                  onChange={(e) =>
                    setAvailForm({ ...availForm, start: e.target.value })
                  }
                />
              </label>

              <label>
                End date & time
                <input
                  type="datetime-local"
                  required
                  value={availForm.end}
                  onChange={(e) =>
                    setAvailForm({ ...availForm, end: e.target.value })
                  }
                />
              </label>
            </div>

            <p className="field-hint">
              Sessions will only be scheduled inside your available blocks.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setModal('')}
              >
                Cancel
              </button>
              <button className="btn primary" disabled={busy}>
                {busy ? 'Saving…' : 'Save Window'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={17} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
