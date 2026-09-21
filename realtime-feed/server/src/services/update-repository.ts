import { Collection } from "mongodb";
import { getDatabase } from "../db/mongodb";
import { IncidentUpdate } from "../models/update";

function getCollection(): Collection<IncidentUpdate> {
  return getDatabase().collection<IncidentUpdate>("updates");
}

export async function saveUpdate(
  update: IncidentUpdate
): Promise<void> {
  await getCollection().insertOne(update);
}

export async function getUpdatesAfter(
  incidentId: string,
  sequence: number,
  limit = 100
): Promise<IncidentUpdate[]> {
  return getCollection()
    .find({
      incidentId,
      sequence: { $gt: sequence },
    })
    .sort({ sequence: 1 })
    .limit(limit)
    .toArray();
}