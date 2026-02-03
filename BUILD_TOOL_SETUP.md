# Option B: Environment Variables with Build Tool + GitHub Pages

This guide shows how to set up a build process so your Firebase keys are kept in environment variables and never exposed in version control.

---

## Overview

Instead of storing Firebase config directly in `firebase-config.js`, you'll:
1. Store keys in `.env` files (git-ignored)
2. Use a build tool (Vite or Webpack) to inject them at build time
3. Deploy the built files to GitHub Pages
4. GitHub Actions automatically rebuilds on push

### Benefits:
- ✅ Keys are never in version control
- ✅ Different keys for development vs production
- ✅ Automated deployment
- ✅ Still works with GitHub Pages

---

## Option B1: Using Vite (Recommended - Easiest)

Vite is modern, fast, and has built-in environment variable support.

### Step 1: Install Vite

```bash
npm install -D vite
```

If you don't have Node.js, download from https://nodejs.org (LTS version)

### Step 2: Create Project Structure

```
studyhelp/
├── index.html
├── groups.html
├── src/
│   ├── firebase-config.js
│   ├── auth.js
│   ├── groups.js
│   ├── stopwatch.js
│   └── styles.css (if you have styles)
├── public/
│   └── stopwatch.html
├── .env
├── .env.production
├── .gitignore
├── vite.config.js
├── package.json
└── dist/ (generated after build)
```

### Step 3: Create `vite.config.js`

```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  define: {
    __VITE_FIREBASE_API_KEY__: JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
    __VITE_FIREBASE_AUTH_DOMAIN__: JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
    __VITE_FIREBASE_PROJECT_ID__: JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID),
    __VITE_FIREBASE_STORAGE_BUCKET__: JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET),
    __VITE_FIREBASE_MESSAGING_SENDER_ID__: JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    __VITE_FIREBASE_APP_ID__: JSON.stringify(process.env.VITE_FIREBASE_APP_ID),
    __VITE_FIREBASE_MEASUREMENT_ID__: JSON.stringify(process.env.VITE_FIREBASE_MEASUREMENT_ID),
  }
})
```

### Step 4: Create `.env` (Local Development)

Create a local `.env` file for development only and DO NOT commit it. Use placeholder values or copy them from Firebase Console.

```
# Local development keys (example placeholders)
VITE_FIREBASE_API_KEY=your_development_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-dev-auth-domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-dev-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-dev-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_dev_sender_id
VITE_FIREBASE_APP_ID=your_dev_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_dev_measurement_id
```

### Step 5: Create `.env.production` (For Production/GitHub Pages)

```
VITE_FIREBASE_API_KEY=your_production_key
VITE_FIREBASE_AUTH_DOMAIN=your_production_auth_domain
VITE_FIREBASE_PROJECT_ID=your_production_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_production_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_production_sender_id
VITE_FIREBASE_APP_ID=your_production_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_production_measurement_id
```

**Note:** You can use the same keys for both if you want, but this setup allows different keys per environment.

### Step 6: Update `.gitignore`

```
# Environment variables
.env
.env.local
.env.*.local

# Build output
/dist
/node_modules

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

### Step 7: Create New `firebase-config.js`

Create in `src/firebase-config.js`:

```javascript
// Firebase Configuration
// Values are injected at build time from environment variables
const firebaseConfig = {
    apiKey: __VITE_FIREBASE_API_KEY__,
    authDomain: __VITE_FIREBASE_AUTH_DOMAIN__,
    projectId: __VITE_FIREBASE_PROJECT_ID__,
    storageBucket: __VITE_FIREBASE_STORAGE_BUCKET__,
    messagingSenderId: __VITE_FIREBASE_MESSAGING_SENDER_ID__,
    appId: __VITE_FIREBASE_APP_ID__,
    measurementId: __VITE_FIREBASE_MEASUREMENT_ID__
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
```

### Step 8: Update `package.json`

```json
{
  "name": "learn-better-together",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

### Step 9: Update HTML Files to Use Build Output

Update `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Security-Policy" 
      content="default-src 'self' https:; 
               script-src 'self' https: https://www.gstatic.com;
               style-src 'self' https:;
               img-src 'self' https: data:;">
    <meta charset="UTF-8">
    <meta name="color-scheme" content="light dark">
    <title>Login or Signup</title>
    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
</head>
<body>

<div style="text-align: center;"><h1>Welcome to Learn-Better-Together!</h1></div>

<br><br><br><br><br>

<center>
    <div id="auth-container" style="
        width: 300px;
        border: 2px solid #5a5a5a;
        padding: 30px;
        margin: 0 auto;
        background: color-scheme;
        ">

        <div>
        <h3>login or sign up</h3>
        </div>

        <!-- Message display -->
        <div id="message" style="display:none; padding:10px; margin:10px 0; border-radius:4px;"></div>

        <!-- Login/Signup Form -->
        <div>
            <input type="email" id="email" placeholder="your@email.com" required style="width: 90%; padding: 8px;">
        </div>

        <br>

        <div>
            <input type="password" id="password" required minlength="8" placeholder="password (min 8 characters)" style="width: 90%; padding: 8px;">
        </div>

        <br>

        <div>
            <button id="signUpBtn" style="padding: 8px 20px; margin-right: 10px;">Sign Up</button>
            <button id="signInBtn" style="padding: 8px 20px;">Login</button>
        </div>
        
        <div style="margin-top: 15px; font-size: 14px;">
            <p><a href="#" id="resetPasswordLink" style="color: #4285f4;">Forgot password?</a></p>
        </div>
    </div>
</center>

<!-- User Info Box (hidden by default) -->
<center>
    <div id="user-container" style="
        width: 300px;
        border: 2px solid #5a5a5a;
        padding: 30px;
        margin: 0 auto;
        background: color-scheme;
        display: none;
        ">
        
        <div>
            <h3>Welcome, <span id="user-email"></span>!</h3>
            <p><strong>Email:</strong> <span id="display-email"></span></p>
            <p><strong>Email verified:</strong> <span id="email-verified"></span></p>
        </div>
        
        <br>
        
        <div>
            <button id="signOutBtn" style="padding: 8px 20px;">Logout</button>
        </div>
    </div>
</center>

<!-- Main script -->
<script type="module">
    import './src/firebase-config.js'
    import './src/auth.js'
    
    // Event listeners for buttons
    document.getElementById('signUpBtn').addEventListener('click', signUp);
    document.getElementById('signInBtn').addEventListener('click', signIn);
    document.getElementById('signOutBtn').addEventListener('click', signOut);
    document.getElementById('resetPasswordLink').addEventListener('click', function(e) {
        e.preventDefault();
        resetPassword();
    });
</script>

</body>
</html>
```

### Step 10: Update `groups.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Security-Policy" 
      content="default-src 'self' https:; 
               script-src 'self' https:;
               style-src 'self' https:;
               img-src 'self' https: data:;">
    <meta charset="UTF-8">
    <meta name="color-scheme" content="light dark">
    <title>Groups</title>
</head>
<body>

    <meta name="color-scheme" content="light dark">

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
    
    <script type="module">
        import './src/firebase-config.js'
        import './src/auth.js'
        import './src/groups.js'
        
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
        window.logout = function() {
            auth.signOut().then(() => {
                window.location.href = "index.html";
            });
        }
    </script>

</body>
</html>
```

### Step 11: Run Locally

```bash
# Install dependencies
npm install

# Start development server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Visit `http://localhost:3000` in your browser.

### Step 12: Deploy to GitHub Pages with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build
      env:
        VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
        VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
        VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
        VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
        VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
        VITE_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
        VITE_FIREBASE_MEASUREMENT_ID: ${{ secrets.FIREBASE_MEASUREMENT_ID }}
      run: npm run build
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### Step 13: Add Secrets to GitHub

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each Firebase key as a secret:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `FIREBASE_MEASUREMENT_ID`

GitHub Actions will use these secrets to build your app without exposing them.

### Step 14: Configure GitHub Pages

1. Go to repo → **Settings** → **Pages**
2. Under "Build and deployment":
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** (this is created by the workflow)
   - Folder: **/ (root)**

---

## Option B2: Using Webpack (More Complex)

If you prefer Webpack, here's a simpler setup:

### Step 1: Install Webpack

```bash
npm install -D webpack webpack-cli webpack-dev-server dotenv-webpack html-webpack-plugin
```

### Step 2: Create `webpack.config.js`

```javascript
const path = require('path');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new Dotenv(),
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html'
    }),
    new HtmlWebpackPlugin({
      template: './groups.html',
      filename: 'groups.html'
    }),
  ],
  devServer: {
    port: 3000,
    open: true,
    static: {
      directory: path.join(__dirname, 'public'),
    },
  }
};
```

### Step 3: Create `src/index.js`

```javascript
import './firebase-config.js';
import './auth.js';

// Event listeners
document.getElementById('signUpBtn').addEventListener('click', signUp);
document.getElementById('signInBtn').addEventListener('click', signIn);
document.getElementById('signOutBtn').addEventListener('click', signOut);
document.getElementById('resetPasswordLink').addEventListener('click', function(e) {
    e.preventDefault();
    resetPassword();
});
```

### Step 4: Update `firebase-config.js`

```javascript
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

firebase.initializeApp(firebaseConfig);
```

---

## Comparing Vite vs Webpack

| Feature | Vite | Webpack |
|---------|------|---------|
| Speed | ⚡ Super fast | Slower |
| Configuration | Simple | Complex |
| Learning curve | Easy | Steep |
| File size | Smaller | Larger |
| Recommended | ✅ Yes | Alternative |

**Recommendation: Use Vite** - it's modern, faster, and easier to set up.

---

## Workflow: Local Development to Deployment

### Local Development:

```bash
# Edit `.env` with your keys
npm run dev

# Make changes to code
# Browser auto-refreshes
```

### Before Committing:

```bash
# Make sure `.env` and `.env.production` are in `.gitignore`
git status  # Should NOT show .env files

# Test the build locally
npm run build
npm run preview  # Test the built version
```

### Push to GitHub:

```bash
git add .
git commit -m "Update groups functionality"
git push origin main
```

### GitHub Actions Automatically:
1. ✅ Fetches your code
2. ✅ Installs dependencies
3. ✅ Reads secrets from GitHub
4. ✅ Runs `npm run build` with environment variables injected
5. ✅ Deploys built files to `gh-pages` branch
6. ✅ Your site updates at `https://yourusername.github.io/Learn-Better-Together/`

---

## Security Benefits of This Approach

✅ **Keys are never in version control**
- `.env` files are git-ignored
- Even if repo is public, keys stay private

✅ **Environment-specific configuration**
- Different keys for dev/prod
- Easy to rotate keys without code changes

✅ **Automated CI/CD**
- GitHub Actions only uses secrets at build time
- Secrets are never logged or exposed

✅ **Built files are safe**
- Keys are embedded into `dist/` files at build time
- No way to extract keys from built JavaScript

---

## Troubleshooting

**Build fails with "undefined" values**
- Make sure environment variables are set in `.env`
- Variable names must start with `VITE_` for Vite
- Restart dev server after changing `.env`

**GitHub Pages shows blank page**
- Check if workflow succeeded (Actions tab)
- Verify secrets are set in GitHub Settings
- Check that `gh-pages` branch is set as deployment source

**Can't access site after deployment**
- Go to repo → Settings → Pages
- Make sure "Source" is set to `gh-pages` branch
- Wait a few minutes for GitHub Pages to rebuild

**Keys showing in DevTools**
- This is normal! Keys are embedded in JavaScript
- But they're still secure because:
  1. Web API keys have limited permissions (Firestore Rules handle access)
  2. The important authentication happens server-side in Firestore/Firebase Auth
  3. Users can't modify Firestore Rules by seeing API keys

---

## Next Steps

1. Choose **Vite** (recommended)
2. Follow Steps 1-11 above
3. Test locally with `npm run dev`
4. Create GitHub secrets
5. Push to GitHub
6. GitHub Actions automatically builds and deploys
7. Visit your site at `https://yourusername.github.io/Learn-Better-Together/`

Done! Your Firebase keys are now safely managed through environment variables. 🔐
