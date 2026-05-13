import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { v4 as uuid } from "uuid";
import type { AppData, ResourceLink, Tool } from "./types";
import { CatalogDetailView } from "./components/CatalogDetailView";
import { Modal } from "./components/Modal";
import { TimelinePanel } from "./components/TimelinePanel";
import { ToolRow } from "./components/ToolRow";

type Tab = "catalog" | "history";

const labelStyles: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
  fontSize: "0.8rem",
  color: "var(--text-muted)",
};

const inputStyles: CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "0.55rem 0.65rem",
  color: "var(--text)",
  outline: "none",
};

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("catalog");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showArchivedTools, setShowArchivedTools] = useState(false);
  const [dataPathHint, setDataPathHint] = useState<string | null>(null);
  const [modal, setModal] = useState<
    | { type: "tool"; draft: Partial<Tool> & { id: string }; isNew: boolean }
    | {
        type: "link";
        toolId: string;
        url: string;
        kind: "jira" | "confluence";
        label: string;
        editLinkId?: string;
      }
    | null
  >(null);

  const refresh = useCallback(async () => {
    if (!window.catalog) {
      setError(
        "This UI runs inside Electron. After npm install, use npm start to launch the app.",
      );
      return;
    }
    try {
      const next = await window.catalog.getCatalog();
      setData(next as AppData);
      setError(null);
      setDataPathHint(await window.catalog.getDataFilePath());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load catalog");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activeTools = useMemo(
    () => (data?.tools ?? []).filter((t) => !t.archivedAt),
    [data?.tools],
  );
  const archivedTools = useMemo(
    () => (data?.tools ?? []).filter((t) => t.archivedAt),
    [data?.tools],
  );

  const selected = useMemo(() => {
    if (!selectedId || !data) return null;
    return data.tools.find((t) => t.id === selectedId) ?? null;
  }, [data, selectedId]);

  useEffect(() => {
    if (!selectedId && activeTools.length > 0) {
      setSelectedId(activeTools[0]?.id ?? null);
    }
  }, [selectedId, activeTools]);

  const linksForTool = useCallback(
    (toolId: string) => {
      if (!data) return { active: [] as ResourceLink[], past: [] as ResourceLink[] };
      const subset = data.links.filter((l) => l.toolId === toolId);
      return {
        active: subset.filter((l) => !l.archivedAt),
        past: subset.filter((l) => !!l.archivedAt),
      };
    },
    [data],
  );

  async function persistTool(tool: Tool) {
    const next = (await window.catalog.saveTool(tool)) as AppData;
    setData(next);
  }

  if (error && !data) {
    return (
      <div style={{ padding: "3rem", maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <p style={{ color: "var(--text-muted)" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          height: "100vh",
          color: "var(--text-muted)",
        }}
      >
        Loading catalog
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "300px minmax(0, 1fr)",
        gridTemplateRows: "auto 1fr",
        height: "100vh",
      }}
    >
      <aside
        className="glass-panel"
        style={{
          gridRow: "1 / -1",
          margin: "1rem 0 1rem 1rem",
          padding: "1.1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
        }}
      >
        <header>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              margin: "0 0 0.15rem",
              letterSpacing: "-0.02em",
            }}
          >
            BAT Living Docs
          </h1>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Tools, runners, runbooks in one place.
          </p>
        </header>

        <nav style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={
              tab === "catalog"
                ? {
                    borderColor: "var(--accent)",
                    color: "var(--accent)",
                    background: "var(--accent-dim)",
                  }
                : {}
            }
            onClick={() => setTab("catalog")}
          >
            Programs
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={
              tab === "history"
                ? {
                    borderColor: "var(--accent)",
                    color: "var(--accent)",
                    background: "var(--accent-dim)",
                  }
                : {}
            }
            onClick={() => setTab("history")}
          >
            Timeline
          </button>
        </nav>

        {tab === "catalog" ? (
          <>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={() =>
                setModal({
                  type: "tool",
                  isNew: true,
                  draft: {
                    id: uuid(),
                    name: "",
                    description: "",
                    batPaths: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    archivedAt: null,
                  },
                })
              }
            >
              Add program
            </button>

            <div className="scroll-y" style={{ flex: 1, paddingRight: 4 }}>
              <p className="mono-sm" style={{ marginBottom: "0.5rem", textTransform: "uppercase" }}>
                Active
              </p>
              {activeTools.map((t) => (
                <ToolRow
                  key={t.id}
                  active={selectedId === t.id}
                  tool={t}
                  onPick={() => {
                    setSelectedId(t.id);
                    setTab("catalog");
                  }}
                />
              ))}

              {archivedTools.length > 0 && (
                <>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ width: "100%", marginTop: "0.75rem", fontSize: "0.8rem" }}
                    onClick={() => setShowArchivedTools(!showArchivedTools)}
                  >
                    {showArchivedTools ? "Hide archived programs" : `Archived (${archivedTools.length})`}
                  </button>
                  {showArchivedTools &&
                    archivedTools.map((t) => (
                      <ToolRow
                        key={t.id}
                        active={selectedId === t.id}
                        archived
                        tool={t}
                        onPick={() => {
                          setSelectedId(t.id);
                          setTab("catalog");
                        }}
                      />
                    ))}
                </>
              )}
            </div>

            <footer
              className="mono-sm"
              style={{
                paddingTop: "0.75rem",
                borderTop: "1px solid var(--border)",
                wordBreak: "break-all",
              }}
            >
              Data file
              <div style={{ color: "var(--mint)", marginTop: 4 }}>{dataPathHint ?? ""}</div>
              <div style={{ marginTop: "0.65rem", color: "var(--text-muted)" }}>
                Removing a link archives it with a timeline entry. Archived programs can be restored.
              </div>
            </footer>
          </>
        ) : (
          <TimelinePanel entries={data.history} tools={data.tools} />
        )}
      </aside>

      <main style={{ padding: "1rem 1rem 1rem 0", minWidth: 0 }}>
        <div
          className="glass-panel"
          style={{
            height: "100%",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {tab === "catalog" && selected && selectedId && (
            <CatalogDetailView
              tool={selected}
              links={linksForTool(selectedId)}
              onEdit={() =>
                setModal({
                  type: "tool",
                  isNew: false,
                  draft: { ...selected },
                })
              }
              onArchive={async () => {
                await window.catalog.archiveTool(selected.id);
                await refresh();
                setSelectedId(null);
              }}
              onRestore={async () => {
                await window.catalog.restoreTool(selected.id);
                await refresh();
              }}
              onPickBats={async () => {
                const paths = await window.catalog.pickBatFiles();
                if (!paths.length) return;
                const merged = Array.from(new Set([...(selected.batPaths ?? []), ...paths]));
                await persistTool({ ...selected, batPaths: merged });
                await refresh();
              }}
              onAddLink={(kind) =>
                setModal({
                  type: "link",
                  toolId: selected.id,
                  kind,
                  url: "",
                  label: "",
                })
              }
              onEditLink={(link) =>
                setModal({
                  type: "link",
                  toolId: link.toolId,
                  kind: link.type,
                  url: link.url,
                  label: link.label ?? "",
                  editLinkId: link.id,
                })
              }
              openExternal={(u) => void window.catalog.openExternal(u)}
              openPath={(p) => void window.catalog.openPath(p)}
              revealFolder={(p) => void window.catalog.showItemInFolder(p)}
              onArchiveLink={(id) => async () => {
                await window.catalog.archiveLink(id);
                await refresh();
              }}
              onRestoreLink={(id) => async () => {
                await window.catalog.restoreLink(id);
                await refresh();
              }}
            />
          )}
          {tab === "catalog" && selectedId === null && (
            <div
              style={{
                flex: 1,
                display: "grid",
                placeItems: "center",
                color: "var(--text-muted)",
              }}
            >
              Select or add a program to begin.
            </div>
          )}
        </div>
      </main>

      {modal?.type === "tool" && (
        <Modal onClose={() => setModal(null)} title={modal.isNew ? "New program" : "Edit program"}>
          <label style={labelStyles}>
            Name
            <input
              value={modal.draft.name ?? ""}
              onChange={(e) =>
                setModal({
                  ...modal,
                  draft: { ...modal.draft, name: e.target.value },
                })
              }
              style={inputStyles}
              placeholder="e.g. Nightly reconcile"
            />
          </label>
          <label style={labelStyles}>
            Notes
            <textarea
              value={modal.draft.description ?? ""}
              onChange={(e) =>
                setModal({
                  ...modal,
                  draft: { ...modal.draft, description: e.target.value },
                })
              }
              style={{ ...inputStyles, minHeight: 92, resize: "vertical" }}
              placeholder="What it does on Windows, prerequisites, and so on."
            />
          </label>

          {!modal.isNew && (
            <section style={{ marginTop: "1rem" }}>
              <span className="mono-sm">Linked .bat paths</span>
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  maxHeight: 160,
                  overflowY: "auto",
                  paddingRight: 4,
                }}
              >
                {(modal.draft.batPaths ?? []).length === 0 ? (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No runners yet. Use Add files on the detail view.
                  </span>
                ) : (
                  modal.draft.batPaths?.map((p) => (
                    <div
                      key={p}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "var(--bg-soft)",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 8,
                      }}
                    >
                      <span
                        title={p}
                        style={{
                          fontSize: "0.8rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.replace(/\\/g, "/").split("/").pop()}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: "0.25rem 0.55rem", fontSize: "0.75rem" }}
                        onClick={() =>
                          setModal({
                            ...modal,
                            draft: {
                              ...modal.draft,
                              batPaths: (modal.draft.batPaths ?? []).filter((x) => x !== p),
                            },
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          <div
            style={{
              marginTop: "1.35rem",
              display: "flex",
              gap: "0.6rem",
              justifyContent: "flex-end",
            }}
          >
            <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!modal.draft.name?.trim()}
              onClick={() => {
                void (async () => {
                  const now = new Date().toISOString();
                  await persistTool({
                    id: modal.draft.id,
                    name: modal.draft.name!.trim(),
                    description: modal.draft.description?.trim() ?? "",
                    batPaths: modal.isNew ? [] : modal.draft.batPaths ?? [],
                    createdAt: modal.isNew ? now : modal.draft.createdAt!,
                    updatedAt: now,
                    archivedAt: modal.draft.archivedAt ?? null,
                  });
                  setSelectedId(modal.draft.id);
                  setModal(null);
                  await refresh();
                })();
              }}
            >
              Save
            </button>
          </div>
        </Modal>
      )}

      {modal?.type === "link" && (
        <Modal
          onClose={() => setModal(null)}
          title={
            modal.kind === "confluence"
              ? modal.editLinkId
                ? "Edit Confluence runbook URL"
                : "Attach Confluence runbook URL"
              : modal.editLinkId
                ? "Edit JIRA link"
                : "Attach JIRA link"
          }
        >
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: 0 }}>
            {modal.kind === "confluence" ? (
              <>
                Confluence links display as{" "}
                <strong style={{ color: "var(--text)" }}>
                  Runbook for {data.tools.find((t) => t.id === modal.toolId)?.name ?? "program"}
                </strong>
                {modal.editLinkId && (
                  <>
                    {" "}
                    Editing clears the &quot;removed&quot; state and saves the new URL to the timeline.
                  </>
                )}
              </>
            ) : (
              "Update the issue URL and optional label."
            )}
          </p>
          <label style={labelStyles}>
            URL
            <input
              value={modal.url}
              onChange={(e) => setModal({ ...modal, url: e.target.value })}
              placeholder="https://"
              style={inputStyles}
            />
          </label>
          {modal.kind === "jira" && (
            <label style={labelStyles}>
              Label (optional, e.g. PROJ-123)
              <input
                value={modal.label}
                onChange={(e) => setModal({ ...modal, label: e.target.value })}
                style={inputStyles}
              />
            </label>
          )}
          <div
            style={{
              marginTop: "1.35rem",
              display: "flex",
              gap: "0.6rem",
              justifyContent: "flex-end",
            }}
          >
            <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!modal.url.trim()}
              onClick={() => {
                void (async () => {
                  if (modal.editLinkId) {
                    await window.catalog.updateLink({
                      linkId: modal.editLinkId,
                      url: modal.url,
                      ...(modal.kind === "jira" ? { label: modal.label || null } : {}),
                    });
                  } else {
                    await window.catalog.addLink({
                      toolId: modal.toolId,
                      type: modal.kind,
                      url: modal.url,
                      ...(modal.kind === "jira" ? { label: modal.label || undefined } : {}),
                    });
                  }
                  setModal(null);
                  await refresh();
                })();
              }}
            >
              {modal.editLinkId ? "Save changes" : "Save link"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
