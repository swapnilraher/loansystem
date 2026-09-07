/**
 * Read-only census of both databases, so a migration can be scoped before it is written.
 *
 * Lists every top-level collection on each side with its document count, and samples the
 * leads/{id}/remarks subcollection, which the Mongo adapter flattens to `leads_remarks`
 * with a `_parentId` field rather than nesting.
 *
 *   node --env-file=.env scripts/compare-firestore-mongo.mjs
 */
import dns from "node:dns";
import { MongoClient } from "mongodb";
import admin from "firebase-admin";

// Atlas SRV lookups fail on some Windows/ISP resolvers; same workaround src/lib/mongodb.ts uses.
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch {
  // ignore
}

const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGODB_DB || "loansystem";

const cleanKey = (raw) => {
  if (!raw) return undefined;
  let key = raw;
  if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
  if (key.startsWith("'") && key.endsWith("'")) key = key.slice(1, -1);
  return key.replace(/\\n/g, "\n");
};

async function mongoCensus() {
  if (!MONGO_URI) return { error: "MONGODB_URI not set" };
  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const db = client.db(MONGO_DB);
  const names = (await db.listCollections().toArray()).map((c) => c.name).sort();
  const out = {};
  for (const name of names) {
    out[name] = await db.collection(name).countDocuments();
  }
  await client.close();
  return out;
}

async function firestoreCensus() {
  const privateKey = cleanKey(process.env.FIREBASE_PRIVATE_KEY);
  if (!privateKey) return { error: "FIREBASE_PRIVATE_KEY not set" };

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "dsa-loan",
      clientEmail: "firebase-adminsdk-fbsvc@dsa-loan.iam.gserviceaccount.com",
      privateKey,
    }),
  });
  const db = admin.firestore();

  const cols = await db.listCollections();
  const out = {};
  for (const col of cols) {
    // count() aggregates server-side, so this stays cheap on large collections.
    const snap = await col.count().get();
    out[col.id] = snap.data().count;
  }

  // Subcollections are per-document, so they need a sample rather than a full scan.
  let remarks = 0;
  let scanned = 0;
  const leads = await db.collection("leads").limit(200).get();
  for (const lead of leads.docs) {
    scanned++;
    const sub = await lead.ref.collection("remarks").count().get();
    remarks += sub.data().count;
  }
  out["leads/{id}/remarks (first " + scanned + " leads)"] = remarks;

  return out;
}

const pad = (s, n) => String(s).padEnd(n);

const [mongo, fire] = await Promise.all([
  mongoCensus().catch((e) => ({ error: e.message })),
  firestoreCensus().catch((e) => ({ error: e.message })),
]);

console.log("\n=== MongoDB (" + MONGO_DB + ") ===");
console.log(mongo.error ? "  ERROR: " + mongo.error : "");
if (!mongo.error) {
  const entries = Object.entries(mongo);
  if (!entries.length) console.log("  (no collections — database is empty)");
  for (const [k, v] of entries) console.log("  " + pad(k, 34) + v);
}

console.log("\n=== Firestore (dsa-loan) ===");
console.log(fire.error ? "  ERROR: " + fire.error : "");
if (!fire.error) {
  const entries = Object.entries(fire);
  if (!entries.length) console.log("  (no collections)");
  for (const [k, v] of entries) console.log("  " + pad(k, 34) + v);
}

if (!mongo.error && !fire.error) {
  console.log("\n=== Verdict per collection ===");
  const keys = [...new Set([...Object.keys(mongo), ...Object.keys(fire)])]
    .filter((k) => !k.includes("{id}"))
    .sort();
  for (const k of keys) {
    const m = mongo[k] ?? 0;
    const f = fire[k] ?? 0;
    let verdict;
    if (f === 0 && m === 0) verdict = "both empty";
    else if (f > 0 && m === 0) verdict = "NEEDS MIGRATION (" + f + " docs only in Firestore)";
    else if (f === 0 && m > 0) verdict = "already on Mongo";
    else if (m === f) verdict = "counts match";
    else verdict = "DIVERGED (firestore " + f + " vs mongo " + m + ")";
    console.log("  " + pad(k, 34) + verdict);
  }
}

process.exit(0)
