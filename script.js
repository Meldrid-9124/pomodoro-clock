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

// elements
const clockDisplay = document.getElementById('clock');
const sessionLabel = document.getElementById('session-label');
const sessionCounter = document.getElementById('session-counter');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const modeButtons = document.querySelectorAll('.mode-btn');

// functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    // padStart ensures that the minutes and seconds are in the XX format
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateDisplay() {
    clockDisplay.textContent = formatTime(state.timeLeft);
    document.title = `${formatTime(state.timeLeft)} — TopoFocus`;
}

function startTimer() {
    if (state.isRunning) return;

    state.isRunning = true;
    startBtn.hidden = true;
    pauseBtn.hidden = false;

    state.timerId = setInterval(() => {
        if (state.timeLeft > 0) {
            state.timeLeft--;
            updateDisplay();
            // TODO: Pass completion ratio (1 - state.timeLeft / state.duration) to canvas renderer
        } else {
            handleTimerComplete();
        }
    }, 1000);
}

function pauseTimer() {
    if (!state.isRunning) return;

    clearInterval(state.timerId);
    state.timerId = null;
    state.isRunning = false;

    pauseBtn.hidden = true;
    startBtn.hidden = false;
    startBtn.textContent = 'Resume';
}

function resetTimer() {
    pauseTimer();
    state.timeLeft = state.duration;
    startBtn.textContent = 'Start';
    updateDisplay();
}

function handleTimerComplete() {
    pauseTimer();
    startBtn.textContent = 'Start';

    // Play alert sound or trigger vibration
    if ('vibrate' in navigator)
        navigator.vibrate([200, 100, 200]);

    if (state.currentMode === 'pomodoro') {
        state.sessionCount++;
        if (state.sessionCount > state.maxSessions) {
            state.sessionCount = 1;
        }
        sessionCounter.textContent = `Session ${state.sessionCount} / ${state.maxSessions}`;
        alert('Focus session completed! Time for a break.');
    } else {
        alert('Break completed! Ready to lock back in?');
    }
}

function switchMode(button) {
    modeButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    // the dataset here is used to access the data-time attribute
    // of the button from html file
    const minutes = parseInt(button.dataset.time, 10);
    state.duration = minutes * 60;
    state.currentMode = button.textContent.toLowerCase().replace(' ', '-');
    sessionLabel.textContent = button.textContent;
    resetTimer();
}

function toggleTheme() {
    const isNight = document.body.classList.toggle('night-theme');
    document.body.classList.toggle('day-theme', !isNight);
    themeToggleBtn.textContent = isNight ? '☀️' : '🌙';
    localStorage.setItem('topofocus_theme', isNight ? 'night' : 'day');
}

function initTheme() {
    const savedTheme = localStorage.getItem('topofocus_theme');
    if (savedTheme === 'night') {
        document.body.classList.add('night-theme');
        document.body.classList.remove('day-theme');
        themeToggleBtn.textContent = '☀️';
    }
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
themeToggleBtn.addEventListener('click', toggleTheme);

modeButtons.forEach(button => {
    button.addEventListener('click', () => switchMode(button));
});

initTheme();
updateDisplay();