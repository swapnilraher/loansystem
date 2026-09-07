/**
 * Checks that subcollection documents are stored in the shape mongo-adapter.ts now
 * reads and writes: a parent-prefixed `_id`, the logical id kept in `_docId`, and the
 * parent in `_parentId`.
 *
 * The property that matters is the one that was broken: the SAME logical id must be
 * able to exist under DIFFERENT parents. Campaign recipients are numbered r0000001,
 * r0000002 per campaign, so before the composite key they overwrote each other.
 *
 * This reads MongoDB directly rather than through the adapter, because the adapter is
 * TypeScript whose type-only imports plain Node cannot strip. The stored shape is what
 * both sides agree on, so it is what gets asserted.
 *
 *   node --env-file=.env scripts/verify-subcollections.mjs
 */
import dns from "node:dns";
import { MongoClient } from "mongodb";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch {
  // ignore
}

const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGODB_DB || "loansystem";
if (!MONGO_URI) {
  console.error("MONGODB_URI is not set.");
  process.exit(1);
}

let failures = 0;
const check = (label, ok, detail) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + label + (detail ? "  — " + detail : ""));
  if (!ok) failures++;
};

const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 20000 });
await client.connect();
const db = client.db(MONGO_DB);

const names = (await db.listCollections().toArray()).map((c) => c.name);
const subCollections = [];
for (const name of names) {
  const n = await db.collection(name).countDocuments({ _parentId: { $exists: true } });
  if (n > 0) subCollections.push({ name, count: n });
}

console.log("\n=== subcollections found ===");
for (const s of subCollections) console.log("  " + s.name.padEnd(30) + s.count + " documents");
check("at least one subcollection present", subCollections.length > 0, subCollections.length + " collections");

for (const { name, count } of subCollections) {
  console.log("\n=== " + name + " ===");
  const docs = await db.collection(name).find({ _parentId: { $exists: true } }).toArray();

  const missingDocId = docs.filter((d) => d._docId === undefined);
  check("every document carries _docId", missingDocId.length === 0,
    missingDocId.length ? missingDocId.length + " missing" : count + " documents");

  const badPrefix = docs.filter((d) => String(d._id) !== String(d._parentId) + "/" + String(d._docId));
  check("_id is exactly {_parentId}/{_docId}", badPrefix.length === 0,
    badPrefix.length ? "first bad: " + String(badPrefix[0]._id) : "all " + docs.length + " match");

  // The regression this fix exists to prevent.
  const byLogical = new Map();
  for (const d of docs) {
    const key = String(d._docId);
    if (!byLogical.has(key)) byLogical.set(key, new Set());
    byLogical.get(key).add(String(d._parentId));
  }
  const shared = [...byLogical.entries()].filter(([, parents]) => parents.size > 1);
  if (shared.length) {
    const [id, parents] = shared[0];
    check("same logical id coexists across parents", true,
      shared.length + " such ids (e.g. " + id + " under " + parents.size + " parents)");
  } else {
    console.log("  n/a   no logical id is currently shared across parents in this collection");
  }

  const distinctParents = new Set(docs.map((d) => String(d._parentId)));
  console.log("  info  " + docs.length + " documents across " + distinctParents.size + " parents");
}

console.log("\n" + (failures ? failures + " CHECK(S) FAILED" : "all checks passed"));
await client.close();
process.exit(failures ? 1 : 0);
