const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const getPrivateKey = () => {
  let key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;
  if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
  if (key.startsWith("'") && key.endsWith("'")) key = key.slice(1, -1);
  return key.replace(/\\n/g, '\n');
};

const serviceAccount = {
  projectId: "dsa-loan",
  clientEmail: "firebase-adminsdk-fbsvc@dsa-loan.iam.gserviceaccount.com",
  privateKey: getPrivateKey(),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  try {
    const adminRef = db.collection('admin_users');
    const snapshot = await adminRef.get();
    
    let deletedCount = 0;
    for (const doc of snapshot.docs) {
      if (doc.data().email !== 'swapnil.r.aher@gmail.com') {
        await doc.ref.delete();
        deletedCount++;
        // also try deleting from Auth? Optional, but good if they exist
        try {
          const authUser = await admin.auth().getUserByEmail(doc.data().email);
          await admin.auth().deleteUser(authUser.uid);
        } catch(e) {}
      }
    }
    console.log(`Deleted ${deletedCount} extra admin users.`);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
