import { auth } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000;
const MAX_ATTEMPTS = 5;

function checkRateLimit(key) {
    const now = Date.now();
    const attempts = rateLimitMap.get(key) || [];
    
    const recentAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (recentAttempts.length >= MAX_ATTEMPTS) {
        return false;
    }
    
    recentAttempts.push(now);
    rateLimitMap.set(key, recentAttempts);
    return true;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}

function validatePassword(password) {
    return password && password.length >= 8;
}

function sanitizeErrorMessage(error) {
    const errorMap = {
        'auth/email-already-in-use': 'Email already in use. Try logging in instead.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/weak-password': 'Password is too weak.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/operation-not-allowed': 'This operation is not allowed.',
        'auth/invalid-credential': 'Invalid email or password.'
    };
    
    return errorMap[error.code] || 'An error occurred. Please try again.';
}

export function showMessage(text, isError = false) {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;
    
    messageDiv.textContent = text;
    messageDiv.style.display = 'block';
    messageDiv.style.backgroundColor = isError ? '#f8d7da' : '#d4edda';
    messageDiv.style.color = isError ? '#721c24' : '#155724';
    messageDiv.style.border = isError ? '1px solid #f5c6cb' : '1px solid #c3e6cb';
    messageDiv.style.padding = '10px';
    messageDiv.style.margin = '10px 0';
    messageDiv.style.borderRadius = '4px';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        const authContainer = document.getElementById('auth-container');
        const userContainer = document.getElementById('user-container');
        
        if (authContainer) authContainer.style.display = 'none';
        if (userContainer) userContainer.style.display = 'block';
        
        const userEmail = document.getElementById('user-email');
        const displayEmail = document.getElementById('display-email');
        const emailVerified = document.getElementById('email-verified');
        
        if (userEmail) userEmail.textContent = sanitizeEmail(user.email);
        if (displayEmail) displayEmail.textContent = sanitizeEmail(user.email);
        if (emailVerified) emailVerified.textContent = user.emailVerified ? 'Yes' : 'No';
    } else {
        const authContainer = document.getElementById('auth-container');
        const userContainer = document.getElementById('user-container');
        
        if (authContainer) authContainer.style.display = 'block';
        if (userContainer) userContainer.style.display = 'none';
    }
});

function sanitizeEmail(email) {
    const [localPart, domain] = email.split('@');
    const hidden = localPart.slice(0, 2) + '*'.repeat(Math.max(0, localPart.length - 2));
    return `${hidden}@${domain}`;
}

export async function signUp() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showMessage('Please enter both email and password', true);
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('Please enter a valid email address', true);
        return;
    }
    
    if (!validatePassword(password)) {
        showMessage('Password must be at least 8 characters', true);
        return;
    }
    
    if (!checkRateLimit(`signup_${email}`)) {
        showMessage('Too many signup attempts. Please try again later.', true);
        return;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        await sendEmailVerification(userCredential.user);
        
        showMessage('Account created! Please check your email for verification link.');
        
        emailInput.value = '';
        passwordInput.value = '';
    } catch (error) {
        showMessage(sanitizeErrorMessage(error), true);
    }
}

export async function signIn() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showMessage('Please enter both email and password', true);
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('Please enter a valid email address', true);
        return;
    }
    
    if (!checkRateLimit(`signin_${email}`)) {
        showMessage('Too many login attempts. Please try again later.', true);
        return;
    }
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage('Login successful!');
        emailInput.value = '';
        passwordInput.value = '';
    } catch (error) {
        showMessage(sanitizeErrorMessage(error), true);
    }
}

export async function signOut() {
    try {
        await firebaseSignOut(auth);
        showMessage('Logged out successfully');
    } catch (error) {
        showMessage(sanitizeErrorMessage(error), true);
    }
}

export async function resetPassword() {
    const emailInput = document.getElementById('email');
    let email = emailInput ? emailInput.value.trim() : '';
    
    if (!email) {
        email = prompt('Enter your email address:');
        if (!email) {
            showMessage('Please enter your email address', true);
            return;
        }
    }
    
    if (!validateEmail(email)) {
        showMessage('Please enter a valid email address', true);
        return;
    }
    
    if (!checkRateLimit(`reset_${email}`)) {
        showMessage('Too many password reset attempts. Please try again later.', true);
        return;
    }
    
    try {
        await sendPasswordResetEmail(auth, email);
        showMessage('Password reset email sent! Check your inbox.');
    } catch (error) {
        showMessage(sanitizeErrorMessage(error), true);
    }
}

const passwordInput = document.getElementById('password');
if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            signIn();
        }
    });
}