import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

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

// Initialize Messaging only on the client side when supported
let messagingPromise: Promise<any> | null = null;
export const getMessagingClient = async () => {
  if (typeof window === "undefined") return null;
  if (!messagingPromise) {
    messagingPromise = isSupported().then((supported) => {
      return supported ? getMessaging(app) : null;
    }).catch((err) => {
      console.error("FCM isSupported check failed:", err);
      return null;
    });
  }
  return messagingPromise;
};

export { app, db, storage, auth };

