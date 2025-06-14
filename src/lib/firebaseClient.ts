
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore"; // Import Firestore

// -----------------------------------------------------------------------------
// IMPORTANT: REPLACE PLACEHOLDER VALUES BELOW WITH YOUR ACTUAL FIREBASE PROJECT CONFIG
// You can find these details in your Firebase project settings:
// Project Overview -> Project settings (gear icon) -> General (scroll down to "Your apps")
// -----------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY", // <--- REPLACE THIS
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN", // <--- REPLACE THIS
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID", // <--- REPLACE THIS
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET", // <--- REPLACE THIS
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID", // <--- REPLACE THIS
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID", // <--- REPLACE THIS
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID" // Optional, uncomment if needed
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app); // Initialize and export Firestore
export default app;
