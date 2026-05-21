import { useEffect, useState } from "react";
import type { AboutInfo } from "../util/aboutRetentionText";

const JIRA = "https://oneoptimum.atlassian.net/browse/MFWE-1393";
const REPO = "https://github.com/roklam/bat-living-docs";

export function HelpPanel() {
  const [about, setAbout] = useState<AboutInfo | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const a = (await window.catalog.getAbout()) as AboutInfo;
        setAbout(a);
      } catch {
        setAbout({
          name: "BAT Living Docs",
          version: "—",
          description: "",
          historyRetentionDays: 365,
        });
      }
    })();
  }, []);

  const retention = about?.historyRetentionDays ?? 365;

  return (
    <div className="scroll-y" style={{ flex: 1, paddingRight: 8, maxWidth: 720 }}>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.35rem",
          margin: "0 0 0.75rem",
          letterSpacing: "-0.02em",
        }}
      >
        Help
      </h2>

      <section style={{ marginBottom: "1.35rem" }}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>About</h3>
        <p
          style={{
            margin: "0 0 0.5rem",
            color: "var(--text-muted)",
            fontSize: "0.92rem",
            lineHeight: 1.5,
          }}
        >
          {about?.description ||
            "Windows catalog for scripts and executables, with Confluence runbook and JIRA links."}
        </p>
        <ul
          style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}
        >
          <li>
            <strong style={{ color: "var(--text)" }}>Release</strong> · v{about?.version ?? "…"} ·{" "}
            {about?.name ?? "BAT Living Docs"}
          </li>
          <li>
            <strong style={{ color: "var(--text)" }}>JIRA tracking</strong> ·{" "}
            <button
              type="button"
              className="btn btn-ghost"
              style={{
                padding: 0,
                border: "none",
                verticalAlign: "baseline",
                color: "var(--accent)",
              }}
              onClick={() => void window.catalog.openExternal(JIRA)}
            >
              MFWE-1393
            </button>
          </li>
          <li>
            <strong style={{ color: "var(--text)" }}>Repository</strong> ·{" "}
            <button
              type="button"
              className="btn btn-ghost"
              style={{
                padding: 0,
                border: "none",
                verticalAlign: "baseline",
                color: "var(--accent)",
              }}
              onClick={() => void window.catalog.openExternal(REPO)}
            >
              github.com/roklam/bat-living-docs
            </button>
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: "1.35rem" }}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Requirements (this application)</h3>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.55 }}>
          BAT Living Docs is an <strong style={{ color: "var(--text)" }}>Electron</strong> desktop app.
          It does <strong style={{ color: "var(--text)" }}>not</strong> bundle or require Java, Python, or .NET to
          run itself. Targets Windows <strong>x64</strong>; install via your team&apos;s released{" "}
          <code>.exe</code>, or build from Node.js + npm using the README on GitHub.
        </p>
        <p
          style={{
            marginTop: "0.75rem",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            lineHeight: 1.55,
          }}
        >
          <strong style={{ color: "var(--mint)" }}>Important:</strong> The batch files, installers, or programs
          you attach may require Java, CLR, SNMP tools, Telco-specific runtimes, or admin rights. Capture those in
          each program&apos;s <strong>Notes</strong>.
        </p>
      </section>

      <section style={{ marginBottom: "1.35rem" }}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>History retention</h3>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.55 }}>
          Catalog history is trimmed automatically after{" "}
          <strong style={{ color: "var(--accent)" }}>{retention} days</strong> per entry (program tab + global
          timeline). Older events are deleted from the local catalog on save or reload.
        </p>
      </section>

      <section>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Quick usage</h3>
        <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--text-muted)", fontSize: "0.88rem" }}>
          <li>
            Add programs and link <code>.bat</code>, <code>.cmd</code>, or <code>.exe</code> runners on disk
          </li>
          <li>Add Confluence URLs (shown as Runbook for that program)</li>
          <li>JIRA links for tracking tickets (example: MFWE-1393)</li>
          <li>Use Edit URL on removed links to reopen with a corrected address</li>
        </ul>
      </section>
    </div>
  );
}
