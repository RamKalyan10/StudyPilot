import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Maximize2,
  Minimize2,
  Target
} from 'lucide-react';

export default function StudyTimer({
  activeSession,
  onClose,
  onCompleteSession,
  subjects = []
}) {
  const defaultMinutes = activeSession?.plannedMinutes || 25;
  const [totalSeconds, setTotalSeconds] = useState(defaultMinutes * 60);
  const [secondsLeft, setSecondsLeft] = useState(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [completedNotification, setCompletedNotification] = useState(false);

  // Synchronize when activeSession changes
  useEffect(() => {
    if (activeSession) {
      const mins = activeSession.plannedMinutes || 25;
      setTotalSeconds(mins * 60);
      setSecondsLeft(mins * 60);
      setIsRunning(true);
      setCompletedNotification(false);
    }
  }, [activeSession]);

  // Timer interval
  useEffect(() => {
    let interval = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      setCompletedNotification(true);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  if (!activeSession) return null;

  const subject = subjects.find((s) => s.name === activeSession.subjectName);
  const color = subject?.color || '#8b7cff';

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatTime = (m, s) =>
    `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const progressPercent = Math.max(
    0,
    Math.min(100, ((totalSeconds - secondsLeft) / totalSeconds) * 100)
  );

  const elapsedMinutes = Math.max(1, Math.round((totalSeconds - secondsLeft) / 60));

  const handleFinish = () => {
    onCompleteSession(activeSession._id, elapsedMinutes);
    onClose();
  };

  const handleAdd5 = () => {
    setSecondsLeft((s) => s + 300);
    setTotalSeconds((t) => t + 300);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
    setCompletedNotification(false);
  };

  // Minimized Widget Bar
  if (isMinimized) {
    return (
      <aside className="timer-dock-minimized" style={{ '--accent-color': color }} aria-label="Study Timer Mini Player">
        <div className="mini-pulse-dot" />
        <div className="mini-info">
          <strong>{formatTime(minutes, seconds)}</strong>
          <span>{activeSession.title}</span>
        </div>
        <button
          className="timer-ctrl-btn"
          onClick={() => setIsRunning(!isRunning)}
          title={isRunning ? 'Pause' : 'Start'}
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          className="timer-ctrl-btn"
          onClick={() => setIsMinimized(false)}
          title="Expand"
        >
          <Maximize2 size={14} />
        </button>
        <button className="timer-ctrl-btn close" onClick={onClose} title="Dismiss">
          <X size={14} />
        </button>
      </aside>
    );
  }

  // Expanded Floating Modal Card
  return (
    <aside className="timer-overlay-card" style={{ '--accent-color': color }} aria-label="Active Study Companion">
      <div className="timer-card-header">
        <div className="timer-card-tag">
          <Target size={14} />
          <span>Active Study Companion</span>
        </div>
        <div className="timer-header-actions">
          <button
            className="timer-icon-btn"
            onClick={() => setIsMinimized(true)}
            title="Minimize"
          >
            <Minimize2 size={15} />
          </button>
          <button className="timer-icon-btn" onClick={onClose} title="Close">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="timer-card-content">
        <div className="timer-session-info">
          <span className="timer-subject-pill" style={{ borderColor: color, color }}>
            <span className="subject-dot" style={{ background: color }} />
            {activeSession.subjectName || 'Study Session'}
          </span>
          <h3 className="timer-session-title">{activeSession.title}</h3>
        </div>

        {/* Circular / Ring Display */}
        <div className="timer-circle-wrap">
          <svg className="timer-circle-svg" viewBox="0 0 120 120">
            <circle
              className="timer-circle-bg"
              cx="60"
              cy="60"
              r="52"
            />
            <circle
              className="timer-circle-fg"
              cx="60"
              cy="60"
              r="52"
              strokeDasharray="326.7"
              strokeDashoffset={326.7 - (326.7 * progressPercent) / 100}
              style={{ stroke: color }}
            />
          </svg>
          <div className="timer-time-display">
            <span className="timer-digits">{formatTime(minutes, seconds)}</span>
            <span className="timer-status-hint">
              {completedNotification
                ? 'Time is up! Great job!'
                : isRunning
                ? 'Focus mode active'
                : 'Paused'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="timer-progress-bar">
          <div
            className="timer-progress-fill"
            style={{ width: `${progressPercent}%`, background: color }}
          />
        </div>

        {/* Controls */}
        <div className="timer-controls">
          <button className="timer-btn secondary" onClick={handleReset} title="Reset">
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>

          <button
            className={`timer-btn primary main-play ${isRunning ? 'running' : ''}`}
            onClick={() => setIsRunning(!isRunning)}
            style={{ background: isRunning ? '#373854' : color }}
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
          </button>

          <button className="timer-btn secondary" onClick={handleAdd5} title="Add 5 minutes">
            <span>+5m</span>
          </button>
        </div>

        {/* Finish button */}
        <div className="timer-footer">
          <button className="timer-btn complete-btn" onClick={handleFinish}>
            <Check size={16} />
            <span>Finish & Record {elapsedMinutes}m Studied</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
