import { MongoClient, type Db } from "mongodb";

type MongoGlobal = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

const globalForMongo = globalThis as MongoGlobal;

function getClient() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo._mongoClientPromise = client.connect();
  }

  return globalForMongo._mongoClientPromise;
}

export async function getMongoClient() {
  return getClient();
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  const dbName = process.env.MONGODB_DB;
  return client.db(dbName ?? undefined);
}
