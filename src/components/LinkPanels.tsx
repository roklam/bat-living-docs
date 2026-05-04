import { fmtDate } from "../util/format";
import type { ResourceLink } from "../types";

export function LinkGroup({
  title,
  subset,
  archivedSubset,
  kind,
  toolName,
  archivedTool,
  openExternal,
  onArchiveLink,
  onRestoreLink,
}: {
  title: string;
  subset: ResourceLink[];
  archivedSubset: ResourceLink[];
  kind: "jira" | "confluence";
  toolName: string;
  archivedTool: boolean;
  openExternal: (u: string) => void;
  onArchiveLink: (id: string) => () => Promise<void>;
  onRestoreLink: (id: string) => () => Promise<void>;
}) {
  return (
    <div>
      <div className="mono-sm" style={{ marginBottom: 8, textTransform: "uppercase" }}>
        {title}
      </div>
      {subset.length === 0 && archivedSubset.length === 0 ? (
        <div style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
          {kind === "confluence"
            ? `No runbook yet. Use "+ Confluence" to attach the URL. It displays as Runbook for ${toolName}.`
            : "No JIRA links yet."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {subset.map((l) => (
            <LinkRow
              key={l.id}
              link={l}
              toolName={toolName}
              openExternal={openExternal}
              onArchive={!archivedTool ? onArchiveLink(l.id) : undefined}
            />
          ))}
          {archivedSubset.length > 0 && (
            <>
              <div className="mono-sm" style={{ marginTop: 8, color: "var(--amber)" }}>
                Previously removed (history kept)
              </div>
              {archivedSubset.map((l) => (
                <LinkRow
                  key={l.id}
                  link={l}
                  toolName={toolName}
                  muted
                  openExternal={openExternal}
                  onRestore={!archivedTool ? onRestoreLink(l.id) : undefined}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LinkRow({
  link,
  toolName,
  openExternal,
  onArchive,
  onRestore,
  muted,
}: {
  link: ResourceLink;
  toolName: string;
  openExternal: (u: string) => void;
  onArchive?: () => Promise<void>;
  onRestore?: () => Promise<void>;
  muted?: boolean;
}) {
  const title =
    link.type === "confluence"
      ? `Runbook for ${toolName}`
      : link.label || "JIRA issue";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "0.65rem 0.75rem",
        borderRadius: "var(--radius-sm)",
        background: muted ? "rgba(251, 191, 36, 0.06)" : "var(--bg-soft)",
        border: `1px solid ${muted ? "rgba(251, 191, 36, 0.25)" : "var(--border)"}`,
        opacity: muted ? 0.85 : 1,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{title}</div>
        <button
          type="button"
          className="btn btn-ghost"
          style={{
            marginTop: 6,
            padding: 0,
            border: "none",
            fontSize: "0.8rem",
            color: "var(--accent)",
            textAlign: "left",
            wordBreak: "break-all",
          }}
          onClick={() => openExternal(link.url)}
        >
          {link.url}
        </button>
        {link.archivedAt && (
          <div className="mono-sm" style={{ marginTop: 6 }}>
            Removed {fmtDate(link.archivedAt)}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {onArchive && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: "0.75rem" }}
            onClick={() => void onArchive()}
          >
            Remove
          </button>
        )}
        {onRestore && (
          <button
            type="button"
            className="btn btn-primary"
            style={{ fontSize: "0.75rem" }}
            onClick={() => void onRestore()}
          >
            Restore
          </button>
        )}
      </div>
    </div>
  );
}
