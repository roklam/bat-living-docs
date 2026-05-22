/** Embedded assistant providers (Electron main process invokes APIs when configured). */
export type AssistantProviderId = "claude" | "gemini" | "copilot";

export type AssistantTurn = {
  role: "user" | "assistant";
  content: string;
};
