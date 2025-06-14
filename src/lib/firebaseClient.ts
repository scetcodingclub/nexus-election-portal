
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Firebase configuration provided by the user.
const firebaseConfig = {
  apiKey: "AIzaSyBAzdIIn10HGAEhfvwXEu0tEHvTW4PJDu8",
  authDomain: "nexus-voting-panel-5uah0.firebaseapp.com",
  projectId: "nexus-voting-panel-5uah0",
  storageBucket: "nexus-voting-panel-5uah0.firebasestorage.app", // Corrected to firebasestorage.app as per your provided config.
  messagingSenderId: "660782687862",
  appId: "1:660782687862:web:e014e926647d0cec80e157"
  // measurementId can be added here if needed
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
export const db = getFirestore(app);
export default app;
