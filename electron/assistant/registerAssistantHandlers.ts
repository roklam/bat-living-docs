import { ipcMain } from "electron";
import type {
  AssistantChatResult,
  AssistantProvidersPayload,
} from "./types";
import { assistantChat } from "./runAssistantChat";

function geminiConfigured(): boolean {
  return !!(
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
  );
}

export function registerAssistantHandlers(): void {
  ipcMain.handle("assistant:listProviders", (): AssistantProvidersPayload => ({
    providers: [
      {
        id: "claude",
        label: "Claude (Anthropic API)",
        configured: !!process.env.ANTHROPIC_API_KEY?.trim(),
      },
      {
        id: "gemini",
        label: "Gemini (Google AI)",
        configured: geminiConfigured(),
      },
      {
        id: "copilot",
        label: "GitHub Copilot (IDE only)",
        configured: false,
      },
    ],
  }));

  ipcMain.handle("assistant:chat", (_evt, payload: unknown): Promise<AssistantChatResult> =>
    assistantChat(payload),
  );
}
