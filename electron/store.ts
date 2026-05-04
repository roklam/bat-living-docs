import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import type { AppData, HistoryEntry, ResourceLink, Tool } from "./types";

const emptyData = (): AppData => ({
  version: 1,
  tools: [],
  links: [],
  history: [],
});

export function loadData(filePath: string): AppData {
  try {
    if (!existsSync(filePath)) return emptyData();
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as AppData;
    if (parsed.version !== 1 || !Array.isArray(parsed.tools)) return emptyData();
    return {
      ...emptyData(),
      ...parsed,
      links: parsed.links ?? [],
      history: parsed.history ?? [],
    };
  } catch {
    return emptyData();
  }
}

export function saveData(filePath: string, data: AppData): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function pushHistory(
  data: AppData,
  entry: Omit<HistoryEntry, "id" | "at"> & Partial<Pick<HistoryEntry, "id" | "at">>,
): void {
  const full: HistoryEntry = {
    id: entry.id ?? randomUUID(),
    at: entry.at ?? new Date().toISOString(),
    action: entry.action,
    toolId: entry.toolId ?? null,
    linkId: entry.linkId ?? null,
    summary: entry.summary,
    payload: entry.payload ?? {},
  };
  data.history.unshift(full);
}

export function upsertTool(
  data: AppData,
  input: Omit<Tool, "createdAt" | "updatedAt" | "archivedAt"> &
    Partial<Pick<Tool, "createdAt" | "updatedAt" | "archivedAt">>,
): Tool {
  const now = new Date().toISOString();
  const existing = data.tools.find((t) => t.id === input.id);
  if (existing) {
    const nextBatPaths =
      input.batPaths !== undefined ? input.batPaths : existing.batPaths;
    Object.assign(existing, {
      ...input,
      batPaths: nextBatPaths,
      updatedAt: now,
      archivedAt:
        input.archivedAt !== undefined ? input.archivedAt : existing.archivedAt,
    });
    pushHistory(data, {
      action: "tool.updated",
      toolId: existing.id,
      linkId: null,
      summary: `Updated tool "${existing.name}"`,
      payload: { name: existing.name },
    });
    return existing;
  }
  const tool: Tool = {
    id: input.id,
    name: input.name,
    description: input.description ?? "",
    batPaths: input.batPaths ?? [],
    createdAt: input.createdAt ?? now,
    updatedAt: now,
    archivedAt: input.archivedAt ?? null,
  };
  data.tools.push(tool);
  pushHistory(data, {
    action: "tool.created",
    toolId: tool.id,
    linkId: null,
    summary: `Added tool "${tool.name}"`,
    payload: { name: tool.name },
  });
  return tool;
}

export function archiveTool(data: AppData, toolId: string): boolean {
  const tool = data.tools.find((t) => t.id === toolId && !t.archivedAt);
  if (!tool) return false;
  const now = new Date().toISOString();
  tool.archivedAt = now;
  tool.updatedAt = now;
  pushHistory(data, {
    action: "tool.archived",
    toolId,
    linkId: null,
    summary: `Archived tool "${tool.name}"`,
    payload: { name: tool.name },
  });
  return true;
}

export function restoreTool(data: AppData, toolId: string): boolean {
  const tool = data.tools.find((t) => t.id === toolId && t.archivedAt);
  if (!tool) return false;
  tool.archivedAt = null;
  tool.updatedAt = new Date().toISOString();
  pushHistory(data, {
    action: "tool.restored",
    toolId,
    linkId: null,
    summary: `Restored tool "${tool.name}"`,
    payload: { name: tool.name },
  });
  return true;
}

export function addLink(
  data: AppData,
  input: Omit<ResourceLink, "createdAt" | "archivedAt" | "id"> & {
    id?: string;
    label?: string | null;
  },
): ResourceLink {
  const now = new Date().toISOString();
  const toolName =
    data.tools.find((t) => t.id === input.toolId)?.name ?? "program";
  const link: ResourceLink = {
    id: input.id ?? randomUUID(),
    toolId: input.toolId,
    type: input.type,
    url: input.url.trim(),
    label:
      typeof input.label === "string"
        ? input.label.trim() || null
        : input.label ?? null,
    createdAt: now,
    archivedAt: null,
  };
  data.links.push(link);
  const confluenceSummary = `Linked Confluence (Runbook for ${toolName})`;
  const jiraSummary = `Linked JIRA for "${toolName}"`;
  pushHistory(data, {
    action: "link.added",
    toolId: input.toolId,
    linkId: link.id,
    summary:
      link.type === "confluence" ? confluenceSummary : jiraSummary,
    payload: { type: link.type, url: link.url },
  });
  return link;
}

export function archiveLink(data: AppData, linkId: string): boolean {
  const link = data.links.find((l) => l.id === linkId && !l.archivedAt);
  if (!link) return false;
  link.archivedAt = new Date().toISOString();
  const tool = data.tools.find((t) => t.id === link.toolId);
  pushHistory(data, {
    action: "link.archived",
    toolId: link.toolId,
    linkId,
    summary: `Removed ${link.type} link from "${
      tool?.name ?? "tool"
    }" (saved in catalog history)`,
    payload: { url: link.url, type: link.type },
  });
  return true;
}

export function restoreLink(data: AppData, linkId: string): boolean {
  const link = data.links.find((l) => l.id === linkId && l.archivedAt);
  if (!link) return false;
  link.archivedAt = null;
  const tool = data.tools.find((t) => t.id === link.toolId);
  pushHistory(data, {
    action: "link.restored",
    toolId: link.toolId,
    linkId,
    summary: `Restored ${link.type} link for "${tool?.name ?? "tool"}"`,
    payload: { url: link.url },
  });
  return true;
}
