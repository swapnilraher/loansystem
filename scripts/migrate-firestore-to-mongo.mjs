/**
 * One-time (and safely repeatable) copy of every Firestore document into MongoDB.
 *
 * The Mongo adapter in src/lib/db/mongo-adapter.ts decides the target shape, so this
 * script mirrors it exactly rather than inventing one:
 *
 *   - the Firestore document id becomes `_id`, as a STRING (the adapter filters on
 *     `{_id: this.id}` with the raw id, never an ObjectId)
 *   - a subcollection `parent/{id}/child` flattens to the collection `parent_child`,
 *     with `_parentId` holding the parent's id — that is what MongoDocRef.collection()
 *     builds, and what MongoQuery filters on
 *   - Firestore Timestamps become JS Dates, which is what the adapter writes for
 *     serverTimestamp() and what `.toDate()`/`.toMillis()` are polyfilled onto
 *
 * Every write is an upsert keyed on `_id`, so re-running converges rather than
 * duplicating. Nothing in Firestore is read destructively or deleted.
 *
 * Reads are the scarce resource here — this project is on Firestore's free tier and a
 * full pass costs roughly one read per document. Two things keep it under the cap:
 * pages are written as they are read (so a quota failure keeps everything already
 * copied), and subcollections are probed on a sample rather than on every document,
 * because listCollections() is a per-document round trip and was itself the largest
 * single consumer of quota.
 *
 *   node --env-file=.env scripts/migrate-firestore-to-mongo.mjs --dry
 *   node --env-file=.env scripts/migrate-firestore-to-mongo.mjs
 *   node --env-file=.env scripts/migrate-firestore-to-mongo.mjs --only=whatsapp_messages
 *   node --env-file=.env scripts/migrate-firestore-to-mongo.mjs --fresh   (ignore resume point)
 */
import dns from "node:dns";
import { MongoClient } from "mongodb";
import admin from "firebase-admin";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch {
  // ignore — only needed on resolvers that fail Atlas SRV lookups
}

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const FRESH = args.includes("--fresh");
const ONLY = (args.find((a) => a.startsWith("--only=")) || "").replace("--only=", "");
const ONLY_SET = ONLY ? new Set(ONLY.split(",").map((s) => s.trim()).filter(Boolean)) : null;

const PAGE = 400;
/** How many documents of a collection to probe before concluding it has no subcollections. */
const PROBE_LIMIT = 25;

const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGODB_DB || "loansystem";
if (!MONGO_URI) {
  console.error("MONGODB_URI is not set. Run with: node --env-file=.env scripts/...");
  process.exit(1);
}

const cleanKey = (raw) => {
  if (!raw) return undefined;
  let key = raw;
  if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
  if (key.startsWith("'") && key.endsWith("'")) key = key.slice(1, -1);
  return key.replace(/\\n/g, "\n");
};

const privateKey = cleanKey(process.env.FIREBASE_PRIVATE_KEY);
if (!privateKey) {
  console.error("FIREBASE_PRIVATE_KEY is not set — cannot read the source database.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "dsa-loan",
    clientEmail: "firebase-adminsdk-fbsvc@dsa-loan.iam.gserviceaccount.com",
    privateKey,
  }),
});
const fsdb = admin.firestore();

const isQuotaError = (err) =>
  String(err && err.message).includes("RESOURCE_EXHAUSTED") ||
  String(err && err.message).includes("Quota exceeded");

/** Firestore rate limits are transient; a few backed-off retries ride out a burst. */
async function withRetry(label, fn, attempts = 4) {
  let wait = 4000;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts || !isQuotaError(err)) throw err;
      console.log("\n  quota hit on " + label + " — waiting " + wait / 1000 + "s (attempt " + i + "/" + attempts + ")");
      await new Promise((r) => setTimeout(r, wait));
      wait *= 2;
    }
  }
}

/**
 * Firestore's wire types have no meaning to MongoDB, so each is turned into the
 * plainest equivalent that survives both the driver and a later JSON response.
 * Anything unrecognised is passed through rather than dropped, so an unexpected
 * type shows up in the data instead of vanishing silently.
 */
function convert(value) {
  if (value === null || value === undefined) return value;

  if (value instanceof admin.firestore.Timestamp) return value.toDate();
  if (value instanceof admin.firestore.GeoPoint) {
    return { latitude: value.latitude, longitude: value.longitude };
  }
  if (value instanceof admin.firestore.DocumentReference) return value.path;
  if (value instanceof Date) return value;
  if (Buffer.isBuffer(value)) return value;

  if (Array.isArray(value)) return value.map(convert);

  if (typeof value === "object") {
    // Timestamp-shaped plain objects turn up in documents written by older client
    // SDK versions, where the admin instanceof check does not catch them.
    if (typeof value._seconds === "number" && typeof value._nanoseconds === "number") {
      return new Date(value._seconds * 1000 + Math.round(value._nanoseconds / 1e6));
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      // Mongo rejects dotted and $-prefixed keys; keep the value under a safe name.
      const safe = k.replace(/^\$/, "_$").replace(/\./g, "_");
      out[safe] = convert(v);
    }
    return out;
  }

  return value;
}

function toMongoDoc(snapshot, parentId) {
  const data = convert(snapshot.data() || {});
  delete data._id;
  const doc = { ...data, _id: snapshot.id };
  if (parentId) doc._parentId = parentId;
  return doc;
}

/**
 * Upserts a page and reports how many documents it actually accounts for.
 *
 * matchedCount and modifiedCount both describe the same existing document, so adding
 * all three counters double-counts every re-run; upserted + matched is the true total.
 * A shortfall against the input means two source documents shared an `_id` and one
 * overwrote the other — which is exactly what happens when a subcollection's ids are
 * only unique within their parent, so it is surfaced rather than averaged away.
 */
async function writePage(mongoDb, collectionName, docs) {
  if (!docs.length) return { accounted: 0, collided: 0 };
  if (DRY) return { accounted: docs.length, collided: 0 };

  const seen = new Set();
  let collided = 0;
  for (const d of docs) {
    if (seen.has(d._id)) collided++;
    seen.add(d._id);
  }

  const ops = docs.map((d) => ({
    replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true },
  }));
  const res = await mongoDb.collection(collectionName).bulkWrite(ops, { ordered: false });
  return { accounted: (res.upsertedCount || 0) + (res.matchedCount || 0), collided };
}

/** The highest `_id` already stored, used to resume a collection without re-reading it. */
async function resumePoint(mongoDb, collectionName) {
  if (DRY || FRESH) return null;
  const existing = await mongoDb
    .collection(collectionName)
    .find({}, { projection: { _id: 1 } })
    .sort({ _id: -1 })
    .limit(1)
    .toArray();
  return existing.length ? String(existing[0]._id) : null;
}

const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 20000 });
await client.connect();
const mongoDb = client.db(MONGO_DB);

console.log(DRY ? "\n=== DRY RUN — nothing will be written ===\n" : "\n=== MIGRATING ===\n");

let topLevel;
try {
  topLevel = await withRetry("listCollections", () => fsdb.listCollections());
} catch (err) {
  if (!isQuotaError(err)) throw err;
  console.log("Firestore's read quota is exhausted — not even the collection list could be fetched.");
  console.log("The free-tier quota resets daily. Re-run this same command once it has.");
  await client.close();
  process.exit(1);
}
const report = [];
const collisions = [];
let quotaStopped = null;

for (const colRef of topLevel) {
  const name = colRef.id;
  if (ONLY_SET && !ONLY_SET.has(name)) continue;

  const after = await resumePoint(mongoDb, name);
  let cursor = after;
  let read = 0;
  let accounted = 0;
  let probed = 0;
  let hasSubcollections = null; // null = still deciding, false = confirmed none
  const subTotals = new Map();

  if (after) console.log("  " + name.padEnd(28) + "resuming after id " + after);

  try {
    for (;;) {
      const page = await withRetry(name, async () => {
        let q = colRef.orderBy(admin.firestore.FieldPath.documentId()).limit(PAGE);
        if (cursor) q = q.startAfter(cursor);
        return q.get();
      });
      if (page.empty) break;

      const docs = page.docs.map((s) => toMongoDoc(s));
      const wrote = await writePage(mongoDb, name, docs);
      accounted += wrote.accounted;
      read += page.docs.length;

      // Probing costs one round trip per document, so it stops as soon as a sample
      // says this collection has no subcollections at all.
      if (hasSubcollections !== false) {
        for (const snap of page.docs) {
          if (hasSubcollections === null && probed >= PROBE_LIMIT) {
            hasSubcollections = false;
            break;
          }
          probed++;
          const subs = await withRetry(name + " subcollections", () => snap.ref.listCollections());
          if (subs.length) hasSubcollections = true;
          for (const sub of subs) {
            const target = name + "_" + sub.id;
            const subSnap = await withRetry(target, () => sub.get());
            if (subSnap.empty) continue;
            const subDocs = subSnap.docs.map((s) => toMongoDoc(s, snap.id));
            const sw = await writePage(mongoDb, target, subDocs);
            const prev = subTotals.get(target) || { source: 0, accounted: 0 };
            subTotals.set(target, {
              source: prev.source + subDocs.length,
              accounted: prev.accounted + sw.accounted,
            });
          }
        }
      }

      cursor = page.docs[page.docs.length - 1].id;
      process.stdout.write("  " + name + ": " + read + " read\r");
      if (page.docs.length < PAGE) break;
    }
  } catch (err) {
    if (!isQuotaError(err)) throw err;
    quotaStopped = name;
    console.log("\n  QUOTA EXHAUSTED during " + name + " — stopping cleanly after " + read + " documents.");
    console.log("  Everything read so far is already written. Re-run the same command to resume.");
  }

  report.push({ collection: name, source: read, accounted });
  console.log(
    "  " + name.padEnd(28) + String(read).padStart(6) + " read" +
    (DRY ? "  (dry)" : "  -> " + accounted + " in mongo")
  );

  for (const [target, t] of subTotals) {
    report.push({ collection: target, source: t.source, accounted: t.accounted });
    const lost = t.source - t.accounted;
    if (lost > 0) collisions.push({ collection: target, lost, source: t.source });
    console.log(
      "  " + (target + " (sub)").padEnd(28) + String(t.source).padStart(6) + " read" +
      (DRY ? "  (dry)" : "  -> " + t.accounted + " in mongo" + (lost > 0 ? "   " + lost + " LOST TO _id COLLISION" : ""))
    );
  }

  if (quotaStopped) break;
}

console.log("\n=== VERIFY (live counts in MongoDB) ===");
for (const row of report) {
  const actual = DRY ? null : await mongoDb.collection(row.collection).countDocuments();
  console.log(
    "  " + row.collection.padEnd(28) +
    "source " + String(row.source).padStart(6) +
    (DRY ? "   (dry run — not written)" : "   mongo " + String(actual).padStart(6))
  );
}

const totalSource = report.reduce((n, r) => n + r.source, 0);
console.log("\n" + report.length + " collections, " + totalSource + " documents read" + (DRY ? " (dry run)" : ""));

if (collisions.length) {
  console.log("\n!!! SUBCOLLECTION _id COLLISIONS !!!");
  for (const c of collisions) {
    console.log("  " + c.collection + ": " + c.lost + " of " + c.source + " documents overwrote each other.");
  }
  console.log("  These subcollections use ids that repeat across parents (r0000001, r0000002, ...).");
  console.log("  mongo-adapter.ts flattens every parent's subcollection into ONE mongo collection");
  console.log("  keyed by _id, and _id must be unique, so same-id documents from different parents");
  console.log("  collide. The adapter needs a composite key before this data can round-trip.");
}

if (quotaStopped) {
  console.log("\nStopped early on Firestore quota (collection: " + quotaStopped + ").");
  console.log("Firestore's free-tier read quota resets daily. Re-run the same command to continue.");
}

await client.close();
process.exit(quotaStopped || collisions.length ? 1 : 0);
