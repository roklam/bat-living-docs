import { fmtDate } from "./format";

export type AboutInfo = {
  name: string;
  version: string;
  description: string;
  historyRetentionDays: number;
};

export function summarizeAboutRetention(days: number): string {
  return `Program and global timeline entries are retained for ${days} days from each event timestamp, then dropped from the catalog file automatically.`;
}

export function summarizeExpiresFmt(recordedAtIso: string, expiresIso: string): string {
  return `Dropped from disk on or before ${fmtDate(expiresIso)} (event recorded ${fmtDate(recordedAtIso)})`;
}
