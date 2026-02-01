// Storage keys
const TODAY_KEY = 'stopwatch_today';
const ALL_TIME_KEY = 'stopwatch_alltime';
const SESSIONS_KEY = 'stopwatch_sessions';

// Timer state
let startTime = 0;
let elapsed = 0;
let running = false;
let interval;

// Load data
let todayData = JSON.parse(localStorage.getItem(TODAY_KEY)) || { total: 0, sessions: 0 };
let allTimeData = JSON.parse(localStorage.getItem(ALL_TIME_KEY)) || { total: 0, sessions: 0 };
let sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY)) || [];

function toggle() {
    if (!running) {
        startTime = Date.now() - elapsed;
        interval = setInterval(updateTimer, 1000);
        document.getElementById('control').textContent = 'STOP';
        running = true;
    } else {
        clearInterval(interval);
        running = false;
        document.getElementById('control').textContent = 'START';
    }
}

function updateTimer() {
    elapsed = Date.now() - startTime;
    document.getElementById('timer').textContent = formatTime(elapsed);
}

function formatTime(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function saveSession() {
    if (elapsed < 1000) return; // Don't save sessions < 1 second
    
    const session = {
        duration: elapsed,
        formatted: formatTime(elapsed),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now()
    };
    
    // Add to sessions
    sessions.unshift(session); // Add to beginning
    if (sessions.length > 20) sessions = sessions.slice(0, 20); // Keep last 20
    
    // Update totals
    todayData.total += elapsed;
    todayData.sessions += 1;
    allTimeData.total += elapsed;
    allTimeData.sessions += 1;
    
    // Reset current timer
    elapsed = 0;
    document.getElementById('timer').textContent = '00:00:00';
    if (running) {
        clearInterval(interval);
        running = false;
        document.getElementById('control').textContent = 'START';
    }
    
    // Save and update display
    saveAllData();
    updateDisplay();
}

function saveAllData() {
    localStorage.setItem(TODAY_KEY, JSON.stringify(todayData));
    localStorage.setItem(ALL_TIME_KEY, JSON.stringify(allTimeData));
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function updateDisplay() {
    document.getElementById('todayTotal').textContent = formatTime(todayData.total);
    document.getElementById('todayCount').textContent = todayData.sessions;
    document.getElementById('allTimeTotal').textContent = formatTime(allTimeData.total);
    document.getElementById('totalSessions').textContent = allTimeData.sessions;
    
    // Show history
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = '';
    
    sessions.forEach(session => {
        const div = document.createElement('div');
        div.textContent = `${session.formatted} - ${session.date} ${session.time}`;
        historyDiv.appendChild(div);
    });
    
    if (sessions.length === 0) {
        historyDiv.innerHTML = '<div>No sessions saved yet</div>';
    }
}

function clearAll() {
    if (confirm('Clear ALL data? This cannot be undone.')) {
        todayData = { total: 0, sessions: 0 };
        allTimeData = { total: 0, sessions: 0 };
        sessions = [];
        elapsed = 0;
        saveAllData();
        updateDisplay();
        document.getElementById('timer').textContent = '00:00:00';
        if (running) {
            clearInterval(interval);
            running = false;
            document.getElementById('control').textContent = 'START';
        }
    }
}

// Reset today's data if it's a new day
function checkNewDay() {
    const today = new Date().toDateString();
    const lastSaved = localStorage.getItem('stopwatch_lastdate');
    
    if (lastSaved !== today) {
        localStorage.setItem('stopwatch_lastdate', today);
        todayData = { total: 0, sessions: 0 };
        saveAllData();
    }
}

// Initialize
checkNewDay();
updateDisplay();