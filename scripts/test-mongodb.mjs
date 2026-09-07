import dns from "node:dns";
import { MongoClient } from "mongodb";

// Resolve SRV through Google DNS if local router/ISP DNS rejects SRV records
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const uri = "mongodb+srv://Vercel-Admin-atlas-aquamarine-crystal:NoemLRaawLWJ7q9N@atlas-aquamarine-crysta.n5ac9i3.mongodb.net/loansystem?retryWrites=true&w=majority";

async function testConnection() {
  console.log("Connecting to MongoDB Atlas with Google DNS fallback...");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB Atlas!");
    const db = client.db("loansystem");
    const collections = await db.listCollections().toArray();
    console.log("Existing collections in 'loansystem':", collections.map(c => c.name));
    
    // Quick ping
    const pingResult = await db.command({ ping: 1 });
    console.log("Ping response:", pingResult);
  } catch (err) {
    console.error("MongoDB Atlas connection error:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testConnection();
