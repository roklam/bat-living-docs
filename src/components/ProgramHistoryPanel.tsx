import { HISTORY_RETENTION_DAYS, retentionExpiresAtIso } from "../constants/historyRetention";
import type { HistoryEntry, Tool } from "../types";
import { summarizeAboutRetention, summarizeExpiresFmt } from "../util/aboutRetentionText";
import { fmtDate } from "../util/format";

function entrySortDesc(a: HistoryEntry, b: HistoryEntry): number {
  return new Date(b.at).getTime() - new Date(a.at).getTime();
}

export function ProgramHistoryPanel({
  entries,
  tools,
  programName,
}: {
  entries: HistoryEntry[];
  tools: Tool[];
  programName: string;
}) {
  const sorted = [...entries].sort(entrySortDesc);
  const days = HISTORY_RETENTION_DAYS;

  return (
    <div className="scroll-y" style={{ flex: 1, paddingRight: 6, minHeight: 0 }}>
      <div
        className="glass-panel"
        style={{
          marginBottom: "1rem",
          padding: "0.85rem 1rem",
          border: "1px solid rgba(110, 231, 255, 0.28)",
          background: "var(--accent-dim)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 6 }}>
          Retention — {days} days
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
          {summarizeAboutRetention(days)} Applies to{" "}
          <strong style={{ color: "var(--text)" }}>{programName}</strong> only in this tab. Older
          events are removed permanently from disk on the next load or catalog save.
        </div>
      </div>

      <p className="mono-sm" style={{ textTransform: "uppercase", marginBottom: "0.65rem" }}>
        Program timeline
      </p>
      {sorted.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          No events in the last {days} days for this program.
        </p>
      ) : (
        sorted.map((e) => {
          const exp = retentionExpiresAtIso(e.at, days);
          return (
            <div
              key={e.id}
              style={{
                padding: "0.65rem 0",
                borderBottom: "1px solid var(--border)",
                fontSize: "0.875rem",
              }}
            >
              <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                Event: {fmtDate(e.at)}
                {e.toolId && (
                  <>
                    {" · "}
                    {tools.find((t) => t.id === e.toolId)?.name ?? "program"}
                  </>
                )}
              </div>
              {exp && (
                <div
                  style={{
                    marginTop: 4,
                    color: "var(--amber)",
                    fontSize: "0.73rem",
                    fontWeight: 600,
                  }}
                >
                  {summarizeExpiresFmt(e.at, exp)}
                </div>
              )}
              <div style={{ marginTop: 6 }}>{e.summary}</div>
            </div>
          );
        })
      )}
    </div>
  );
}
