// Entry point moved out of HTML to satisfy CSP (no inline scripts)
import { initializeFirebase } from './firebase-config.js'
import { signUp, signIn, signOut, resetPassword } from './auth.js'

// Initialize Firebase
initializeFirebase();

// Event listeners for buttons
const waitForElement = (id) => {
    return new Promise((resolve) => {
        const el = document.getElementById(id);
        if (el) return resolve(el);
        const obs = new MutationObserver(() => {
            const e = document.getElementById(id);
            if (e) {
                obs.disconnect();
                resolve(e);
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });
    });
}

Promise.all([
    waitForElement('signUpBtn'),
    waitForElement('signInBtn'),
    waitForElement('signOutBtn'),
    waitForElement('resetPasswordLink')
]).then(([signUpBtn, signInBtn, signOutBtn, resetLink]) => {
    signUpBtn.addEventListener('click', signUp);
    signInBtn.addEventListener('click', signIn);
    signOutBtn.addEventListener('click', signOut);
    resetLink.addEventListener('click', (e) => {
        e.preventDefault();
        resetPassword();
    });
});
