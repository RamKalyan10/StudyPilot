import { useState } from 'react';
import {
  Clock3,
  CalendarDays,
  Plus,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Check
} from 'lucide-react';

export default function SmartStudyGuide({
  availability = [],
  tasks = [],
  schedule = null,
  upcomingSessions = [],
  onOpenAvailabilityModal,
  onOpenTaskModal,
  onOpenSyllabusModal,
  onGenerateSchedule,
  onNavigate,
  onAddPresetAvailability,
  busy = false
}) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('studypilot_guide_collapsed') === 'true';
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('studypilot_guide_collapsed', String(next));
      return next;
    });
  };

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const hasAvailability = availability.length > 0;
  const hasTasks = pendingTasks.length > 0;
  const hasSchedule = upcomingSessions.length > 0;

  // Determine current active step (1, 2, 3, or completed 4)
  let currentStep = 1;
  if (!hasAvailability) {
    currentStep = 1;
  } else if (!hasTasks) {
    currentStep = 2;
  } else if (!hasSchedule) {
    currentStep = 3;
  } else {
    currentStep = 4;
  }

  // Quick preset generator helpers
  const handleQuickPreset = (presetType) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let label = 'Study Window';

    if (presetType === 'today_evening') {
      start.setHours(16, 0, 0, 0); // 4:00 PM
      if (now.getHours() >= 16) {
        start = new Date(now.getTime() + 15 * 60000); // 15 mins from now
      }
      end = new Date(start.getTime() + 3 * 3600000); // 3 hours
      label = 'Today Evening Focus (4 PM – 7 PM)';
    } else if (presetType === 'tonight') {
      start.setHours(19, 0, 0, 0); // 7:00 PM
      if (now.getHours() >= 19) {
        start = new Date(now.getTime() + 15 * 60000);
      }
      end = new Date(start.getTime() + 3 * 3600000); // 3 hours
      label = 'Night Focus Session (7 PM – 10 PM)';
    } else if (presetType === 'tomorrow_morning') {
      start.setDate(start.getDate() + 1);
      start.setHours(9, 0, 0, 0); // 9:00 AM
      end = new Date(start.getTime() + 3 * 3600000); // 3 hours
      label = 'Tomorrow Morning Window (9 AM – 12 PM)';
    }

    if (onAddPresetAvailability) {
      onAddPresetAvailability({ start, end, label });
    } else if (onOpenAvailabilityModal) {
      onOpenAvailabilityModal();
    }
  };

  return (
    <div className={`smart-guide-card ${currentStep === 4 ? 'is-complete' : 'is-active'}`}>
      {/* Top Workflow Stepper Header */}
      <div className="smart-guide-header">
        <div className="smart-guide-title-wrap">
          <div className="smart-guide-icon-badge">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="smart-guide-kicker">
              {currentStep === 4 ? 'STUDY WORKFLOW ACTIVE' : 'SMART ONBOARDING ASSISTANT'}
            </div>
            <h3 className="smart-guide-title">
              {currentStep === 1 && 'Suggestion: Set Your Available Time Window First'}
              {currentStep === 2 && 'Next Suggestion: Add Your Study Tasks'}
              {currentStep === 3 && 'Final Step: Generate Your Visual Study Schedule'}
              {currentStep === 4 && 'Your Schedule Is Ready & Synced to Your Windows'}
            </h3>
          </div>
        </div>

        <div className="smart-guide-header-actions">
          {/* Workflow Step Indicator Badges */}
          <div className="smart-steps-pills">
            <div
              className={`step-pill ${hasAvailability ? 'done' : currentStep === 1 ? 'current' : ''}`}
              onClick={() => onNavigate && onNavigate('Availability')}
              title="Step 1: Set Available Windows"
            >
              <span className="step-num">{hasAvailability ? <Check size={11} /> : '1'}</span>
              <span className="step-text">Available Windows</span>
              {hasAvailability && <span className="step-count">({availability.length})</span>}
            </div>

            <div className="step-connector" />

            <div
              className={`step-pill ${hasTasks ? 'done' : currentStep === 2 ? 'current' : ''}`}
              onClick={() => onNavigate && onNavigate('My tasks')}
              title="Step 2: Add Study Tasks"
            >
              <span className="step-num">{hasTasks ? <Check size={11} /> : '2'}</span>
              <span className="step-text">Tasks</span>
              {hasTasks && <span className="step-count">({pendingTasks.length})</span>}
            </div>

            <div className="step-connector" />

            <div
              className={`step-pill ${hasSchedule ? 'done' : currentStep === 3 ? 'current' : ''}`}
              onClick={() => onNavigate && onNavigate('Schedule')}
              title="Step 3: Visual Schedule"
            >
              <span className="step-num">{hasSchedule ? <Check size={11} /> : '3'}</span>
              <span className="step-text">Schedule</span>
              {hasSchedule && <span className="step-count">({upcomingSessions.length})</span>}
            </div>
          </div>

          <button
            className="smart-guide-toggle-btn"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand suggestion guide' : 'Minimize suggestion guide'}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Main Guidance Body (Collapsible) */}
      {!collapsed && (
        <div className="smart-guide-body">
          {/* STEP 1: Set Availability */}
          {currentStep === 1 && (
            <div className="smart-guide-content step-1">
              <div className="guide-copy">
                <p>
                  StudyPilot places study sessions <strong>only inside your available time windows</strong>.
                  Before adding tasks, tell us when you have free hours to study (e.g. today after classes or evenings).
                </p>
                <div className="guide-quick-presets">
                  <span className="presets-label">1-Click Quick Add:</span>
                  <button
                    className="preset-btn"
                    onClick={() => handleQuickPreset('today_evening')}
                    disabled={busy}
                  >
                    <Clock3 size={12} /> Today 4:00 PM – 7:00 PM
                  </button>
                  <button
                    className="preset-btn"
                    onClick={() => handleQuickPreset('tonight')}
                    disabled={busy}
                  >
                    <Clock3 size={12} /> Tonight 7:00 PM – 10:00 PM
                  </button>
                  <button
                    className="preset-btn"
                    onClick={() => handleQuickPreset('tomorrow_morning')}
                    disabled={busy}
                  >
                    <Clock3 size={12} /> Tomorrow 9:00 AM – 12:00 PM
                  </button>
                </div>
              </div>

              <div className="guide-actions">
                <button
                  className="btn primary guide-cta"
                  onClick={onOpenAvailabilityModal}
                  disabled={busy}
                >
                  <Plus size={16} /> Add Custom Study Window
                </button>
                <span className="guide-hint">
                  Step 2 (adding tasks) unlocks right after adding your window.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Add Tasks */}
          {currentStep === 2 && (
            <div className="smart-guide-content step-2">
              <div className="guide-copy">
                <div className="guide-status-success">
                  <Check size={14} />
                  <span>
                    <strong>{availability.length} study window{availability.length > 1 ? 's' : ''} configured!</strong>
                  </span>
                </div>
                <p>
                  Now add the study tasks, topics, or assignments you want to complete.
                  StudyPilot will automatically calculate urgency and slot them into your available windows.
                </p>
              </div>

              <div className="guide-actions">
                <button
                  className="btn primary guide-cta"
                  onClick={onOpenTaskModal}
                  disabled={busy}
                >
                  <Plus size={16} /> Add Study Task
                </button>
                {onOpenSyllabusModal && (
                  <button
                    className="btn secondary"
                    onClick={onOpenSyllabusModal}
                    disabled={busy}
                  >
                    <FileText size={15} /> Auto-Extract from Syllabus
                  </button>
                )}
                <button
                  className="inline-link-btn"
                  onClick={() => onNavigate && onNavigate('Availability')}
                >
                  Manage Availability Windows
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Generate Schedule */}
          {currentStep === 3 && (
            <div className="smart-guide-content step-3">
              <div className="guide-copy">
                <div className="guide-status-success">
                  <Check size={14} />
                  <span>
                    <strong>
                      {availability.length} window{availability.length > 1 ? 's' : ''} and{' '}
                      {pendingTasks.length} task{pendingTasks.length > 1 ? 's' : ''} ready!
                    </strong>
                  </span>
                </div>
                <p>
                  Click below to generate your personalized timetable. Each session will be placed directly
                  in your available window on the correct day and time.
                </p>
              </div>

              <div className="guide-actions">
                <button
                  className="btn primary guide-cta"
                  onClick={onGenerateSchedule}
                  disabled={busy}
                >
                  <RefreshCw size={15} className={busy ? 'spin' : ''} />
                  {busy ? 'Generating Schedule…' : 'Generate Visual Schedule'}
                </button>
                <button
                  className="btn secondary"
                  onClick={onOpenTaskModal}
                >
                  <Plus size={15} /> Add More Tasks
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Completed / Active Schedule */}
          {currentStep === 4 && (
            <div className="smart-guide-content step-complete">
              <div className="guide-copy">
                <p>
                  Your study plan is active with <strong>{upcomingSessions.length} upcoming sessions</strong> placed
                  inside your <strong>{availability.length} available focus windows</strong>.
                </p>
              </div>

              <div className="guide-actions-row">
                <button
                  className="btn secondary small-btn"
                  onClick={onOpenAvailabilityModal}
                >
                  <Clock3 size={13} /> + Add Window
                </button>
                <button
                  className="btn secondary small-btn"
                  onClick={onOpenTaskModal}
                >
                  <Plus size={13} /> + Add Task
                </button>
                <button
                  className="btn primary small-btn"
                  onClick={() => onNavigate && onNavigate('Schedule')}
                >
                  <CalendarDays size={13} /> View Calendar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
