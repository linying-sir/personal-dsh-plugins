/**
 * Host half of dsh-electron-env.
 *
 * DSH Desktop starts its host with `ELECTRON_RUN_AS_NODE=1` so the Electron
 * executable can evaluate the Node bootstrap. The host must keep that
 * selector for its own Node-mode children (the Windows job runner is one of
 * them), but GUI Electron apps launched by Open In must not inherit it:
 * `Code.exe` would run as Node, print nothing and exit, and the host reports
 * "could not open".
 *
 * The first version of this plugin deleted the selector from `process.env`
 * globally. That fixed VS Code but also broke DSH's own Node-mode children,
 * including the Windows job runner. This version wraps `child_process.spawn`
 * and strips the selector only for known GUI Electron applications.
 */

import childProcess from "node:child_process";
import { basename } from "node:path";
import { syncBuiltinESMExports } from "node:module";

/** GUI Electron launchers in DSH's Open In catalog (case-insensitive). */
const GUI_ELECTRON = new Set([
  "code.exe",
  "code - insiders.exe",
  "cursor.exe",
  "windsurf.exe",
]);

const nativeSpawn = childProcess.spawn;

childProcess.spawn = function spawnWithGuiEnvironment(command, args, options) {
  if (typeof command === "string" && GUI_ELECTRON.has(basename(command).toLowerCase())) {
    const env = { ...(options?.env ?? process.env) };
    delete env.ELECTRON_RUN_AS_NODE;
    options = { ...(options ?? {}), env };
  }
  return nativeSpawn.call(this, command, args, options);
};

// Update the builtin ESM namespace so modules that did `import { spawn }`
// before this plugin loaded see the wrapper too.
syncBuiltinESMExports();

/** Loader identity. */
export const name = "dsh-electron-env";

/** No host services are required. */
export const inject = [];

/** The wrapper is installed at module evaluation time. */
export function apply() {}
