import { getDatabase } from "../db/mongodb";

interface SequenceDocument {
  _id: string;
  value: number;
}

export async function getNextSequence(
  incidentId: string
): Promise<number> {
  const collection =
    getDatabase().collection<SequenceDocument>("sequences");

  const result = await collection.findOneAndUpdate(
    { _id: incidentId },
    { $inc: { value: 1 } },
    {
      upsert: true,
      returnDocument: "after"
    }
  );

  if (!result) {
    throw new Error("Failed to generate sequence number");
  }

  return result.value;
}