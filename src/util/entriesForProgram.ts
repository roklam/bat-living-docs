import type { AppData, HistoryEntry } from "../types";

/**
 * Catalog history rows for one program (its tool events + link rows for links on that tool).
 */
export function entriesForProgram(data: AppData, toolId: string): HistoryEntry[] {
  const linkIds = new Set(data.links.filter((l) => l.toolId === toolId).map((l) => l.id));
  return data.history.filter(
    (e) => e.toolId === toolId || (!!e.linkId && linkIds.has(e.linkId)),
  );
}
