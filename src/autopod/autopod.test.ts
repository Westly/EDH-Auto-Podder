import { describe, it, expect } from "vitest";
import { autoPodApply } from "./autopod";
import { AppState } from "../state/model";

function makeState(): AppState {
  const c1 = "c1", c2 = "c2", c3 = "c3", c4 = "c4";
  return {
    version: 1,
    categories: [
      { categoryId: c1, name: "New", color: "#60a5fa", rank: 1, createdIndex: 1 },
      { categoryId: c2, name: "B2", color: "#34d399", rank: 2, createdIndex: 2 },
      { categoryId: c3, name: "B3", color: "#fbbf24", rank: 3, createdIndex: 3 },
      { categoryId: c4, name: "B4", color: "#fb7185", rank: 4, createdIndex: 4 }
    ],
    players: [],
    groups: [],
    tables: [],
    connectMode: { enabled: false, selectedPlayerIds: [] },
    counters: { createdIndex: 10 },
    lastAutoPodSummary: undefined
  };
}

describe("Auto Pod", () => {
  it("does not move seated players", () => {
    const s = makeState();
    s.players = [
      { playerId: "A", displayName: "A", categoryId: "c3", createdIndex: 1 },
      { playerId: "B", displayName: "B", categoryId: "c3", createdIndex: 2 },
      { playerId: "C", displayName: "C", categoryId: "c3", createdIndex: 3 },
      { playerId: "D", displayName: "D", categoryId: "c3", createdIndex: 4 }
    ];
    s.tables = [
      { tableId: "T1", name: "1", seatCount: 4, seats: ["A", null, null, null], createdIndex: 1 }
    ];
    const { nextState } = autoPodApply(s);
    expect(nextState.tables[0].seats[0]).toBe("A");
  });

  it("pairs 2+2 when possible on empty table", () => {
    const s = makeState();
    s.players = [
      { playerId: "A", displayName: "A", categoryId: "c3", createdIndex: 1 },
      { playerId: "B", displayName: "B", categoryId: "c3", createdIndex: 2 },
      { playerId: "C", displayName: "C", categoryId: "c3", createdIndex: 3 },
      { playerId: "D", displayName: "D", categoryId: "c3", createdIndex: 4 }
    ];
    s.groups = [
      { groupId: "G1", playerIds: ["A", "B"], categoryId: "c3", createdIndex: 1 },
      { groupId: "G2", playerIds: ["C", "D"], categoryId: "c3", createdIndex: 2 }
    ];
    s.tables = [{ tableId: "T1", name: "1", seatCount: 4, seats: [null, null, null, null], createdIndex: 1 }];

    const { nextState, summary } = autoPodApply(s);
    expect(summary.totalPlayersSeated).toBe(4);
    expect(nextState.tables[0].seats.filter(Boolean).length).toBe(4);
  });

  it("stable outputs across runs", () => {
    const s = makeState();
    s.players = [
      { playerId: "A", displayName: "A", categoryId: "c3", createdIndex: 1 },
      { playerId: "B", displayName: "B", categoryId: "c4", createdIndex: 2 },
      { playerId: "C", displayName: "C", categoryId: "c3", createdIndex: 3 },
      { playerId: "D", displayName: "D", categoryId: "c2", createdIndex: 4 }
    ];
    s.tables = [
      { tableId: "T1", name: "1", seatCount: 4, seats: [null, null, null, null], createdIndex: 1 }
    ];

    const r1 = autoPodApply(s).nextState.tables[0].seats.join(",");
    const r2 = autoPodApply(s).nextState.tables[0].seats.join(",");
    expect(r1).toBe(r2);
  });
});
