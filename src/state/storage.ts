import { STORAGE_KEY, AppState } from "./model";
import { zAppState } from "./schema";

export function loadState(): AppState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const val = zAppState.safeParse(parsed);
    if (!val.success) return null;
    // Lightweight migration: normalize default bracket names while preserving IDs/colors.
    const namesByRank: Record<number, string> = {
      1: "Beginner",
      2: "Casual",
      3: "Advanced",
      4: "High Power"
    };
    const migrated = {
      ...val.data,
      categories: val.data.categories.map(c => (namesByRank[c.rank] ? { ...c, name: namesByRank[c.rank] } : c))
    };
    return migrated;
  } catch {
    return null;
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}
