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
    const snapshot = await adminRef.where('email', '==', 'swapnil.r.aher@gmail.com').get();
    
    if (snapshot.empty) {
      await adminRef.add({
        name: "Swapnil Aher",
        email: "swapnil.r.aher@gmail.com",
        phone: "+91 0000000000",
        role: "Super Admin",
        status: "Active",
        password: "Techstar@123", // Default password
        permissions: ["read:leads", "update:leads", "admin:all"],
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: "Never"
      });
      console.log("Super Admin user created successfully.");
    } else {
      const doc = snapshot.docs[0];
      await doc.ref.update({
        role: "Super Admin",
        status: "Active",
        password: "Techstar@123"
      });
      console.log("Super Admin user already exists. Role and password updated.");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
