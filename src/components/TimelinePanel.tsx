import { fmtDate } from "../util/format";
import type { HistoryEntry, Tool } from "../types";

export function TimelinePanel({
  entries,
  tools,
}: {
  entries: HistoryEntry[];
  tools: Tool[];
}) {
  return (
    <div className="scroll-y" style={{ flex: 1, paddingRight: 6 }}>
      <p className="mono-sm" style={{ textTransform: "uppercase", marginBottom: "0.75rem" }}>
        Change log
      </p>
      {entries.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Moves you make appear here permanently. Removals become audit entries, not deletions from
          the record.
        </p>
      ) : (
        entries.map((e) => (
          <div
            key={e.id}
            style={{
              padding: "0.65rem 0",
              borderBottom: "1px solid var(--border)",
              fontSize: "0.875rem",
            }}
          >
            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              {fmtDate(e.at)}
              {e.toolId && (
                <>
                  {" · "}
                  {tools.find((t) => t.id === e.toolId)?.name ?? "program"}
                </>
              )}
            </div>
            <div style={{ marginTop: 6 }}>{e.summary}</div>
          </div>
        ))
      )}
    </div>
  );
}
