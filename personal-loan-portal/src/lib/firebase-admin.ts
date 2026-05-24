import * as admin from 'firebase-admin';

const serviceAccount = {
  projectId: "dsa-loan",
  clientEmail: "firebase-adminsdk-fbsvc@dsa-loan.iam.gserviceaccount.com",
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Singleton pattern for Firebase Admin
const getAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "dsa-loan.firebasestorage.app"
  });
};

export const getAdminDb = () => getAdminApp().firestore();
export const getAdminStorage = () => getAdminApp().storage();
export const getAdminAuth = () => getAdminApp().auth();
