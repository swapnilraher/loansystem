importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

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
firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || "New Notification";
  const notificationOptions = {
    body: payload.notification.body || "",
    icon: payload.notification.image || '/img/logo.jpeg',
    badge: '/img/logo.jpeg',
    data: payload.data,
    requireInteraction: true
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
