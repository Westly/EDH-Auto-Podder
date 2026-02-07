import { AppState, AutoPodSummary, Group, Player, Table } from "./model";
import { uuid } from "../utils/ids";
import { toast } from "../components/Toasts";

export type Action =
  | { type: "ADD_TABLE" }
  | { type: "ADD_TABLES"; count: number }
  | { type: "REMOVE_TABLE"; tableId: string }
  | { type: "RENAME_TABLE"; tableId: string; name: string }
  | { type: "ADD_SEAT"; tableId: string }
  | { type: "REMOVE_SEAT"; tableId: string; mode: "BLOCK" | "UNSEAT_EXCESS" }
  | { type: "UNSEAT_PLAYER"; playerId: string }
  | { type: "CLEAR_SEAT"; tableId: string; seatIndex: number }
  | { type: "ASSIGN_PLAYER_TO_SEAT"; tableId: string; seatIndex: number; playerId: string }
  | { type: "SEAT_GROUP_ON_TABLE"; tableId: string; groupId: string }
  | { type: "ADD_PLAYER"; displayName: string; categoryId: string }
  | { type: "REMOVE_PLAYER"; playerId: string }
  | { type: "SET_PLAYER_CATEGORY"; playerId: string; categoryId: string }
  | { type: "SET_GROUP_CATEGORY"; groupId: string; categoryId: string }
  | { type: "ADD_EMPTY_GROUP"; categoryId: string }
  | { type: "RENAME_GROUP"; groupId: string; label: string }
  | { type: "DELETE_GROUP"; groupId: string }
  | { type: "ADD_PLAYER_TO_GROUP"; groupId: string; playerId: string }
  | { type: "REMOVE_PLAYER_FROM_GROUP"; playerId: string }
  | { type: "GROUP_PLAYERS_BY_DROP"; aPlayerId: string; bPlayerId: string } // drag player onto player
  | { type: "LOAD_STATE_SNAPSHOT"; snapshot: AppState }
  | { type: "SET_LAST_AUTOPOD_SUMMARY"; summary: AutoPodSummary | undefined }
  | { type: "IMPORT_STATE"; snapshot: AppState };

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_TABLE":
      return addTables(state, 1);

    case "ADD_TABLES": {
      const n = Math.max(1, Math.min(50, Math.floor(action.count)));
      return addTables(state, n);
    }

    case "REMOVE_TABLE": {
      return { ...state, tables: state.tables.filter(t => t.tableId !== action.tableId) };
    }

    case "RENAME_TABLE": {
      return { ...state, tables: state.tables.map(t => (t.tableId === action.tableId ? { ...t, name: action.name } : t)) };
    }

    case "ADD_SEAT": {
      return {
        ...state,
        tables: state.tables.map(t => {
          if (t.tableId !== action.tableId) return t;
          return { ...t, seatCount: t.seatCount + 1, seats: [...t.seats, null] };
        })
      };
    }

    case "REMOVE_SEAT": {
      return {
        ...state,
        tables: state.tables.map(t => {
          if (t.tableId !== action.tableId) return t;
          if (t.seatCount <= 1) return t;

          const newCount = t.seatCount - 1;
          const lastSeat = t.seats[newCount];
          if (lastSeat && action.mode === "BLOCK") {
            toast("Can't: last seat occupied.");
            return t;
          }
          const nextSeats = t.seats.slice(0, newCount);
          return { ...t, seatCount: newCount, seats: nextSeats };
        })
      };
    }

    case "CLEAR_SEAT": {
      return {
        ...state,
        tables: state.tables.map(t => {
          if (t.tableId !== action.tableId) return t;
          const seats = [...t.seats];
          seats[action.seatIndex] = null;
          return { ...t, seats };
        })
      };
    }

    case "ASSIGN_PLAYER_TO_SEAT": {
      const table = state.tables.find(t => t.tableId === action.tableId);
      if (!table) return state;
      if (table.seats[action.seatIndex]) {
        toast("Seat occupied.");
        return state;
      }
      const tables = state.tables.map(t => {
        const seats = t.seats.map(pid => (pid === action.playerId ? null : pid));
        if (t.tableId !== action.tableId) return { ...t, seats };
        seats[action.seatIndex] = action.playerId;
        return { ...t, seats };
      });
      return { ...state, tables };
    }

    case "UNSEAT_PLAYER": {
      const tables = state.tables.map(t => ({ ...t, seats: t.seats.map(pid => (pid === action.playerId ? null : pid)) }));
      return { ...state, tables };
    }

    case "ADD_PLAYER": {
      const normalized = normalizeName(action.displayName);
      if (!normalized) {
        toast("Enter a name.");
        return state;
      }

      // Prevent duplicate player names (case-insensitive, trimmed).
      const existing = state.players.find(p => normalizeName(p.displayName) === normalized);
      if (existing) {
        toast("Duplicate name not allowed.");
        return state;
      }

      const ci = state.counters.createdIndex + 1;
      const next: Player = {
        playerId: uuid(),
        displayName: action.displayName.trim() || "Player",
        categoryId: action.categoryId,
        createdIndex: ci
      };
      return { ...state, counters: { createdIndex: ci }, players: [...state.players, next] };
    }

    case "REMOVE_PLAYER": {
      const tables = state.tables.map(t => ({ ...t, seats: t.seats.map(pid => (pid === action.playerId ? null : pid)) }));
      const groups = state.groups
        .map(g => ({ ...g, playerIds: g.playerIds.filter(id => id !== action.playerId) }))
        .filter(g => g.playerIds.length > 0);
      return { ...state, tables, groups, players: state.players.filter(p => p.playerId !== action.playerId) };
    }

    case "SET_PLAYER_CATEGORY": {
      return { ...state, players: state.players.map(p => (p.playerId === action.playerId ? { ...p, categoryId: action.categoryId } : p)) };
    }

    case "SET_GROUP_CATEGORY": {
      return { ...state, groups: state.groups.map(g => (g.groupId === action.groupId ? { ...g, categoryId: action.categoryId } : g)) };
    }

    case "ADD_EMPTY_GROUP": {
      const ci = state.counters.createdIndex + 1;
      const next: Group = {
        groupId: uuid(),
        playerIds: [],
        categoryId: action.categoryId,
        label: "",
        createdIndex: ci
      };
      return { ...state, counters: { createdIndex: ci }, groups: [...state.groups, next] };
    }

    case "RENAME_GROUP": {
      return { ...state, groups: state.groups.map(g => (g.groupId === action.groupId ? { ...g, label: action.label } : g)) };
    }

    case "DELETE_GROUP": {
      return { ...state, groups: state.groups.filter(g => g.groupId !== action.groupId) };
    }

    // Drag a player onto a group box
    case "ADD_PLAYER_TO_GROUP": {
      const existing = findGroupIdForPlayer(state.groups, action.playerId);
      if (existing) {
        toast("Player already grouped.");
        return state;
      }
      return {
        ...state,
        groups: state.groups.map(g => {
          if (g.groupId !== action.groupId) return g;
          return { ...g, playerIds: [...g.playerIds, action.playerId] };
        })
      };
    }

    // Drag a player onto another player => group/merge (no mode)
    case "GROUP_PLAYERS_BY_DROP": {
      const a = action.aPlayerId;
      const b = action.bPlayerId;
      if (a === b) return state;

      const ga = findGroupIdForPlayer(state.groups, a);
      const gb = findGroupIdForPlayer(state.groups, b);

      // none -> create new group
      if (!ga && !gb) {
        const ci = state.counters.createdIndex + 1;
        const gid = uuid();
        const cat = pickDefaultGroupCategory(state);
        const g: Group = { groupId: gid, playerIds: [a, b], categoryId: cat, label: "", createdIndex: ci };
        return { ...state, counters: { createdIndex: ci }, groups: [...state.groups, g] };
      }

      // one group -> add other
      if (ga && !gb) {
        return { ...state, groups: state.groups.map(g => (g.groupId === ga ? { ...g, playerIds: uniq([...g.playerIds, b]) } : g)) };
      }
      if (!ga && gb) {
        return { ...state, groups: state.groups.map(g => (g.groupId === gb ? { ...g, playerIds: uniq([...g.playerIds, a]) } : g)) };
      }

      // both in groups -> merge into older group (deterministic)
      if (ga && gb && ga !== gb) {
        const g1 = state.groups.find(g => g.groupId === ga)!;
        const g2 = state.groups.find(g => g.groupId === gb)!;
        const keep = g1.createdIndex <= g2.createdIndex ? g1 : g2;
        const drop = keep.groupId === g1.groupId ? g2 : g1;

        const mergedIds = uniq([...keep.playerIds, ...drop.playerIds]);
        const groups = state.groups
          .filter(g => g.groupId !== drop.groupId)
          .map(g => (g.groupId === keep.groupId ? { ...g, playerIds: mergedIds } : g));
        return { ...state, groups };
      }

      return state;
    }

    case "REMOVE_PLAYER_FROM_GROUP": {
      const groups = state.groups
        .map(g => ({ ...g, playerIds: g.playerIds.filter(id => id !== action.playerId) }))
        .filter(g => g.playerIds.length > 0);
      return { ...state, groups };
    }

    case "SEAT_GROUP_ON_TABLE": {
      const group = state.groups.find(g => g.groupId === action.groupId);
      const table = state.tables.find(t => t.tableId === action.tableId);
      if (!group || !table) return state;

      const open = table.seats.map((v, idx) => (v ? null : idx)).filter((v): v is number => v !== null);
      if (open.length < group.playerIds.length) {
        toast("Not enough open seats.");
        return state;
      }

      const seats = [...table.seats];
      const members = [...group.playerIds];
      for (let i = 0; i < members.length; i++) seats[open[i]] = members[i];

      const tables = state.tables.map(t => {
        let nextSeats = t.seats.map(pid => (members.includes(pid || "") ? null : pid));
        if (t.tableId === table.tableId) nextSeats = seats;
        return { ...t, seats: nextSeats };
      });

      return { ...state, tables };
    }

    case "LOAD_STATE_SNAPSHOT": {
      return action.snapshot;
    }

    case "SET_LAST_AUTOPOD_SUMMARY": {
      return { ...state, lastAutoPodSummary: action.summary };
    }

    case "IMPORT_STATE": {
      return action.snapshot;
    }

    default:
      return state;
  }
}

function addTables(state: AppState, count: number): AppState {
  let ci = state.counters.createdIndex;
  const nextTables: Table[] = [];
  const startNumber = nextTableNumber(state.tables);

  for (let i = 0; i < count; i++) {
    ci += 1;
    const tableId = uuid();
    nextTables.push({
      tableId,
      name: String(startNumber + i),
      seatCount: 4,
      seats: [null, null, null, null],
      createdIndex: ci
    });
  }

  return { ...state, counters: { createdIndex: ci }, tables: [...state.tables, ...nextTables] };
}

function nextTableNumber(tables: Table[]): number {
  const nums = tables
    .map(t => Number(String(t.name).trim()))
    .filter(n => Number.isFinite(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return max + 1;
}

function findGroupIdForPlayer(groups: Group[], playerId: string): string | null {
  for (const g of groups) if (g.playerIds.includes(playerId)) return g.groupId;
  return null;
}

function pickDefaultGroupCategory(state: AppState): string {
  const byRank3 = state.categories.find(c => c.rank === 3);
  return byRank3?.categoryId ?? state.categories[0]?.categoryId ?? "";
}

function uniq(arr: string[]) {
  const s = new Set<string>();
  const out: string[] = [];
  for (const x of arr) if (!s.has(x)) { s.add(x); out.push(x); }
  return out;
}

function normalizeName(name: string): string {
  return (name ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
