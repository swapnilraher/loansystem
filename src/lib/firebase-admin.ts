import * as admin from 'firebase-admin';

const getPrivateKey = () => {
  let key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;
  
  // Clean surrounding quotes if present
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  if (key.startsWith("'") && key.endsWith("'")) {
    key = key.slice(1, -1);
  }
  
  return key.replace(/\\n/g, '\n');
};

const serviceAccount = {
  projectId: "dsa-loan",
  clientEmail: "firebase-adminsdk-fbsvc@dsa-loan.iam.gserviceaccount.com",
  privateKey: getPrivateKey(),
};

// Singleton pattern for Firebase Admin
export const getAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "dsa-loan.firebasestorage.app"
  });
};

let cachedDb: admin.firestore.Firestore | null = null;
let cachedStorage: any = null;
let cachedAuth: admin.auth.Auth | null = null;

export const getAdminDb = () => {
  if (!cachedDb) {
    cachedDb = getAdminApp().firestore();
    // Enable REST transport fallback to bypass gRPC/firewall blockages
    try {
      cachedDb.settings({ preferRest: true });
    } catch (settingsError) {
      console.warn("Firestore settings could not be applied (already initialized):", settingsError);
    }
  }
  return cachedDb;
};

export const getAdminStorage = () => {
  if (!cachedStorage) {
    cachedStorage = getAdminApp().storage();
  }
  return cachedStorage;
};

export const getAdminAuth = () => {
  if (!cachedAuth) {
    cachedAuth = getAdminApp().auth();
  }
  return cachedAuth;
};
