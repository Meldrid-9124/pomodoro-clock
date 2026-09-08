// App states object
const state = {
  duration: 25 * 60, // Default: 25 minutes in seconds
  timeLeft: 25 * 60,
  timerId: null,
  isRunning: false,
  currentMode: 'pomodoro',
  sessionCount: 1,
  // 1 hour 30 minutes
  maxSessions: 4
};

// elements section
const clockDisplay = document.getElementById('clock');
const sessionLabel = document.getElementById('session-label');
const sessionCounter = document.getElementById('session-counter');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const modeButtons = document.querySelectorAll('.mode-btn');

// functions section
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}