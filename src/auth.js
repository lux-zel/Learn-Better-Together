// Get Firebase auth instance
const auth = firebase.auth();

// Show message function
function showMessage(text, isError = false) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.style.display = 'block';
    messageDiv.style.backgroundColor = isError ? '#f8d7da' : '#d4edda';
    messageDiv.style.color = isError ? '#721c24' : '#155724';
    messageDiv.style.border = isError ? '1px solid #f5c6cb' : '1px solid #c3e6cb';
    messageDiv.style.padding = '10px';
    messageDiv.style.margin = '10px 0';
    messageDiv.style.borderRadius = '4px';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Check if user is already logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('user-container').style.display = 'block';
        
        // Display user info
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('display-email').textContent = user.email;
        document.getElementById('email-verified').textContent = user.emailVerified ? '✅ Yes' : '❌ No';
        
    } else {
        // User is signed out
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('user-container').style.display = 'none';
    }
});

// Sign up function
async function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showMessage('Please enter both email and password', true);
        return;
    }
    
    if (password.length < 8) {
        showMessage('Password must be at least 8 characters', true);
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Send email verification
        await userCredential.user.sendEmailVerification();
        
        showMessage('Account created! Please check your email for verification link.');
        
        // Clear form
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        
    } catch (error) {
        let errorMessage = 'Error: ';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Email already in use. Try logging in instead.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak.';
                break;
            default:
                errorMessage += error.message;
        }
        showMessage(errorMessage, true);
    }
}

// Sign in function
async function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showMessage('Please enter both email and password', true);
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showMessage('Login successful!');
        
        // Clear form
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        
    } catch (error) {
        let errorMessage = 'Error: ';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email. Sign up first.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            default:
                errorMessage += error.message;
        }
        showMessage(errorMessage, true);
    }
}

// Sign out function
async function signOut() {
    try {
        await auth.signOut();
        showMessage('Logged out successfully');
    } catch (error) {
        showMessage('Error logging out: ' + error.message, true);
    }
}

// Reset password function
async function resetPassword() {
    const email = document.getElementById('email').value || prompt('Enter your email address:');
    
    if (!email) {
        showMessage('Please enter your email address', true);
        return;
    }
    
    try {
        await auth.sendPasswordResetEmail(email);
        showMessage('Password reset email sent! Check your inbox.');
    } catch (error) {
        showMessage('Error: ' + error.message, true);
    }
}

// Enter key support for password field
document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        signIn();
    }
});