import type { AssistantProviderId } from "../types/assistant";

export const ASSISTANT_HIGHLIGHTS_LAST_UPDATED = "2026-Q2";

/**
 * Editorial copy refreshed ~quarterly. Update `ASSISTANT_HIGHLIGHTS_LAST_UPDATED`,
 * adjust bullets for each provider, keep links accurate.
 *
 * Claude Code marketplace (official plugins repo) complements Anthropic-managed
 * extensions — it targets Claude Code’s agent host, not this app’s Messages API chat.
 */
export const CLAUDE_OFFICIAL_PLUGINS_REPO = "https://github.com/anthropics/claude-plugins-official";

export type ProviderHighlight = {
  headline: string;
  summary: string;
  bullets: Array<{ title: string; detail: string }>;
  docsUrl?: string;
  supplementalLinks?: Array<{ label: string; url: string }>;
};

export const ASSISTANT_PROVIDER_HIGHLIGHTS: Record<AssistantProviderId, ProviderHighlight> = {
  claude: {
    headline: "Claude via Anthropic API",
    summary:
      "Default provider for BAT Living Docs chat. Sends your messages from the Electron main process to Anthropic over HTTPS.",
    bullets: [
      {
        title: "Reasoning and long-context tasks",
        detail:
          "Well suited for runbook-style explanations, refactoring plans, and step-by-step Windows troubleshooting drafts.",
      },
      {
        title: "Safety and policy",
        detail:
          "Follow your org AI policy — no catalog data leaves this machine unless you paste it into the assistant yourself.",
      },
      {
        title: "Official Claude plugins marketplace",
        detail:
          "Anthropic publishes plugin definitions alongside Claude Code tooling; browse the official marketplace on GitHub. This Electron tab uses Anthropic Messages API flows separately.",
      },
    ],
    docsUrl: "https://docs.anthropic.com/",
    supplementalLinks: [
      { label: "Anthropic Claude official plugins marketplace (GitHub)", url: CLAUDE_OFFICIAL_PLUGINS_REPO },
    ],
  },
  gemini: {
    headline: "Gemini via Google AI",
    summary:
      "Optional replacement when GOOGLE_AI_API_KEY, GEMINI_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY is present at process start.",
    bullets: [
      {
        title: "Low-latency text",
        detail: "Gemini Flash-family models suit quick clarifications beside your catalog workflows.",
      },
      {
        title: "Model override",
        detail: "Set BAT_LD_GEMINI_MODEL before launch (defaults to gemini-2.0-flash).",
      },
      {
        title: "Operational note",
        detail: "Treat API credentials like production secrets — never commit `.env`.",
      },
    ],
    docsUrl: "https://ai.google.dev/gemini-api/docs",
  },
  copilot: {
    headline: "GitHub Copilot (IDE)",
    summary:
      "BAT Living Docs does not embed Copilot chat authentication. Teams that standardize on Copilot should bounce deep coding chats through VS Code, Visual Studio, or Cursor.",
    bullets: [
      {
        title: "Strengths inside the IDE",
        detail: "Completions, inline chat, Workspace chat (where licensed), PR summaries.",
      },
      {
        title: "Substitution pattern",
        detail:
          "Use this Programs catalog for BAT/JIRA/runner truth; open your IDE companion for Copilot-guided edits.",
      },
      {
        title: "Quarterly housekeeping",
        detail: "Update this copy when SKU names or procurement rules change materially.",
      },
    ],
    docsUrl: "https://docs.github.com/copilot/getting-started-with-github-copilot",
    supplementalLinks: [
      {
        label: "GitHub Copilot documentation index",
        url: "https://docs.github.com/copilot/getting-started-with-github-copilot/about-github-for-subscriptions-for-github-copilot",
      },
    ],
  },
};
