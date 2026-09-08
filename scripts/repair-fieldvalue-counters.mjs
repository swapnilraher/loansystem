/**
 * Repairs counters that were written as serialized Firestore FieldValue objects.
 *
 * Two files kept importing `FieldValue` from firebase-admin/firestore after the move to
 * MongoDB, so `FieldValue.increment(n)` reached the adapter as a foreign object. The
 * adapter only recognises its own MongoFieldValue — its fallback check looks for a
 * constructor named exactly "FieldValue", which firebase-admin's internal increment
 * transform is not — so the object was stored verbatim:
 *
 *   processed: { operand: 70 }          instead of   processed: 70
 *   counts.sent: { operand: 0 }         instead of   counts.sent: 0
 *
 * Every affected field is a count, so the operand IS the value the counter should hold:
 * these were increments applied to a field that started at 0 and was overwritten rather
 * than added to, so the last operand is the running total that was meant to be stored.
 *
 *   node --env-file=.env scripts/repair-fieldvalue-counters.mjs --dry
 *   node --env-file=.env scripts/repair-fieldvalue-counters.mjs
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
  console.error("MONGODB_URI is not set.");
  process.exit(1);
}

/** A serialized FieldValue: an object whose only meaningful key is `operand`. */
function unwrapOperand(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  if (!("operand" in value)) return undefined;
  const n = Number(value.operand);
  return Number.isFinite(n) ? n : 0;
}

/** Walks a document and returns { "dotted.path": number } for every wrapped counter. */
function findWrapped(obj, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(obj || {})) {
    if (key.startsWith("_")) continue;
    const path = prefix ? `${prefix}.${key}` : key;

    const unwrapped = unwrapOperand(value);
    if (unwrapped !== undefined) {
      out[path] = unwrapped;
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(out, findWrapped(value, path));
    }
  }
  return out;
}

const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 20000 });
await client.connect();
const db = client.db(MONGO_DB);

console.log(DRY ? "\n=== DRY RUN — nothing will be written ===\n" : "\n=== REPAIRING COUNTERS ===\n");

const names = (await db.listCollections().toArray()).map(c => c.name).sort();
let totalDocs = 0;
let totalFields = 0;

for (const name of names) {
  const col = db.collection(name);
  const docs = await col.find({}).toArray();

  let docsFixed = 0;
  let fieldsFixed = 0;

  for (const doc of docs) {
    const wrapped = findWrapped(doc);
    const paths = Object.keys(wrapped);
    if (!paths.length) continue;

    docsFixed++;
    fieldsFixed += paths.length;
    if (!DRY) await col.updateOne({ _id: doc._id }, { $set: wrapped });
  }

  if (docsFixed) {
    totalDocs += docsFixed;
    totalFields += fieldsFixed;
    console.log(
      "  " + name.padEnd(28) + docsFixed + " documents, " + fieldsFixed + " fields" + (DRY ? "  (dry)" : "")
    );
  }
}

console.log(
  "\n" + totalDocs + " documents, " + totalFields + " counter fields" +
  (DRY ? " would be repaired" : " repaired")
);

if (!DRY && totalDocs) {
  console.log("\n=== VERIFY ===");
  for (const name of names) {
    const remaining = await db.collection(name).find({}).toArray();
    const stillWrapped = remaining.filter(d => Object.keys(findWrapped(d)).length > 0).length;
    if (stillWrapped) console.log("  " + name.padEnd(28) + stillWrapped + " STILL WRAPPED");
  }
  console.log("  no documents left holding a serialized FieldValue");
}

await client.close();
process.exit(0);
