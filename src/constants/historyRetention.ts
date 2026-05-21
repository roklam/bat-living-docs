/** Must match electron/historyRetention.ts `HISTORY_RETENTION_DAYS` */
export const HISTORY_RETENTION_DAYS = 365;
const MS_PER_DAY = 86_400_000;

/** ISO time when we stop showing / storing this event (purge policy). */
export function retentionExpiresAtIso(recordedAtIso: string, days = HISTORY_RETENTION_DAYS): string | null {
  const t = new Date(recordedAtIso).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t + days * MS_PER_DAY).toISOString();
}
