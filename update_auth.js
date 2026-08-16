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

async function run() {
  try {
    const email = "swapnil.r.aher@gmail.com";
    const password = "Techstar@123";

    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      console.log("User found in Auth. Updating password...");
      await admin.auth().updateUser(userRecord.uid, {
        password: password
      });
      console.log("Successfully updated user password in Auth.");
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log("User not found in Auth. Creating new user...");
        await admin.auth().createUser({
          email: email,
          password: password,
          displayName: "Swapnil Aher",
        });
        console.log("Successfully created user in Auth.");
      } else {
        throw error;
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
