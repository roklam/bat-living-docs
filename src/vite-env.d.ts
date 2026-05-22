/// <reference types="vite/client" />

import type { AppData } from "./types";
import type { AssistantProviderId, AssistantTurn } from "./types/assistant";

type CatalogAPI = {
  getCatalog: () => Promise<AppData>;
  saveTool: (tool: import("./types").Tool) => Promise<AppData>;
  archiveTool: (toolId: string) => Promise<AppData>;
  restoreTool: (toolId: string) => Promise<AppData>;
  addLink: (payload: {
    toolId: string;
    type: "jira" | "confluence";
    url: string;
    label?: string;
  }) => Promise<AppData>;
  archiveLink: (linkId: string) => Promise<AppData>;
  restoreLink: (linkId: string) => Promise<AppData>;
  updateLink: (payload: {
    linkId: string;
    url: string;
    label?: string | null;
  }) => Promise<AppData>;
  pickBatFiles: () => Promise<string[]>;
  pickDirectory: () => Promise<string | null>;
  openExternal: (url: string) => Promise<void>;
  openPath: (filePath: string) => Promise<string | null>;
  showItemInFolder: (filePath: string) => Promise<void>;
  getDataFilePath: () => Promise<string>;
  getAbout: () => Promise<{
    name: string;
    version: string;
    description: string;
    historyRetentionDays: number;
  }>;
};

type AssistantProvidersResponse = {
  providers: Array<{ id: AssistantProviderId; label: string; configured: boolean }>;
};

type AssistantInvokeResult =
  | { ok: true; reply: string }
  | { ok: false; code: string; message: string };

type AssistantAPI = {
  listProviders: () => Promise<AssistantProvidersResponse>;
  chat: (body: { provider: AssistantProviderId; messages: AssistantTurn[] }) => Promise<AssistantInvokeResult>;
};

declare global {
  interface Window {
    catalog: CatalogAPI;
    /** Present after Electron preload; absent in bare Vite preview. */
    assistant?: AssistantAPI;
  }
}

export {};
