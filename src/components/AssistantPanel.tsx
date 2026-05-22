import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { v4 as uuid } from "uuid";
import {
  ASSISTANT_PROVIDER_HIGHLIGHTS,
  ASSISTANT_HIGHLIGHTS_LAST_UPDATED,
} from "../constants/assistantProviderHighlights";
import type { AssistantProviderId, AssistantTurn } from "../types/assistant";

type SubPane = "about" | "chat";

const LS_PROVIDER = "batlivingdocs.embeddedAssistant.provider";

function loadSavedProvider(): AssistantProviderId | null {
  try {
    const raw = localStorage.getItem(LS_PROVIDER);
    if (raw === "claude" || raw === "gemini" || raw === "copilot") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

type ProviderRow = { id: AssistantProviderId; label: string; configured: boolean };

type ChatResult =
  | { ok: true; reply: string }
  | { ok: false; code: string; message: string };

type ThreadTurn = AssistantTurn & { clientId: string };

function toWire(turns: ThreadTurn[]): AssistantTurn[] {
  return turns.map(({ role, content }) => ({ role, content }));
}

const tabBtnStyles = (pane: SubPane, active: SubPane): CSSProperties => ({
  fontSize: "0.82rem",
  ...(pane === active
    ? {
        borderColor: "var(--accent)",
        color: "var(--accent)",
        background: "var(--accent-dim)",
      }
    : {}),
});

export function AssistantPanel() {
  const openExternal = useCallback((url: string) => {
    void window.catalog?.openExternal(url);
  }, []);

  const [subpane, setSubpane] = useState<SubPane>("about");

  const assistantBridge = window.assistant;

  const preloadReady = Boolean(assistantBridge);

  const [providerRows, setProviderRows] = useState<ProviderRow[]>(() => []);

  const [provider, setProvider] = useState<AssistantProviderId>(() => loadSavedProvider() ?? "claude");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!assistantBridge) return;
      try {
        const res = (await assistantBridge.listProviders()) as {
          providers: ProviderRow[];
        };
        if (!cancelled && Array.isArray(res?.providers)) setProviderRows(res.providers);
      } catch {
        if (!cancelled) setProviderRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assistantBridge]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_PROVIDER, provider);
    } catch {
      /* ignore */
    }
  }, [provider]);

  const highlights = ASSISTANT_PROVIDER_HIGHLIGHTS[provider];

  const configured = useMemo(
    () => providerRows.find((r) => r.id === provider)?.configured ?? false,
    [provider, providerRows],
  );

  const canChat = preloadReady && configured && provider !== "copilot";

  const [messages, setMessages] = useState<ThreadTurn[]>(() => []);

  const [draft, setDraft] = useState("");

  const [error, setError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  const sendChat = async () => {
    const trimmed = draft.trim();
    if (!trimmed || busy || !canChat || !assistantBridge) return;
    const userTurn: ThreadTurn = { clientId: uuid(), role: "user", content: trimmed };
    const nextThread: ThreadTurn[] = [...messages, userTurn];
    setMessages(nextThread);
    setDraft("");
    setBusy(true);
    setError(null);
    try {
      const res = (await assistantBridge.chat({
        provider,
        messages: toWire(nextThread),
      })) as ChatResult;
      if (res.ok) {
        const bot: ThreadTurn = { clientId: uuid(), role: "assistant", content: res.reply };
        setMessages((m) => [...m, bot]);
      } else {
        setError(res.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      {!preloadReady && (
        <div
          className="glass-panel"
          style={{ padding: "1rem", marginBottom: "0.85rem", color: "var(--amber)", fontSize: "0.9rem", lineHeight: 1.5 }}
        >
          Assistant IPC is unavailable. Launch BAT Living Docs with <code style={{ fontSize: "0.82rem" }}>npm start</code>{" "}
          instead of previewing plain Vite HTML.
        </div>
      )}
      <div
        style={{
          marginBottom: "1rem",
          padding: "0.85rem 1rem",
          border: "1px solid rgba(110, 231, 255, 0.28)",
          background: "var(--accent-dim)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>
          Highlights last reviewed:{" "}
          <span style={{ color: "var(--mint)" }}>{ASSISTANT_HIGHLIGHTS_LAST_UPDATED}</span>
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
          Product marketing copy rotates quarterly — edit{" "}
          <code style={{ color: "var(--mint)", fontSize: "0.8rem" }}>
            src/constants/assistantProviderHighlights.ts
          </code>{" "}
          alongside this label so reviewers know whether the summaries are stale.
        </div>
      </div>

      <header
        style={{
          marginBottom: "0.85rem",
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={tabBtnStyles("about", subpane)}
            onClick={() => setSubpane("about")}
          >
            LLM highlights
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={tabBtnStyles("chat", subpane)}
            onClick={() => setSubpane("chat")}
          >
            Chat
          </button>
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", alignSelf: "center" }}>
          Active provider:&nbsp;
          <strong style={{ color: configured ? "var(--mint)" : "var(--amber)" }}>
            {providerRows.find((p) => p.id === provider)?.label ?? provider}{" "}
            {configured ? "(env ready)" : "(not wired)"}
          </strong>
        </div>
      </header>

      <label style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.65rem" }}>
        Provider
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as AssistantProviderId)}
          style={{
            marginTop: 6,
            display: "block",
            background: "var(--bg-elevated)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "0.55rem",
            fontSize: "0.875rem",
            maxWidth: 420,
            width: "100%",
          }}
        >
          {providerRows.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
              {r.configured ? " - ready" : r.id === "copilot" ? " - informational" : " - missing key"}
            </option>
          ))}
          {providerRows.length === 0 && (
            <>
              <option value="claude">Claude</option>
              <option value="gemini">Gemini</option>
              <option value="copilot">GitHub Copilot</option>
            </>
          )}
        </select>
      </label>

      {subpane === "about" && (
        <div className="scroll-y" style={{ flex: 1, paddingRight: 8 }}>
          <section style={{ marginBottom: "1.25rem" }}>
            <h3
              style={{
                margin: "0 0 0.45rem",
                fontFamily: "var(--font-display)",
                fontSize: "1.2rem",
                letterSpacing: "-0.015em",
              }}
            >
              {highlights.headline}
            </h3>
            <p style={{ margin: "0 0 0.9rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              {highlights.summary}
            </p>
            <ul style={{ paddingLeft: "1.1rem", margin: 0 }}>
              {highlights.bullets.map((b) => (
                <li key={b.title} style={{ marginBottom: "0.7rem", lineHeight: 1.48 }}>
                  <strong style={{ color: "var(--text)" }}>{b.title}: </strong>
                  {b.detail}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {highlights.docsUrl && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: "0.8rem" }}
                  onClick={() => openExternal(highlights.docsUrl!)}
                >
                  Open provider docs (browser)
                </button>
              )}
              {highlights.supplementalLinks?.map((l) => (
                <button
                  key={l.url}
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: "0.8rem" }}
                  onClick={() => openExternal(l.url)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </section>
          <aside
            className="mono-sm"
            style={{
              padding: "0.75rem",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-muted)",
              lineHeight: 1.5,
              fontSize: "0.8rem",
            }}
          >
            API keys stay in the Electron main process (`ANTHROPIC_API_KEY` or Gemini-family variables). Reload the
            desktop app after changing environment variables.
          </aside>
        </div>
      )}

      {subpane === "chat" && (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {!canChat ? (
            <div
              className="glass-panel"
              style={{
                padding: "1rem",
                marginBottom: "0.85rem",
                fontSize: "0.875rem",
                color: "var(--text-muted)",
                lineHeight: 1.5,
              }}
            >
              {provider === "copilot" ? (
                <>
                  GitHub Copilot is not runnable from this Electron shell — see the Highlights tab for the intended IDE
                  workflow.
                </>
              ) : (
                <>
                  No API credential detected at launch for this provider. Set the documented environment variables,
                  quit the desktop app entirely, then start it again via your usual shortcut or terminal wrapper.
                </>
              )}
            </div>
          ) : (
            <p style={{ margin: "0 0 0.65rem", color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.45 }}>
              Chat runs through BAT Living Docs with your selected LLM provider. Paste internal content carefully per
              your data-classification policy.
            </p>
          )}

          {error && (
            <div
              style={{
                marginBottom: "0.65rem",
                padding: "0.6rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                background: "rgba(255, 120, 80, 0.12)",
                border: "1px solid rgba(255, 120, 80, 0.45)",
                color: "var(--text)",
                fontSize: "0.85rem",
              }}
            >
              {error}
            </div>
          )}

          <div className="scroll-y" style={{ flex: 1, border: "1px solid var(--border)", borderRadius: "12px" }}>
            {messages.length === 0 ? (
              <div
                style={{
                  padding: "1.75rem",
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                }}
              >
                <p style={{ margin: 0 }}>
                  Conversation memory lives only inside this Electron session tab. Nothing here is synced to Programs or
                  the catalog JSON unless you paste it elsewhere.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.clientId}
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid var(--border)",
                    background: m.role === "user" ? "rgba(110,231,255,0.04)" : "transparent",
                  }}
                >
                  <div className="mono-sm" style={{ color: "var(--text-muted)", marginBottom: 6 }}>
                    {m.role.toUpperCase()}
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.875rem",
                      lineHeight: 1.52,
                      color: "var(--text)",
                    }}
                  >
                    {m.content}
                  </pre>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <textarea
              value={draft}
              placeholder={canChat ? "Ask Claude or Gemini..." : "Select a wired provider"}
              disabled={!canChat || busy}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  void sendChat();
                }
              }}
              style={{
                flex: 2,
                minHeight: 80,
                minWidth: "200px",
                resize: "vertical",
                padding: "0.65rem 0.75rem",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text)",
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canChat || busy || !draft.trim()}
              onClick={() => void sendChat()}
            >
              {busy ? "Sending..." : "Send"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy || messages.length === 0}
              onClick={() => {
                setMessages([]);
                setError(null);
              }}
            >
              Reset thread
            </button>
          </div>
          <p className="mono-sm" style={{ marginTop: "0.5rem", marginBottom: 0, color: "var(--text-muted)" }}>
            Tip: Ctrl+Enter sends when the textarea is focused.
          </p>
        </div>
      )}
    </div>
  );
}
