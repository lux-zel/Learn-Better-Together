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