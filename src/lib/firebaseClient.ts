
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore"; // Import Firestore

// -----------------------------------------------------------------------------
// IMPORTANT: REPLACE THE PLACEHOLDER VALUES BELOW WITH YOUR ACTUAL FIREBASE PROJECT CONFIGURATION.
//
// You can find these details in your Firebase project settings:
// 1. Go to the Firebase Console (https://console.firebase.google.com/).
// 2. Select your project.
// 3. Click on the gear icon (Project settings) next to "Project Overview".
// 4. In the "General" tab, scroll down to the "Your apps" section.
// 5. If you haven't registered a web app, add one (click the </> icon).
// 6. Find your web app and look for the "Firebase SDK snippet" section. Select "Config".
// 7. Copy the corresponding values (apiKey, authDomain, etc.) from there into this file.
//
// Example: If your Firebase config shows:
//   apiKey: "aiZaSyB...RandomChars...",
// Then you would replace "YOUR_API_KEY" below with "aiZaSyB...RandomChars...".
//
// DO THIS FOR ALL CONFIG VALUES.
// -----------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY", // <--- REPLACE THIS WITH YOUR ACTUAL API KEY
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN", // <--- REPLACE THIS WITH YOUR ACTUAL AUTH DOMAIN
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID", // <--- REPLACE THIS WITH YOUR ACTUAL PROJECT ID
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET", // <--- REPLACE THIS WITH YOUR ACTUAL STORAGE BUCKET
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID", // <--- REPLACE THIS WITH YOUR ACTUAL MESSAGING SENDER ID
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID", // <--- REPLACE THIS WITH YOUR ACTUAL APP ID
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID" // Optional: uncomment and REPLACE if you need analytics
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
