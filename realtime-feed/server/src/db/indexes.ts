import { getDatabase } from "./mongodb";

export async function createIndexes(): Promise<void> {
  const updates = getDatabase().collection("updates");

  await updates.createIndex({
    incidentId: 1,
    sequence: 1
  });

  await updates.createIndex(
    {
      incidentId: 1,
      id: 1
    },
    {
      unique: true
    }
  );
}