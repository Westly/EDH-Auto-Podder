import { Category, Player, Group, Table } from "../state/model";

export function byNumberAsc(a: number, b: number) {
  return a - b;
}

export function stableStr(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function catByRankThenName(categories: Category[]) {
  return [...categories].sort(
    (a, b) =>
      a.rank - b.rank ||
      stableStr(a.name, b.name) ||
      a.createdIndex - b.createdIndex
  );
}

export function playersSorted(players: Player[], categoryById: Map<string, Category>) {
  return [...players].sort((a, b) => {
    const ra = categoryById.get(a.categoryId)?.rank ?? 999;
    const rb = categoryById.get(b.categoryId)?.rank ?? 999;
    return (
      ra - rb ||
      stableStr(a.displayName, b.displayName) ||
      a.createdIndex - b.createdIndex ||
      stableStr(a.playerId, b.playerId)
    );
  });
}

export function groupsSorted(groups: Group[], playersById: Map<string, Player>, categoryById: Map<string, Category>) {
  return [...groups].sort((a, b) => {
    const ra = categoryById.get(a.categoryId)?.rank ?? 999;
    const rb = categoryById.get(b.categoryId)?.rank ?? 999;
    const sa = a.playerIds.length;
    const sb = b.playerIds.length;
    const la = a.label || groupFallbackName(a, playersById);
    const lb = b.label || groupFallbackName(b, playersById);
    return (
      ra - rb ||
      sb - sa ||
      stableStr(la, lb) ||
      a.createdIndex - b.createdIndex ||
      stableStr(a.groupId, b.groupId)
    );
  });
}

export function groupFallbackName(g: Group, playersById: Map<string, Player>) {
  const names = g.playerIds
    .map(id => playersById.get(id)?.displayName || "")
    .filter(Boolean)
    .sort(stableStr);
  return names.join(" + ") || "Group";
}

export function tablesSorted(tables: Table[]) {
  return [...tables].sort((a, b) => {
    const na = extractLeadingNumber(a.name);
    const nb = extractLeadingNumber(b.name);
    if (na !== null && nb !== null) return na - nb || stableStr(a.name, b.name) || a.createdIndex - b.createdIndex;
    if (na !== null) return -1;
    if (nb !== null) return 1;
    return stableStr(a.name, b.name) || a.createdIndex - b.createdIndex;
  });
}

function extractLeadingNumber(s: string): number | null {
  const m = s.trim().match(/^(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}
