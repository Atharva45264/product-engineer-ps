export type IncidentUpdate = {
  id: string;
  incidentId: string;
  message: string;
  sequence: number;
  createdAt: string;
};

export function mergeUpdates(
  current: IncidentUpdate[],
  incoming: IncidentUpdate[]
): IncidentUpdate[] {
  const updatesById = new Map<string, IncidentUpdate>();

  for (const update of current) {
    updatesById.set(update.id, update);
  }

  for (const update of incoming) {
    if (!updatesById.has(update.id)) {
      updatesById.set(update.id, update);
    }
  }

  return Array.from(updatesById.values()).sort(
    (a, b) => a.sequence - b.sequence
  );
}