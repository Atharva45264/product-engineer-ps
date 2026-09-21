import { describe, expect, it, vi } from "vitest";

const findMock = vi.fn();

vi.mock("../db/mongodb", () => ({
  getDatabase: () => ({
    collection: () => ({
      find: findMock,
    }),
  }),
}));

import { getUpdatesAfter } from "./update-repository";

describe("getUpdatesAfter", () => {
  it("returns updates after the requested sequence in order", async () => {
    const updates = [
      {
        id: "update-2",
        incidentId: "INC-001",
        message: "Second update",
        sequence: 2,
        createdAt: new Date("2026-09-21T12:00:02.000Z"),
      },
      {
        id: "update-3",
        incidentId: "INC-001",
        message: "Third update",
        sequence: 3,
        createdAt: new Date("2026-09-21T12:00:03.000Z"),
      },
    ];

    findMock.mockReturnValue({
  project: () => ({
    sort: () => ({
      limit: () => ({
        toArray: vi.fn().mockResolvedValue(updates),
      }),
    }),
  }),
});

    const result = await getUpdatesAfter(
      "INC-001",
      1
    );

    expect(findMock).toHaveBeenCalledWith({
      incidentId: "INC-001",
      sequence: {
        $gt: 1,
      },
    });

    expect(result).toEqual(updates);
    expect(result.map((update) => update.sequence)).toEqual([
      2,
      3,
    ]);
  });
});