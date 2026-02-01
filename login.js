// Initialize storage
if (!localStorage.users) localStorage.users = JSON.stringify([]);

// Handle form submit
document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-name').value;
    const password = document.getElementById('login-password').value;
    
    const users = JSON.parse(localStorage.users);
    const user = users.find(u => u.username === username);
    
    if (user) {
        // Login
        if (user.password === password) {
            alert('Login successful! Welcome ' + username);
            sessionStorage.currentUser = username;
            window.location.href = 'homepage.html';
        } else {
            alert('Wrong password');
        }
    } else {
        // Signup
        if (username && password) {
            users.push({username, password});
            localStorage.users = JSON.stringify(users);
            alert('Account created! Welcome ' + username);
            sessionStorage.currentUser = username;
            window.location.href = 'homepage.html';
        }
    }
});