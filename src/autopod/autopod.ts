import { AppState, Group, Player, Table, AutoPodSummary, UUID } from "../state/model";
import { median, abs } from "../utils/math";
import { emptySummary, addMove } from "./summary";
import { tablesSorted } from "../utils/sort";

/**
 * Auto pod rules (always on):
 * - Never moves already-seated players (only fills null seats).
 * - Fills tables in ascending table name/number order (tablesSorted()).
 * - Fills seats sequentially (first empty seat, then next).
 * - "Nearest peer" is always applied, but ties/randomness happen *within* equally-good choices.
 * - Groups are treated as atomic units when eligible (members cannot also be seated as singles).
 * - Defensive: if state is already corrupt (same player in multiple seats), we sanitize by keeping the
 *   first occurrence and clearing later duplicates.
 */
export function autoPodApply(state: AppState): { nextState: AppState; summary: AutoPodSummary } {
  const playersById = new Map<UUID, Player>(state.players.map(p => [p.playerId, p]));
  const groupsById = new Map<UUID, Group>(state.groups.map(g => [g.groupId, g]));
  const catRankById = new Map<UUID, number>(state.categories.map(c => [c.categoryId, c.rank]));

  // Work on a deep copy of sorted tables.
  const tables: Table[] = tablesSorted(state.tables).map(t => ({ ...t, seats: [...t.seats] }));

  // Sanitize any pre-existing corruption: a player appears in more than one seat.
  sanitizeTablesUnique(tables);

  const initiallySeated = computeSeatedPlayerIds(tables);

  // Map each player -> group (if any). If data has duplicates, first wins.
  const playerToGroup = buildPlayerToGroup(state.groups);

  // Determine which groups are eligible to be seated as groups:
  // - all members exist
  // - all members are currently unseated
  // - group has 2+ members (1-member group is pointless; treat as single)
  const eligibleGroupIds = new Set<UUID>();
  for (const g of state.groups) {
    if (g.playerIds.length < 2) continue;

    // Must have resolvable ranks for sensible pairing; but don't block if missing category, just default.
    const allMembersExist = g.playerIds.every(pid => playersById.has(pid));
    if (!allMembersExist) continue;

    const anyMemberSeated = g.playerIds.some(pid => initiallySeated.has(pid));
    if (anyMemberSeated) continue;

    eligibleGroupIds.add(g.groupId);
  }

  // Singles are players who are unseated and NOT part of any eligible group.
  const remainingSingles = new Set<UUID>();
  for (const p of state.players) {
    if (initiallySeated.has(p.playerId)) continue;

    const gid = playerToGroup.get(p.playerId);
    if (gid && eligibleGroupIds.has(gid)) {
      // This player must be seated only via their group.
      continue;
    }
    remainingSingles.add(p.playerId);
  }

  // Remaining groups
  const remainingGroups = new Set<UUID>(eligibleGroupIds);

  const summary = emptySummary();

  // Helper: rank resolution
  const rankOfPlayerId = (pid: UUID): number => {
    const p = playersById.get(pid);
    if (!p) return 999;
    const r = catRankById.get(p.categoryId);
    return typeof r === "number" ? r : 999;
  };

  const rankOfGroupId = (gid: UUID): number => {
    const g = groupsById.get(gid);
    if (!g) return 999;
    // Prefer average of member ranks if possible (more accurate than group.categoryId if user mixed categories)
    const rs = g.playerIds.map(rankOfPlayerId).filter(r => Number.isFinite(r));
    if (rs.length) {
      const sum = rs.reduce((a, b) => a + b, 0);
      return sum / rs.length;
    }
    const r = catRankById.get(g.categoryId);
    return typeof r === "number" ? r : 999;
  };

  const tableRanks = (t: Table): number[] => {
    const rs: number[] = [];
    for (const pid of t.seats) {
      if (!pid) continue;
      rs.push(rankOfPlayerId(pid));
    }
    return rs;
  };

  const openSeatIndexes = (t: Table): number[] => {
    const idxs: number[] = [];
    for (let i = 0; i < t.seats.length; i++) if (!t.seats[i]) idxs.push(i);
    return idxs;
  };

  const lowestAvailableRank = (): number | null => {
    let best: number | null = null;
    for (const pid of remainingSingles) {
      const r = rankOfPlayerId(pid);
      if (best === null || r < best) best = r;
    }
    for (const gid of remainingGroups) {
      const r = rankOfGroupId(gid);
      if (best === null || r < best) best = r;
    }
    return best;
  };

  type Unit =
    | { kind: "single"; pid: UUID; size: 1; unitRank: number; memberRanks: number[] }
    | { kind: "group"; gid: UUID; size: number; unitRank: number; memberRanks: number[] };

  const listCandidateUnits = (open: number): Unit[] => {
    const units: Unit[] = [];
    for (const pid of remainingSingles) {
      if (open < 1) continue;
      const r = rankOfPlayerId(pid);
      units.push({ kind: "single", pid, size: 1, unitRank: r, memberRanks: [r] });
    }
    for (const gid of remainingGroups) {
      const g = groupsById.get(gid);
      if (!g) continue;
      if (g.playerIds.length > open) continue;

      // Safety: group should still be fully available.
      const allMembersStillFree = g.playerIds.every(pid => remainingSingles.has(pid) || (!playerToGroup.get(pid) || playerToGroup.get(pid) === gid));
      // The line above isn't perfect, so do a stronger check: ensure none of its members are seated anywhere.
      // We'll rely on used set below to prevent duplicates; here we just ensure group isn't already consumed.
      if (!allMembersStillFree) {
        // Even if this check fails, we can still allow group selection if none of its members were seated already;
        // but since the members of eligible groups were removed from remainingSingles initially, this should rarely happen.
      }

      const rs = g.playerIds.map(rankOfPlayerId);
      const avg = rs.reduce((a, b) => a + b, 0) / rs.length;
      units.push({ kind: "group", gid, size: g.playerIds.length, unitRank: avg, memberRanks: rs });
    }
    return units;
  };

  // Tracks every player placed during this run to guarantee uniqueness.
  const used = new Set<UUID>(initiallySeated);

  const seatUnit = (t: Table, unit: Unit) => {
    const empties = openSeatIndexes(t);
    if (empties.length < unit.size) return;

    const seatedNow: UUID[] = [];

    if (unit.kind === "single") {
      const idx = empties[0];
      t.seats[idx] = unit.pid;
      seatedNow.push(unit.pid);
      used.add(unit.pid);
      remainingSingles.delete(unit.pid);
    } else {
      const g = groupsById.get(unit.gid);
      if (!g) return;

      // Shuffle members for variety, but seat into sequential empty seats.
      const members = [...g.playerIds];
      shuffleInPlace(members);

      for (let i = 0; i < members.length; i++) {
        const pid = members[i];
        const seatIdx = empties[i];
        if (seatIdx === undefined) break;

        // HARD invariant: never seat a player twice.
        if (used.has(pid)) continue;

        t.seats[seatIdx] = pid;
        seatedNow.push(pid);
        used.add(pid);
      }

      // Remove group + members from remaining sets so they can't be reused.
      remainingGroups.delete(unit.gid);
      for (const pid of g.playerIds) {
        remainingSingles.delete(pid); // in case any slipped in due to malformed state
      }
    }

    if (seatedNow.length) addMove(summary, t.tableId, seatedNow);
  };

  // Core loop: fill tables in order; fill seats in order; choose best-nearest unit each time.
  for (const t of tables) {
    while (openSeatIndexes(t).length > 0) {
      const empties = openSeatIndexes(t);
      const open = empties.length;
      if (open <= 0) break;

      const currentRanks = tableRanks(t);
      const currentMedian = currentRanks.length ? median(currentRanks) : null;
      const baseline = currentMedian ?? lowestAvailableRank();
      if (baseline === null) break; // nothing left to seat

      // Build candidate units that fit.
      const candidates = listCandidateUnits(open).filter(u => {
        // Exclude anything that would seat a used player.
        if (u.kind === "single") return !used.has(u.pid);
        const g = groupsById.get(u.gid);
        if (!g) return false;
        return g.playerIds.every(pid => !used.has(pid));
      });

      if (!candidates.length) break;

      // Score candidates:
      // Primary: minimize resulting rank range (keeps pods tight)
      // Secondary: minimize distance to baseline (nearest peer)
      // Tertiary: minimize waste (prefer filling seats efficiently)
      // Final: random among ties
      const scored = candidates.map(u => {
        const newRanks = currentRanks.concat(u.memberRanks);
        const rMin = Math.min(...newRanks);
        const rMax = Math.max(...newRanks);
        const range = rMax - rMin;

        const dist = abs(u.unitRank - baseline);

        const waste = open - u.size;

        // Weighted sum. Range dominates to avoid 1+4 when 2/3 exist.
        const score = range * 1000 + dist * 100 + waste * 10;

        return { u, range, dist, waste, score };
      });

      scored.sort((a, b) => a.score - b.score);

      const bestScore = scored[0].score;
      const best = scored.filter(x => x.score === bestScore);

      const pick = best[Math.floor(Math.random() * best.length)].u;

      seatUnit(t, pick);
    }
  }

  // Final safety: ensure uniqueness (should always hold). If not, sanitize.
  sanitizeTablesUnique(tables);

  const nextState: AppState = {
    ...state,
    tables,
    lastAutoPodSummary: summary
  };

  return { nextState, summary };
}

function sanitizeTablesUnique(tables: Table[]) {
  const seen = new Set<UUID>();
  for (const t of tables) {
    for (let i = 0; i < t.seats.length; i++) {
      const pid = t.seats[i];
      if (!pid) continue;
      if (seen.has(pid)) {
        t.seats[i] = null;
      } else {
        seen.add(pid);
      }
    }
  }
}

function computeSeatedPlayerIds(tables: Table[]): Set<UUID> {
  const s = new Set<UUID>();
  for (const t of tables) for (const pid of t.seats) if (pid) s.add(pid);
  return s;
}

function buildPlayerToGroup(groups: Group[]): Map<UUID, UUID> {
  const m = new Map<UUID, UUID>();
  for (const g of groups) {
    for (const pid of g.playerIds) {
      if (!m.has(pid)) m.set(pid, g.groupId);
    }
  }
  return m;
}

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}
