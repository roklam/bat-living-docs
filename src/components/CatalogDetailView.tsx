import { fmtDate } from "../util/format";
import type { ResourceLink, Tool } from "../types";
import { LinkGroup } from "./LinkPanels";

export function CatalogDetailView({
  tool,
  links,
  onEdit,
  onArchive,
  onRestore,
  onPickBats,
  onAddLink,
  openExternal,
  openPath,
  revealFolder,
  onArchiveLink,
  onRestoreLink,
}: {
  tool: Tool;
  links: { active: ResourceLink[]; past: ResourceLink[] };
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onPickBats: () => void;
  onAddLink: (k: "jira" | "confluence") => void;
  openExternal: (u: string) => void;
  openPath: (p: string) => void;
  revealFolder: (p: string) => void;
  onArchiveLink: (id: string) => () => Promise<void>;
  onRestoreLink: (id: string) => () => Promise<void>;
}) {
  const archived = !!tool.archivedAt;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.55rem",
              margin: "0 0 0.35rem",
              letterSpacing: "-0.03em",
            }}
          >
            {tool.name}
          </h2>
          {archived && (
            <div className="mono-sm" style={{ color: "var(--amber)", marginBottom: 6 }}>
              Archived on {fmtDate(tool.archivedAt!)}
            </div>
          )}
          <p style={{ margin: 0, color: "var(--text-muted)", maxWidth: 640 }}>
            {tool.description || "Add notes so new operators know how to use this tool."}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onEdit}>
            Edit details
          </button>
          {archived ? (
            <button type="button" className="btn btn-primary" onClick={onRestore}>
              Restore program
            </button>
          ) : (
            <button type="button" className="btn btn-danger-soft" onClick={onArchive}>
              Archive program
            </button>
          )}
        </div>
      </header>

      <section style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Windows runners (.bat / .cmd)</h3>
          {!archived && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: "0.8rem" }}
              onClick={onPickBats}
            >
              Add files
            </button>
          )}
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {tool.batPaths.length === 0 ? (
            <div
              style={{
                padding: "0.9rem",
                borderRadius: "var(--radius-sm)",
                border: "1px dashed var(--border)",
                color: "var(--text-muted)",
                fontSize: "0.88rem",
              }}
            >
              Point to batch files that already live on disk. They are not copied; only referenced.
            </div>
          ) : (
            tool.batPaths.map((p) => (
              <div
                key={p}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "0.65rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-soft)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                    {p.replace(/\\/g, "/").split("/").pop()}
                  </div>
                  <div className="mono-sm" style={{ marginTop: 4, wordBreak: "break-all" }}>
                    {p}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: "0.75rem", padding: "0.35rem 0.55rem" }}
                    onClick={() => revealFolder(p)}
                  >
                    Reveal
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: "0.75rem", padding: "0.35rem 0.55rem" }}
                    onClick={() => void openPath(p)}
                  >
                    Run / open
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Documentation and tracking</h3>
          {!archived && (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: "0.8rem" }}
                onClick={() => onAddLink("confluence")}
              >
                + Confluence
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: "0.8rem" }}
                onClick={() => onAddLink("jira")}
              >
                + JIRA
              </button>
            </>
          )}
        </div>

        <div className="scroll-y" style={{ flex: 1, paddingRight: 6 }}>
          <LinkGroup
            title="Confluence (displayed as Runbook titles)"
            toolName={tool.name}
            subset={links.active.filter((l) => l.type === "confluence")}
            archivedSubset={links.past.filter((l) => l.type === "confluence")}
            kind="confluence"
            archivedTool={archived}
            openExternal={openExternal}
            onArchiveLink={onArchiveLink}
            onRestoreLink={onRestoreLink}
          />
          <div style={{ height: "0.85rem" }} />
          <LinkGroup
            title="JIRA"
            toolName={tool.name}
            subset={links.active.filter((l) => l.type === "jira")}
            archivedSubset={links.past.filter((l) => l.type === "jira")}
            kind="jira"
            archivedTool={archived}
            openExternal={openExternal}
            onArchiveLink={onArchiveLink}
            onRestoreLink={onRestoreLink}
          />
        </div>
      </section>
    </div>
  );
}
