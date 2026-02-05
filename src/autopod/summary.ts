import { AutoPodSummary } from "../state/model";

export function emptySummary(): AutoPodSummary {
  return { moves: [], totalPlayersSeated: 0 };
}

export function addMove(summary: AutoPodSummary, tableId: string, seatedPlayerIds: string[]) {
  if (seatedPlayerIds.length === 0) return summary;
  summary.moves.push({ tableId, seatedPlayerIds: [...seatedPlayerIds] });
  summary.totalPlayersSeated += seatedPlayerIds.length;
}
