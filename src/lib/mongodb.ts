import dns from "node:dns";
import { MongoClient, MongoClientOptions, Db, Collection, Document } from "mongodb";
import { attachDatabasePool } from "@vercel/functions";

// When running locally on Windows/certain ISPs, SRV lookups may fail with ECONNREFUSED.
// Adding public DNS servers as fallback ensures reliable connection locally and during local builds.
if (!process.env.VERCEL) {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  } catch (dnsErr) {
    // ignore
  }
}

const uri = process.env.MONGODB_URI || "mongodb+srv://Vercel-Admin-atlas-aquamarine-crystal:NoemLRaawLWJ7q9N@atlas-aquamarine-crysta.n5ac9i3.mongodb.net/loansystem?retryWrites=true&w=majority";
const defaultDbName = process.env.MONGODB_DB || "loansystem";

const options: MongoClientOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 45000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    try {
      attachDatabasePool(client);
    } catch {
      // attachDatabasePool may no-op outside Vercel deployment
    }
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  try {
    attachDatabasePool(client);
  } catch {
    // attachDatabasePool may no-op outside Vercel deployment
  }
  clientPromise = client.connect();
}

export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

export async function getDb(dbName: string = defaultDbName): Promise<Db> {
  const c = await clientPromise;
  return c.db(dbName);
}

export async function getCollection<T extends Document = Document>(
  collectionName: string,
  dbName: string = defaultDbName
): Promise<Collection<T>> {
  const db = await getDb(dbName);
  return db.collection<T>(collectionName);
}

export default clientPromise;
