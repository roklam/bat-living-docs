Got a bunch of home-brewed programs. Need a wrapper to keep track of them and their Confluence articles.

This mini-project REQUIRES documentation on any program added.

This project relies heavily on LLM/Agents/etc — the contributors are primarily Telephony oriented Engineers.

## Tracking

- **JIRA:** [MFWE-1393](https://oneoptimum.atlassian.net/browse/MFWE-1393)

## Embedded assistant

The **Assistant** tab pairs quarterly LLM marketing notes with optional in-process chat routed through Electron's main layer (API keys stay off the webpage).

| Provider | Wired when… | Overrides |
|---------|--------------|-----------|
| Claude (Anthropic) | `ANTHROPIC_API_KEY` is set | `BAT_LD_CLAUDE_MODEL` (defaults to Claude 3.5 Sonnet) |
| Gemini (Google) | `GEMINI_API_KEY`, `GOOGLE_AI_API_KEY`, or `GOOGLE_GENERATIVE_AI_API_KEY` | `BAT_LD_GEMINI_MODEL` (defaults to `gemini-2.0-flash`) |
| GitHub Copilot | _(not embedded)_ | Continue using VS Code / Visual Studio / Cursor |

- Update **`ASSISTANT_HIGHLIGHTS_LAST_UPDATED`** and `ASSISTANT_PROVIDER_HIGHLIGHTS` in [`src/constants/assistantProviderHighlights.ts`](src/constants/assistantProviderHighlights.ts) each quarter so the Highlights tab stays honest.
- **Claude Code plugins:** Anthropic publishes the [official Claude plugins marketplace (GitHub)](https://github.com/anthropics/claude-plugins-official) for Claude Code/agent workflows; this repository's pane calls Anthropic's HTTP Messages API separately.

Quit and relaunch BAT Living Docs after changing environment variables (keys load at Electron startup).
