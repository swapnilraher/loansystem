/**
 * Re-keys already-migrated subcollection documents onto the composite `_id` that
 * mongo-adapter.ts now uses.
 *
 * Before: { _id: "r0000001", _parentId: "campaignA", ... }
 * After:  { _id: "campaignA/r0000001", _docId: "r0000001", _parentId: "campaignA", ... }
 *
 * `_id` is immutable in MongoDB, so each document is re-inserted under its new key and
 * the old one removed. Documents that already carry `_docId` are left alone, so this is
 * safe to re-run.
 *
 * This recovers nothing that was already lost to a collision — two documents that
 * overwrote each other before the fix are down to one, and only a re-read from
 * Firestore can restore the other. It stops the loss from continuing.
 *
 *   node --env-file=.env scripts/rekey-subcollections.mjs --dry
 *   node --env-file=.env scripts/rekey-subcollections.mjs
 */
import dns from "node:dns";
import { MongoClient } from "mongodb";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch {
  // ignore
}

const DRY = process.argv.includes("--dry");
const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGODB_DB || "loansystem";

if (!MONGO_URI) {
  console.error("MONGODB_URI is not set. Run with: node --env-file=.env scripts/...");
  process.exit(1);
}

const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 20000 });
await client.connect();
const db = client.db(MONGO_DB);

console.log(DRY ? "\n=== DRY RUN — nothing will be written ===\n" : "\n=== RE-KEYING SUBCOLLECTIONS ===\n");

const names = (await db.listCollections().toArray()).map((c) => c.name).sort();
let totalMoved = 0;
let totalSkipped = 0;
let totalConflict = 0;

for (const name of names) {
  const col = db.collection(name);
  // Only documents that belong to a parent and have not been re-keyed yet.
  const stale = await col.find({ _parentId: { $exists: true }, _docId: { $exists: false } }).toArray();
  if (!stale.length) continue;

  let moved = 0;
  let conflict = 0;

  for (const doc of stale) {
    const oldId = String(doc._id);
    const newId = String(doc._parentId) + "/" + oldId;

    if (oldId === newId) continue;

    if (!DRY) {
      const clash = await col.findOne({ _id: newId });
      if (clash) {
        // Already re-keyed under the composite id by a previous partial run.
        await col.deleteOne({ _id: oldId });
        conflict++;
        continue;
      }
      const replacement = { ...doc, _id: newId, _docId: oldId };
      await col.insertOne(replacement);
      await col.deleteOne({ _id: oldId });
    }
    moved++;
  }

  totalMoved += moved;
  totalConflict += conflict;
  console.log(
    "  " + name.padEnd(30) + String(moved).padStart(5) + " re-keyed" +
    (conflict ? "   " + conflict + " duplicate old rows removed" : "") +
    (DRY ? "   (dry)" : "")
  );
}

// Anything already carrying _docId was handled on an earlier run.
for (const name of names) {
  const done = await db.collection(name).countDocuments({ _docId: { $exists: true } });
  if (done) {
    totalSkipped += done;
    console.log("  " + name.padEnd(30) + String(done).padStart(5) + " already composite");
  }
}

console.log(
  "\n" + totalMoved + " documents re-keyed" +
  (totalConflict ? ", " + totalConflict + " stale duplicates removed" : "") +
  (totalSkipped ? ", " + totalSkipped + " already correct" : "") +
  (DRY ? " (dry run)" : "")
);

await client.close();
process.exit(0);
