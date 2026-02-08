import { describe, it, expect } from "vitest";
import { autoPodApply } from "./autopod";
import { AppState } from "../state/model";

function makeState(): AppState {
  const c1 = "c1", c2 = "c2", c3 = "c3", c4 = "c4";
  return {
    version: 1,
    categories: [
      { categoryId: c1, name: "Beginner", color: "#60a5fa", rank: 1, createdIndex: 1 },
      { categoryId: c2, name: "Casual", color: "#34d399", rank: 2, createdIndex: 2 },
      { categoryId: c3, name: "Advanced", color: "#fbbf24", rank: 3, createdIndex: 3 },
      { categoryId: c4, name: "High", color: "#fb7185", rank: 4, createdIndex: 4 }
    ],
    players: [],
    groups: [],
    tables: [],
    connectMode: { enabled: false, selectedPlayerIds: [] },
    counters: { createdIndex: 10 },
    lastAutoPodSummary: undefined
  };
}

function allSeatedIds(s: AppState): string[] {
  const out: string[] = [];
  for (const t of s.tables) {
    for (const pid of t.seats) if (pid) out.push(pid);
  }
  return out;
}

describe("Auto Pod", () => {
  it("does not move already-seated players", () => {
    const s = makeState();
    s.players = [
      { playerId: "A", displayName: "A", categoryId: "c3", createdIndex: 1 },
      { playerId: "B", displayName: "B", categoryId: "c3", createdIndex: 2 }
    ];
    s.tables = [
      { tableId: "T1", name: "1", seatCount: 4, seats: ["A", null, null, null], createdIndex: 1 }
    ];
    const { nextState } = autoPodApply(s);
    expect(nextState.tables[0].seats[0]).toBe("A");
  });

  it("never seats the same player in two seats (sanitizes bad state)", () => {
    const s = makeState();
    s.players = [
      { playerId: "A", displayName: "A", categoryId: "c2", createdIndex: 1 },
      { playerId: "B", displayName: "B", categoryId: "c2", createdIndex: 2 },
      { playerId: "C", displayName: "C", categoryId: "c2", createdIndex: 3 }
    ];
    s.tables = [
      { tableId: "T1", name: "1", seatCount: 4, seats: ["A", null, null, null], createdIndex: 1 },
      { tableId: "T2", name: "2", seatCount: 4, seats: ["A", null, null, null], createdIndex: 2 }
    ];
    const { nextState } = autoPodApply(s);
    const ids = allSeatedIds(nextState);
    const countA = ids.filter(x => x === "A").length;
    expect(countA).toBe(1);
  });

  it("treats eligible groups as atomic (group members cannot also be seated as singles)", () => {
    const s = makeState();
    s.players = [
      { playerId: "A", displayName: "A", categoryId: "c1", createdIndex: 1 },
      { playerId: "B", displayName: "B", categoryId: "c1", createdIndex: 2 },
      { playerId: "C", displayName: "C", categoryId: "c1", createdIndex: 3 },
      { playerId: "D", displayName: "D", categoryId: "c1", createdIndex: 4 }
    ];
    s.groups = [
      { groupId: "G1", playerIds: ["A", "B"], categoryId: "c1", createdIndex: 1 }
    ];
    s.tables = [
      { tableId: "T1", name: "1", seatCount: 4, seats: [null, null, null, null], createdIndex: 1 },
      { tableId: "T2", name: "2", seatCount: 4, seats: [null, null, null, null], createdIndex: 2 }
    ];

    const { nextState } = autoPodApply(s);

    const seated = allSeatedIds(nextState);
    // Uniqueness
    expect(new Set(seated).size).toBe(seated.length);

    // A and B should end up in the SAME table if they are seated at all.
    const tableOf = (pid: string) => nextState.tables.find(t => t.seats.includes(pid))?.tableId ?? null;
    const tA = tableOf("A");
    const tB = tableOf("B");
    expect(tA).not.toBeNull();
    expect(tA).toBe(tB);
  });
});
