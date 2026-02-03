import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, GithubAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: __VITE_FIREBASE_API_KEY__,
    authDomain: __VITE_FIREBASE_AUTH_DOMAIN__,
    projectId: __VITE_FIREBASE_PROJECT_ID__,
    storageBucket: __VITE_FIREBASE_STORAGE_BUCKET__,
    messagingSenderId: __VITE_FIREBASE_MESSAGING_SENDER_ID__,
    appId: __VITE_FIREBASE_APP_ID__,
    measurementId: __VITE_FIREBASE_MEASUREMENT_ID__
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const githubProvider = new GithubAuthProvider();

export function initializeFirebase() {
    return app;
}