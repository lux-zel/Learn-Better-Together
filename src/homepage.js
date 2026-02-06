import { initializeFirebase } from './firebase-config.js'
import { signOut } from './auth.js'

initializeFirebase();

const groupsBtn = document.getElementById('groupsBtn');
const stopwatchBtn = document.getElementById('stopwatchBtn');
const logoutBtn = document.getElementById('logoutBtn');

groupsBtn.addEventListener('click', () => {
    window.location.href = './groups.html';
});

stopwatchBtn.addEventListener('click', () => {
    window.location.href = './public/stopwatch.html';
});

logoutBtn.addEventListener('click', signOut);
