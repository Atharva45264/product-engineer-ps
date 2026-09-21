import { MongoClient, Db } from "mongodb";

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is not defined");
}

const databaseName =
  process.env.MONGODB_DATABASE || "realtime_incident_feed";

const client = new MongoClient(mongoUri);

let database: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (database) {
    return database;
  }

  await client.connect();

  database = client.db(databaseName);

  console.log(`Connected to MongoDB database: ${databaseName}`);

  return database;
}

export function getDatabase(): Db {
  if (!database) {
    throw new Error("Database has not been connected");
  }

  return database;
}