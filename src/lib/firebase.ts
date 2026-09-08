/**
 * Firebase in the browser: authentication, file storage and push messaging.
 *
 * There is deliberately no Firestore here. The database is MongoDB, reached through
 * the API routes under `src/app/api` — nothing in the browser talks to a database
 * directly any more. Re-adding a `db` export would let a component quietly open a
 * second source of truth, which is the exact state this migration removed: reads
 * coming from one database while writes went to another.
 */
import { initializeApp, getApps, getApp } from "firebase/app";
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

export { app, storage, auth };

