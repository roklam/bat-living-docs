import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  AssistantChatResult,
  AssistantProviderId,
  AssistantTurn,
} from "./types";

const MAX_MESSAGES = 32;
const MAX_CONTENT_CHARS = 32_000;

const DEFAULT_CLAUDE_MODEL =
  process.env.BAT_LD_CLAUDE_MODEL?.trim() || "claude-3-5-sonnet-20241022";

const DEFAULT_GEMINI_MODEL = process.env.BAT_LD_GEMINI_MODEL?.trim() || "gemini-2.0-flash";

function normalizeMessages(messages: AssistantTurn[]): AssistantChatResult | AssistantTurn[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, code: "EMPTY_THREAD", message: "Add at least one user message before sending." };
  }
  if (messages.length > MAX_MESSAGES) {
    return {
      ok: false,
      code: "THREAD_TOO_LONG",
      message: `This build allows at most ${MAX_MESSAGES} turns per request.`,
    };
  }
  for (const m of messages) {
    if (m.role !== "user" && m.role !== "assistant") {
      return { ok: false, code: "INVALID_ROLE", message: 'Each message must have role "user" or "assistant".' };
    }
    const c = m.content ?? "";
    if (!c.trim()) {
      return { ok: false, code: "EMPTY_CONTENT", message: "Message content cannot be empty." };
    }
    if (c.length > MAX_CONTENT_CHARS) {
      return {
        ok: false,
        code: "CONTENT_TOO_LONG",
        message: `Each message may be up to ${MAX_CONTENT_CHARS.toLocaleString()} characters.`,
      };
    }
  }
  const last = messages[messages.length - 1];
  if (last.role !== "user") {
    return {
      ok: false,
      code: "LAST_NOT_USER",
      message: 'The newest message must be from the user. Remove trailing assistant placeholders.',
    };
  }
  return messages;
}

function pickGeminiKey(): string | null {
  const v =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    "";
  return v || null;
}

async function chatClaude(messages: AssistantTurn[]): Promise<AssistantChatResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      code: "MISSING_ANTHROPIC_KEY",
      message:
        'Set environment variable ANTHROPIC_API_KEY before launching the app (see README "Embedded assistant").',
    };
  }
  const client = new Anthropic({ apiKey });
  try {
    const response = await client.messages.create({
      model: DEFAULT_CLAUDE_MODEL,
      max_tokens: 4096,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return { ok: true, reply: text || "(no text in model response)" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, code: "ANTHROPIC_ERROR", message: msg };
  }
}

async function chatGemini(messages: AssistantTurn[]): Promise<AssistantChatResult> {
  const apiKey = pickGeminiKey();
  if (!apiKey) {
    return {
      ok: false,
      code: "MISSING_GEMINI_KEY",
      message:
        "Set GEMINI_API_KEY, GOOGLE_AI_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY before launching the app.",
    };
  }
  try {
    const prior = messages.slice(0, -1);
    const last = messages[messages.length - 1];
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL });
    const history = prior.map((m) => ({
      role: (m.role === "user" ? "user" : "model") as "user" | "model",
      parts: [{ text: m.content }],
    }));
    const chat = model.startChat({ history });
    const streamed = await chat.sendMessage(last.content);
    const reply = streamed.response.text()?.trim();
    return { ok: true, reply: reply || "(no text in model response)" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, code: "GEMINI_ERROR", message: msg };
  }
}

function chatCopilot(): AssistantChatResult {
  return {
    ok: false,
    code: "COPILOT_NOT_EMBEDDED",
    message:
      "GitHub Copilot chat is not embedded in BAT Living Docs. Use Copilot inside VS Code, Visual Studio, or Cursor. This tab only documents Copilot versus other providers.",
  };
}

export async function dispatchAssistantChat(
  provider: AssistantProviderId,
  messages: AssistantTurn[],
): Promise<AssistantChatResult> {
  const norm = normalizeMessages(messages);
  if (!Array.isArray(norm)) return norm;

  switch (provider) {
    case "claude":
      return chatClaude(norm);
    case "gemini":
      return chatGemini(norm);
    case "copilot":
      return chatCopilot();
    default:
      return {
        ok: false,
        code: "UNKNOWN_PROVIDER",
        message: `Unsupported provider "${String(provider)}".`,
      };
  }
}

/** IPC entry: validates outer payload shape loosely. */
function coerceProvider(raw: unknown): AssistantProviderId | null {
  if (raw === "claude" || raw === "gemini" || raw === "copilot") return raw;
  return null;
}

export async function assistantChat(payload: unknown): Promise<AssistantChatResult> {
  const providerId = coerceProvider((payload as { provider?: unknown })?.provider);
  const msgs = (payload as { messages?: unknown })?.messages;
  if (!providerId || !Array.isArray(msgs)) {
    return {
      ok: false,
      code: "MALFORMED_REQUEST",
      message: "Assistant request payload is malformed.",
    };
  }
  return dispatchAssistantChat(providerId, msgs as AssistantTurn[]);
}
