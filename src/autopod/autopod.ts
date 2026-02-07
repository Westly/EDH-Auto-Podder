import { AppState, Group, Player, Table, AutoPodSummary } from "../state/model";
import { median, abs } from "../utils/math";
import { emptySummary, addMove } from "./summary";
import { stableStr, tablesSorted } from "../utils/sort";

export type AutoPodMode = "nearest_bottom_up" | "random";

export function autoPodApply(
  state: AppState,
  opts: { mode?: AutoPodMode } = {}
): { nextState: AppState; summary: AutoPodSummary } {
  const mode = opts.mode ?? "nearest_bottom_up";
  return mode === "random" ? autoPodRandom(state) : autoPodNearestBottomUp(state);
}

function autoPodNearestBottomUp(state: AppState): { nextState: AppState; summary: AutoPodSummary } {
  const playersById = new Map(state.players.map(p => [p.playerId, p]));
  const groupsById = new Map(state.groups.map(g => [g.groupId, g]));
  const catRankById = new Map(state.categories.map(c => [c.categoryId, c.rank]));

  const seated = computeSeatedPlayerIds(state.tables);
  const groupContainsSeated = new Set<string>();
  for (const g of state.groups) {
    if (g.playerIds.some(pid => seated.has(pid))) groupContainsSeated.add(g.groupId);
  }

  const playerToGroup = buildPlayerToGroup(state.groups);

  const eligibleSingles: Player[] = state.players
    .filter(p => !seated.has(p.playerId))
    .filter(p => {
      const gid = playerToGroup.get(p.playerId);
      if (!gid) return true;
      return !groupContainsSeated.has(gid);
    });

  const eligibleGroups: Group[] = state.groups
    .filter(g => g.playerIds.length > 0)
    .filter(g => !groupContainsSeated.has(g.groupId))
    .filter(g => g.playerIds.every(pid => !seated.has(pid)));

  const availablePlayerIds = new Set(eligibleSingles.map(p => p.playerId));
  const availableGroupIds = new Set(eligibleGroups.map(g => g.groupId));

  const tables = tablesSorted(state.tables).map(t => ({ ...t, seats: [...t.seats] }));

  const summary = emptySummary();

  const tableTargetRank = (t: Table): number | null => {
    const ranks: number[] = [];
    for (const pid of t.seats) {
      if (!pid) continue;
      const p = playersById.get(pid);
      if (!p) continue;
      const r = catRankById.get(p.categoryId);
      if (typeof r === "number") ranks.push(r);
    }
    if (ranks.length === 0) return null;
    return median(ranks);
  };

  const groupRank = (g: Group): number => catRankById.get(g.categoryId) ?? 999;
  const playerRank = (p: Player): number => catRankById.get(p.categoryId) ?? 999;

  const openSeatCount = (t: Table) => t.seats.filter(s => !s).length;

  const seatPlayersIntoTable = (t: Table, playerIds: string[]) => {
    const empties: number[] = [];
    for (let i = 0; i < t.seats.length; i++) if (!t.seats[i]) empties.push(i);
    const seatedNow: string[] = [];
    for (let i = 0; i < playerIds.length; i++) {
      const idx = empties[i];
      if (idx === undefined) break;
      t.seats[idx] = playerIds[i];
      seatedNow.push(playerIds[i]);
    }
    addMove(summary, t.tableId, seatedNow);
  };

  const removeGroupFromAvailable = (gid: string) => {
    const g = groupsById.get(gid);
    if (!g) return;
    availableGroupIds.delete(gid);
    for (const pid of g.playerIds) availablePlayerIds.delete(pid);
  };
  const removePlayerFromAvailable = (pid: string) => {
    availablePlayerIds.delete(pid);
  };

  const groupsStable = () =>
    [...availableGroupIds]
      .map(id => groupsById.get(id)!)
      .filter(Boolean)
      .sort((a, b) => {
        const ra = groupRank(a);
        const rb = groupRank(b);
        const sa = a.playerIds.length;
        const sb = b.playerIds.length;
        const na = groupName(a, playersById);
        const nb = groupName(b, playersById);
        return (ra - rb) || (sb - sa) || stableStr(na, nb) || stableStr(a.groupId, b.groupId);
      });

  const singlesStable = () =>
    [...availablePlayerIds]
      .map(id => playersById.get(id)!)
      .filter(Boolean)
      .sort((a, b) => {
        const ra = playerRank(a);
        const rb = playerRank(b);
        return (ra - rb) || stableStr(a.displayName, b.displayName) || (a.createdIndex - b.createdIndex) || stableStr(a.playerId, b.playerId);
      });

  // Step B: exact-fit groups / groups of 4 first
  for (const t of tables) {
    const open = openSeatCount(t);
    if (open <= 0) continue;

    const target = tableTargetRank(t);
    const candidates = groupsStable()
      .filter(g => g.playerIds.length === open || (g.playerIds.length === 4 && t.seats.every(s => !s) && open >= 4))
      .map(g => ({
        g,
        dist: target === null ? groupRank(g) : abs(groupRank(g) - target)
      }))
      .sort((a, b) => {
        return (a.dist - b.dist)
          || (b.g.playerIds.length - a.g.playerIds.length)
          || stableStr(groupName(a.g, playersById), groupName(b.g, playersById))
          || stableStr(a.g.groupId, b.g.groupId);
      });

    const pick = candidates[0]?.g;
    if (pick) {
      seatPlayersIntoTable(t, [...pick.playerIds]);
      removeGroupFromAvailable(pick.groupId);
    }
  }

  // Step C: pair 2+2
  for (const t of tables) {
    if (!t.seats.every(s => !s)) continue;
    if (openSeatCount(t) < 4) continue;

    const twos = groupsStable().filter(g => g.playerIds.length === 2);
    if (twos.length < 2) continue;

    const g1 = twos[0];
    const r1 = groupRank(g1);
    const g2 = twos
      .slice(1)
      .map(g => ({ g, dist: abs(groupRank(g) - r1) }))
      .sort((a, b) =>
        (a.dist - b.dist)
        || stableStr(groupName(a.g, playersById), groupName(b.g, playersById))
        || stableStr(a.g.groupId, b.g.groupId)
      )[0]?.g;

    if (!g2) continue;

    seatPlayersIntoTable(t, [...g1.playerIds, ...g2.playerIds]);
    removeGroupFromAvailable(g1.groupId);
    removeGroupFromAvailable(g2.groupId);
  }

  // Step D: groups of 3
  for (const t of tables) {
    const open = openSeatCount(t);
    if (open < 3) continue;

    const target = tableTargetRank(t);
    const candidates = groupsStable()
      .filter(g => g.playerIds.length === 3 && g.playerIds.length <= open)
      .map(g => ({ g, dist: target === null ? groupRank(g) : abs(groupRank(g) - target) }))
      .sort((a, b) =>
        (a.dist - b.dist)
        || stableStr(groupName(a.g, playersById), groupName(b.g, playersById))
        || stableStr(a.g.groupId, b.g.groupId)
      );

    const pick = candidates[0]?.g;
    if (pick) {
      seatPlayersIntoTable(t, [...pick.playerIds]);
      removeGroupFromAvailable(pick.groupId);
    }
  }

  // Step E: fill remaining seats
  for (const t of tables) {
    while (openSeatCount(t) > 0) {
      const open = openSeatCount(t);
      const target = tableTargetRank(t);

      const groupFits = groupsStable().filter(g => g.playerIds.length <= open);
      const singles = singlesStable();

      type Cand =
        | { kind: "single"; player: Player; dist: number; waste: number }
        | { kind: "group"; group: Group; dist: number; waste: number };

      const cands: Cand[] = [];

      for (const p of singles) {
        const dist = target === null ? playerRank(p) : abs(playerRank(p) - target);
        cands.push({ kind: "single", player: p, dist, waste: open - 1 });
      }
      for (const g of groupFits) {
        const dist = target === null ? groupRank(g) : abs(groupRank(g) - target);
        const waste = open - g.playerIds.length;
        cands.push({ kind: "group", group: g, dist, waste });
      }

      if (cands.length === 0) break;

      cands.sort((a, b) => {
        const d = a.dist - b.dist;
        if (d) return d;

        const w = a.waste - b.waste;
        if (w) return w;

        const sa = a.kind === "group" ? a.group.playerIds.length : 1;
        const sb = b.kind === "group" ? b.group.playerIds.length : 1;
        const s = sb - sa;
        if (s) return s;

        const na = a.kind === "group" ? groupName(a.group, playersById) : a.player.displayName;
        const nb = b.kind === "group" ? groupName(b.group, playersById) : b.player.displayName;
        const n = stableStr(na, nb);
        if (n) return n;

        const ida = a.kind === "group" ? a.group.groupId : a.player.playerId;
        const idb = b.kind === "group" ? b.group.groupId : b.player.playerId;
        return stableStr(ida, idb);
      });

      const pick = cands[0];
      if (pick.kind === "single") {
        seatPlayersIntoTable(t, [pick.player.playerId]);
        removePlayerFromAvailable(pick.player.playerId);
      } else {
        seatPlayersIntoTable(t, [...pick.group.playerIds]);
        removeGroupFromAvailable(pick.group.groupId);
      }
    }
  }

  const nextState: AppState = {
    ...state,
    tables: state.tables.map(orig => {
      const updated = tables.find(t => t.tableId === orig.tableId);
      return updated ? { ...orig, seats: [...updated.seats], seatCount: updated.seatCount } : orig;
    })
  };

  return { nextState, summary };
}

function autoPodRandom(state: AppState): { nextState: AppState; summary: AutoPodSummary } {
  const playersById = new Map(state.players.map(p => [p.playerId, p]));
  const groupsById = new Map(state.groups.map(g => [g.groupId, g]));

  const seated = computeSeatedPlayerIds(state.tables);
  const groupContainsSeated = new Set<string>();
  for (const g of state.groups) {
    if (g.playerIds.some(pid => seated.has(pid))) groupContainsSeated.add(g.groupId);
  }

  const playerToGroup = buildPlayerToGroup(state.groups);

  // Eligible = unseated singles not in a "locked" (contains seated) group + groups with no seated members.
  const eligibleSingles: Player[] = state.players
    .filter(p => !seated.has(p.playerId))
    .filter(p => {
      const gid = playerToGroup.get(p.playerId);
      if (!gid) return true;
      return !groupContainsSeated.has(gid);
    });

  const eligibleGroups: Group[] = state.groups
    .filter(g => g.playerIds.length > 0)
    .filter(g => !groupContainsSeated.has(g.groupId))
    .filter(g => g.playerIds.every(pid => !seated.has(pid)));

  const availablePlayerIds = new Set(eligibleSingles.map(p => p.playerId));
  const availableGroupIds = new Set(eligibleGroups.map(g => g.groupId));

  const tables = tablesSorted(state.tables).map(t => ({ ...t, seats: [...t.seats] }));
  const summary = emptySummary();

  const openSeatIndexes = (t: Table) => {
    const idxs: number[] = [];
    for (let i = 0; i < t.seats.length; i++) if (!t.seats[i]) idxs.push(i);
    return idxs;
  };

  const seatPlayersIntoTable = (t: Table, playerIds: string[]) => {
    const open = openSeatIndexes(t);
    const seatedNow: string[] = [];
    for (let i = 0; i < playerIds.length; i++) {
      const idx = open[i];
      if (idx === undefined) break;
      t.seats[idx] = playerIds[i];
      seatedNow.push(playerIds[i]);
    }
    addMove(summary, t.tableId, seatedNow);
  };

  const removeGroup = (gid: string) => {
    const g = groupsById.get(gid);
    if (!g) return;
    availableGroupIds.delete(gid);
    for (const pid of g.playerIds) availablePlayerIds.delete(pid);
  };

  // Shuffle tables for randomness.
  const tableOrder = shuffle([...tables]);

  // 1) Seat groups in random order where they fit.
  const groupOrder = shuffle([...availableGroupIds].map(id => groupsById.get(id)!).filter(Boolean));
  for (const g of groupOrder) {
    if (!availableGroupIds.has(g.groupId)) continue;
    const fits = tableOrder.filter(t => openSeatIndexes(t).length >= g.playerIds.length);
    if (fits.length === 0) continue;
    const t = fits[Math.floor(Math.random() * fits.length)];
    seatPlayersIntoTable(t, [...g.playerIds]);
    removeGroup(g.groupId);
  }

  // 2) Seat remaining singles randomly into remaining open seats.
  const remainingPlayers = shuffle([...availablePlayerIds].map(id => playersById.get(id)!).filter(Boolean));
  let pIndex = 0;
  for (const t of tableOrder) {
    const open = openSeatIndexes(t);
    if (open.length === 0) continue;
    const toSeat: string[] = [];
    for (let i = 0; i < open.length && pIndex < remainingPlayers.length; i++) {
      toSeat.push(remainingPlayers[pIndex].playerId);
      pIndex += 1;
    }
    if (toSeat.length) seatPlayersIntoTable(t, toSeat);
  }

  const nextState: AppState = {
    ...state,
    tables: state.tables.map(orig => {
      const updated = tables.find(t => t.tableId === orig.tableId);
      return updated ? { ...orig, seats: [...updated.seats], seatCount: updated.seatCount } : orig;
    })
  };

  return { nextState, summary };
}

function computeSeatedPlayerIds(tables: Table[]) {
  const set = new Set<string>();
  for (const t of tables) for (const s of t.seats) if (s) set.add(s);
  return set;
}

function buildPlayerToGroup(groups: Group[]) {
  const m = new Map<string, string>();
  for (const g of groups) for (const pid of g.playerIds) m.set(pid, g.groupId);
  return m;
}

function groupName(g: Group, playersById: Map<string, Player>) {
  const label = g.label?.trim();
  if (label) return label;
  const names = g.playerIds.map(pid => playersById.get(pid)?.displayName || "").filter(Boolean).sort(stableStr);
  return names.join(" + ") || "Group";
}

function shuffle<T>(arr: T[]): T[] {
  // Fisher-Yates
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}
