import { contextBridge, ipcRenderer } from "electron";

export type RendererCatalogAPI = {
  getCatalog: () => Promise<unknown>;
  saveTool: (tool: Record<string, unknown>) => Promise<unknown>;
  archiveTool: (toolId: string) => Promise<unknown>;
  restoreTool: (toolId: string) => Promise<unknown>;
  addLink: (payload: {
    toolId: string;
    type: string;
    url: string;
    label?: string;
  }) => Promise<unknown>;
  archiveLink: (linkId: string) => Promise<unknown>;
  restoreLink: (linkId: string) => Promise<unknown>;
  pickBatFiles: () => Promise<string[]>;
  pickDirectory: () => Promise<string | null>;
  openExternal: (url: string) => Promise<void>;
  openPath: (filePath: string) => Promise<string | null>;
  showItemInFolder: (filePath: string) => Promise<void>;
  getDataFilePath: () => Promise<string>;
};

const api: RendererCatalogAPI = {
  getCatalog: () => ipcRenderer.invoke("catalog:get"),
  saveTool: (tool) => ipcRenderer.invoke("catalog:saveTool", tool),
  archiveTool: (toolId) => ipcRenderer.invoke("catalog:archiveTool", toolId),
  restoreTool: (toolId) => ipcRenderer.invoke("catalog:restoreTool", toolId),
  addLink: (payload) => ipcRenderer.invoke("catalog:addLink", payload),
  archiveLink: (linkId) => ipcRenderer.invoke("catalog:archiveLink", linkId),
  restoreLink: (linkId) => ipcRenderer.invoke("catalog:restoreLink", linkId),
  pickBatFiles: () => ipcRenderer.invoke("dialog:pickBatFiles"),
  pickDirectory: () => ipcRenderer.invoke("dialog:pickDirectory"),
  openExternal: (url) => ipcRenderer.invoke("shell:openExternal", url),
  openPath: (filePath) => ipcRenderer.invoke("shell:openPath", filePath),
  showItemInFolder: (filePath) =>
    ipcRenderer.invoke("shell:showItemInFolder", filePath),
  getDataFilePath: () => ipcRenderer.invoke("paths:dataFile"),
};

contextBridge.exposeInMainWorld("catalog", api);
