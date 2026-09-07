import * as admin from 'firebase-admin';
import { mongoDbAdapter } from "@/lib/db/mongo-adapter";

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

export const getAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }
  const privKey = getPrivateKey();
  if (privKey) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: "dsa-loan",
        clientEmail: "firebase-adminsdk-fbsvc@dsa-loan.iam.gserviceaccount.com",
        privateKey: privKey,
      }),
      storageBucket: "dsa-loan.firebasestorage.app"
    });
  }
  return admin.initializeApp({
    projectId: "dsa-loan",
    storageBucket: "dsa-loan.firebasestorage.app"
  });
};

let cachedStorage: any = null;
let cachedAuth: admin.auth.Auth | null = null;

export const getAdminDb = () => {
  return mongoDbAdapter as any;
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
