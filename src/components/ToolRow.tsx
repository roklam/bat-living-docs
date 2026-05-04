import type { Tool } from "../types";

export function ToolRow({
  tool,
  active,
  archived,
  onPick,
}: {
  tool: Tool;
  active: boolean;
  archived?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      style={{
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        padding: "0.65rem 0.72rem",
        marginBottom: 6,
        borderRadius: "var(--radius-sm)",
        border: active
          ? "1px solid color-mix(in srgb, var(--accent), transparent 30%)"
          : "1px solid var(--border)",
        background: active ? "var(--accent-dim)" : "transparent",
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: "0.93rem",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {tool.name}
        {archived && (
          <span className="mono-sm" style={{ color: "var(--amber)", fontWeight: 500 }}>
            archived
          </span>
        )}
      </div>
      <div className="mono-sm" style={{ marginTop: 4 }}>
        {tool.batPaths.length} runner(s)
      </div>
    </button>
  );
}
