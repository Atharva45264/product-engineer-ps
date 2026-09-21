import { randomUUID } from "node:crypto";
import { getNextSequence } from "./sequence-service";
import { saveUpdate } from "./update-repository";
import { IncidentUpdate } from "../models/update";

export async function createUpdate(
  incidentId: string,
  message: string
): Promise<IncidentUpdate> {
  const sequence = await getNextSequence(incidentId);

  const update: IncidentUpdate = {
    id: randomUUID(),
    incidentId,
    message,
    sequence,
    createdAt: new Date(),
  };

  await saveUpdate(update);

  return update;
}