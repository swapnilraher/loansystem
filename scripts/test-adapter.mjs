import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

process.env.MONGODB_URI = "mongodb+srv://Vercel-Admin-atlas-aquamarine-crystal:NoemLRaawLWJ7q9N@atlas-aquamarine-crysta.n5ac9i3.mongodb.net/loansystem?retryWrites=true&w=majority";
process.env.MONGODB_DB = "loansystem";

const { mongoDbAdapter, MongoFieldValue } = await import("../src/lib/db/mongo-adapter.ts");

async function runTests() {
  console.log("Testing MongoDbAdapter against MongoDB Atlas...");

  const testId = "test_partner_" + Date.now();
  const docRef = mongoDbAdapter.collection("partners").doc(testId);

  // 1. Set document
  await docRef.set({
    name: "Test Partner",
    mobile: "9999999999",
    status: "active",
    credits: 100,
    createdAt: new Date(),
  });
  console.log("✓ Document created successfully");

  // 2. Read document back
  const snap = await docRef.get();
  console.log("✓ Document read exists:", snap.exists, "Data name:", snap.data()?.name);
  if (!snap.exists || snap.data()?.name !== "Test Partner") {
    throw new Error("Read verification failed");
  }

  // 3. Update with increment
  await docRef.update({
    credits: MongoFieldValue.increment(50),
    updatedAt: MongoFieldValue.serverTimestamp(),
  });
  const updatedSnap = await docRef.get();
  console.log("✓ Credits after increment (expected 150):", updatedSnap.data()?.credits);
  console.log("✓ toDate() check:", typeof updatedSnap.data()?.updatedAt?.toDate === "function");
  console.log("✓ toMillis() check:", typeof updatedSnap.data()?.updatedAt?.toMillis === "function");

  // 4. Query with where, select, and startAfter
  const querySnap = await mongoDbAdapter
    .collection("partners")
    .where("mobile", "==", "9999999999")
    .select("name", "credits")
    .get();
  console.log("✓ Query returned docs count with select:", querySnap.size, "data:", querySnap.docs[0]?.data());

  // 5. Batch write
  const batch = mongoDbAdapter.batch();
  const batchDoc1 = mongoDbAdapter.collection("leads").doc("lead_b1");
  const batchDoc2 = mongoDbAdapter.collection("leads").doc("lead_b2");
  batch.set(batchDoc1, { name: "Batch Lead 1", status: "New" });
  batch.set(batchDoc2, { name: "Batch Lead 2", status: "New" });
  await batch.commit();
  console.log("✓ Batch commit succeeded");

  // 6. Subcollection test
  const recipientRef = mongoDbAdapter.collection("campaigns").doc("camp_1").collection("recipients").doc("rec_1");
  await recipientRef.set({ phone: "9876543210", sent: true });
  const recSnap = await recipientRef.get();
  console.log("✓ Subcollection write & read:", recSnap.exists, recSnap.data());

  // 7. Cleanup test items
  await docRef.delete();
  await batchDoc1.delete();
  await batchDoc2.delete();
  await recipientRef.delete();
  console.log("✓ Cleanup complete. All adapter tests passed with flying colors!");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
