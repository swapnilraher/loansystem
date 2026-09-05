import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

process.env.MONGODB_URI = "mongodb+srv://Vercel-Admin-atlas-aquamarine-crystal:NoemLRaawLWJ7q9N@atlas-aquamarine-crysta.n5ac9i3.mongodb.net/loansystem?retryWrites=true&w=majority";
process.env.MONGODB_DB = "loansystem";

const { mongoDbAdapter } = await import("../src/lib/db/mongo-adapter.ts");

async function seedAdmin() {
  console.log("Seeding Super Admin into MongoDB Atlas...");
  const adminRef = mongoDbAdapter.collection("admin_users");
  const snap = await adminRef.where("email", "==", "swapnil.r.aher@gmail.com").get();

  if (snap.empty) {
    const newDoc = await adminRef.add({
      name: "Swapnil Aher",
      email: "swapnil.r.aher@gmail.com",
      phone: "+91 0000000000",
      role: "Super Admin",
      status: "Active",
      password: "Techstar@123",
      permissions: ["read:leads", "update:leads", "admin:all"],
      joinedAt: new Date(),
      lastLogin: "Never",
    });
    console.log("Super Admin seeded successfully with ID:", newDoc.id);
  } else {
    const docId = snap.docs[0].id;
    await adminRef.doc(docId).update({
      role: "Super Admin",
      status: "Active",
      password: "Techstar@123",
      updatedAt: new Date(),
    });
    console.log("Super Admin updated successfully. ID:", docId);
  }

  // Also seed initial dsa_code counter if missing
  const counterRef = mongoDbAdapter.collection("counters").doc("dsa_code");
  const counterSnap = await counterRef.get();
  if (!counterSnap.exists) {
    await counterRef.set({
      lastNumber: 549,
      updatedAt: new Date(),
    });
    console.log("Initialized counters/dsa_code starting at 549.");
  }
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
