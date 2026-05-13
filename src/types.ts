export type LinkType = "jira" | "confluence";

export interface Tool {
  id: string;
  name: string;
  description: string;
  /** Absolute paths to .bat files (or folders scanned — we store paths) */
  batPaths: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface ResourceLink {
  id: string;
  toolId: string;
  type: LinkType;
  url: string;
  /** Optional human label (e.g. ticket key PROJ-123) */
  label: string | null;
  createdAt: string;
  archivedAt: string | null;
}

export type HistoryAction =
  | "tool.created"
  | "tool.updated"
  | "tool.archived"
  | "tool.restored"
  | "link.added"
  | "link.archived"
  | "link.restored"
  | "link.updated";

export interface HistoryEntry {
  id: string;
  at: string;
  action: HistoryAction;
  toolId: string | null;
  linkId: string | null;
  summary: string;
  payload: Record<string, unknown>;
}

export interface AppData {
  version: 1;
  tools: Tool[];
  links: ResourceLink[];
  history: HistoryEntry[];
}
