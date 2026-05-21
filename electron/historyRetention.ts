/** Global policy: prune catalog history entries older than this many days */
export const HISTORY_RETENTION_DAYS = 365;
const MS_PER_DAY = 86_400_000;

/**
 * Drops history entries strictly older than the retention window.
 * Uses wall-clock approximation: retentionDays × 86400000 ms from now.
 */
export function purgeExpiredHistory(data: {
  history: { at: string }[];
}): number {
  const cutoff = Date.now() - HISTORY_RETENTION_DAYS * MS_PER_DAY;
  const before = data.history.length;
  data.history = data.history.filter((e) => {
    const t = new Date(e.at).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });
  return before - data.history.length;
}

export function expiryIso(eventAtIso: string): string | null {
  const t = new Date(eventAtIso).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t + HISTORY_RETENTION_DAYS * MS_PER_DAY).toISOString();
}
