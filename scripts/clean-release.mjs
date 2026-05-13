/**
 * Clears `release/` before electron-builder repacks. On Windows, a prior run or
 * Explorer often leaves `app.asar` locked (EPERM). We retry delete, then
 * PowerShell, then quarantine by renaming the folder so the next build can proceed.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseDir = path.join(root, "release");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const productName = pkg.build?.productName ?? "BAT Living Docs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function killPackagedApp() {
  if (process.platform !== "win32") return;
  const exe = `${productName}.exe`;
  spawnSync("taskkill", ["/F", "/T", "/IM", exe], {
    stdio: "ignore",
    windowsHide: true,
  });
}

/** Stop any process whose image path lives under release/ (e.g. stale unpacked app). */
function stopProcessesUsingReleaseTree() {
  if (process.platform !== "win32") return;
  const prefix = releaseDir.replace(/'/g, "''");
  const script = [
    "$ErrorActionPreference = 'SilentlyContinue'",
    `$root = '${prefix}'`,
    "Get-CimInstance Win32_Process | ForEach-Object {",
    "  $ep = $_.ExecutablePath",
    "  if ($ep -and $ep.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {",
    "    Stop-Process -Id $_.ProcessId -Force",
    "  }",
    "}",
  ].join("; ");
  spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], {
    stdio: "ignore",
    windowsHide: true,
  });
}

function powershellRemoveDir(dir) {
  if (process.platform !== "win32") return false;
  const lit = dir.replace(/'/g, "''");
  const r = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      `Remove-Item -LiteralPath '${lit}' -Recurse -Force -ErrorAction Stop`,
    ],
    { encoding: "utf-8", windowsHide: true },
  );
  return r.status === 0 && !fs.existsSync(dir);
}

function quarantineReleaseDir() {
  if (!fs.existsSync(releaseDir)) return true;
  const quarantine = path.join(
    root,
    `release.locked-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  try {
    fs.renameSync(releaseDir, quarantine);
    console.warn(
      `\nCould not delete release/ (files may still be locked). Renamed it to:\n` +
        `  ${quarantine}\n` +
        `You can delete that folder later when nothing is using it.\n` +
        `Continuing with a fresh release/ for this build.\n`,
    );
    return true;
  } catch {
    return false;
  }
}

async function removeReleaseDir() {
  if (!fs.existsSync(releaseDir)) return;

  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      fs.rmSync(releaseDir, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 250,
      });
      return;
    } catch {
      await sleep(400);
    }
  }

  if (powershellRemoveDir(releaseDir)) return;

  if (quarantineReleaseDir()) return;

  console.error(
    "\nCould not remove or rename release/. Close anything that might lock it:\n" +
      `- Quit ${productName} (and any copy run from release\\win-unpacked).\n` +
      "- Close File Explorer windows showing the release\\ folder.\n" +
      "- Temporarily pause real-time AV scan on this project folder if needed.\n" +
      "- Then run: npm run clean:release\n" +
      "- To see likely lockers: npm run diagnose:release\n",
  );
  process.exit(1);
}

stopProcessesUsingReleaseTree();
killPackagedApp();
await sleep(800);
await removeReleaseDir();
