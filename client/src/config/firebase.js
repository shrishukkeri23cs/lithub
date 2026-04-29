import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// IMPORTANT: These values map to the Firebase Config object found in your Firebase Console
// Make sure to copy .env.example to .env and fill in the values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let auth;

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } else {
    console.warn("⚠️ Firebase configuration missing: Application running in degraded auth mode. Check .env file.");
  }
} catch (err) {
  console.error("Firebase init failed:", err);
}

export { auth };
