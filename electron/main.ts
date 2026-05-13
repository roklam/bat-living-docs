import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { join } from "path";
import type { AppData, LinkType, Tool } from "./types";
import {
  addLink,
  archiveLink,
  archiveTool,
  loadData,
  restoreLink,
  restoreTool,
  saveData,
  updateLink,
  upsertTool,
} from "./store";

let mainWindow: BrowserWindow | null = null;
let dataPath: string;
let cached: AppData;

function persist(): void {
  saveData(dataPath, cached);
}

function getCatalogPath(): string {
  return join(app.getPath("userData"), "bat-living-docs-catalog.json");
}

/** Electron 41 typings require a concrete `BrowserWindow` parent; avoid `undefined`. */
function dialogParent(): BrowserWindow | null {
  return (
    BrowserWindow.getFocusedWindow() ??
    mainWindow ??
    BrowserWindow.getAllWindows()[0] ??
    null
  );
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "BAT Living Docs",
    backgroundColor: "#0c0e12",
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.ELECTRON_START_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  dataPath = getCatalogPath();
  cached = loadData(dataPath);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("catalog:get", () => structuredClone(cached));

ipcMain.handle(
  "catalog:saveTool",
  (_e, tool: Omit<Tool, "createdAt" | "updatedAt" | "archivedAt">) => {
    upsertTool(cached, { ...tool, batPaths: tool.batPaths ?? [] });
    persist();
    return structuredClone(cached);
  },
);

ipcMain.handle("catalog:archiveTool", (_e, toolId: string) => {
  archiveTool(cached, toolId);
  persist();
  return structuredClone(cached);
});

ipcMain.handle("catalog:restoreTool", (_e, toolId: string) => {
  restoreTool(cached, toolId);
  persist();
  return structuredClone(cached);
});

ipcMain.handle(
  "catalog:addLink",
  (
    _e,
    payload: { toolId: string; type: LinkType; url: string; label?: string },
  ) => {
    addLink(cached, {
      toolId: payload.toolId,
      type: payload.type,
      url: payload.url,
      label: payload.label ?? null,
    });
    persist();
    return structuredClone(cached);
  },
);

ipcMain.handle("catalog:archiveLink", (_e, linkId: string) => {
  archiveLink(cached, linkId);
  persist();
  return structuredClone(cached);
});

ipcMain.handle("catalog:restoreLink", (_e, linkId: string) => {
  restoreLink(cached, linkId);
  persist();
  return structuredClone(cached);
});

ipcMain.handle(
  "catalog:updateLink",
  (
    _e,
    payload: { linkId: string; url: string; label?: string | null },
  ) => {
    updateLink(cached, payload.linkId, {
      url: payload.url,
      label: payload.label,
    });
    persist();
    return structuredClone(cached);
  },
);

ipcMain.handle(
  "dialog:pickBatFiles",
  async () => {
    const parent = dialogParent();
    if (!parent) return [];
    const result = await dialog.showOpenDialog(parent, {
      title: "Select batch files",
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Batch", extensions: ["bat", "cmd"] }],
    });
    return result.canceled ? [] : result.filePaths;
  },
);

ipcMain.handle(
  "dialog:pickDirectory",
  async () => {
    const parent = dialogParent();
    if (!parent) return null;
    const result = await dialog.showOpenDialog(parent, {
      title: "Select folder containing scripts",
      properties: ["openDirectory"],
    });
    return result.canceled ? null : result.filePaths[0] ?? null;
  },
);

ipcMain.handle(
  "shell:openExternal",
  async (_e, url: string) => {
    await shell.openExternal(url);
  },
);

ipcMain.handle(
  "shell:openPath",
  async (_e, filePath: string) => {
    const err = await shell.openPath(filePath);
    return err || null;
  },
);

ipcMain.handle(
  "shell:showItemInFolder",
  async (_e, filePath: string) => {
    shell.showItemInFolder(filePath);
  },
);

ipcMain.handle("paths:dataFile", () => dataPath);
