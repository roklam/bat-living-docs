/**
 * Clears `release/` before electron-builder repacks. On Windows, a prior run of
 * the installed/packaged app often locks `app.asar`, which causes EPERM on rebuild.
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

async function removeReleaseDir() {
  if (!fs.existsSync(releaseDir)) return;

  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      fs.rmSync(releaseDir, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 200,
      });
      return;
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? err.code : "";
      if (attempt === 9) {
        console.error(
          "\nCould not delete release/. Usually another process still has app.asar open.\n" +
            "- Quit any running copy of " +
            productName +
            " (including from release\\win-unpacked).\n" +
            "- Close File Explorer if it is browsing the release\\ folder.\n" +
            "- Then run npm run dist again.\n",
        );
        console.error(err);
        process.exit(1);
      }
      if (code === "EBUSY" || code === "EPERM") {
        await sleep(500);
        continue;
      }
      await sleep(300);
    }
  }
}

killPackagedApp();
await sleep(600);
await removeReleaseDir();
