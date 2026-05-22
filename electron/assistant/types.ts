export type AssistantProviderId = "claude" | "gemini" | "copilot";

export type AssistantTurn = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantChatRequest = {
  provider: AssistantProviderId;
  messages: AssistantTurn[];
};

export type AssistantChatResult =
  | { ok: true; reply: string }
  | { ok: false; code: string; message: string };

export type AssistantProviderRow = {
  id: AssistantProviderId;
  label: string;
  /** True only when this build can attach API credentials (never send keys from UI). */
  configured: boolean;
};

export type AssistantProvidersPayload = {
  providers: AssistantProviderRow[];
};
