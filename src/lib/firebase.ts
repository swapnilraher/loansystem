import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDy-zXamx8BB18MgTXWoyWACKRSKvvOBTo",
  authDomain: "dsa-loan.firebaseapp.com",
  projectId: "dsa-loan",
  storageBucket: "dsa-loan.firebasestorage.app",
  messagingSenderId: "339200078166",
  appId: "1:339200078166:web:8173765a02b244434866f7",
  measurementId: "G-Y8ZY3SCES2"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Fix for gRPC / Firewall issues: Use Long Polling
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
