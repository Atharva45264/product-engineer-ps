import { describe, expect, it } from "vitest";
import {
  IncidentUpdate,
  mergeUpdates,
} from "./feed-utils";

function createUpdate(
  id: string,
  sequence: number,
  message: string
): IncidentUpdate {
  return {
    id,
    incidentId: "INC-001",
    message,
    sequence,
    createdAt: "2026-09-21T12:00:00.000Z",
  };
}

describe("mergeUpdates", () => {
  it("deduplicates overlapping history and live updates", () => {
    const history = [
      createUpdate("update-1", 1, "First update"),
      createUpdate("update-2", 2, "Second update"),
    ];

    const live = [
      createUpdate("update-2", 2, "Second update"),
      createUpdate("update-3", 3, "Third update"),
    ];

    const result = mergeUpdates(history, live);

    expect(result).toHaveLength(3);

    expect(result.map((update) => update.id)).toEqual([
      "update-1",
      "update-2",
      "update-3",
    ]);
  });

  it("keeps updates ordered by sequence", () => {
    const result = mergeUpdates(
      [],
      [
        createUpdate("update-3", 3, "Third"),
        createUpdate("update-1", 1, "First"),
        createUpdate("update-2", 2, "Second"),
      ]
    );

    expect(result.map((update) => update.sequence)).toEqual([
      1,
      2,
      3,
    ]);
  });
});