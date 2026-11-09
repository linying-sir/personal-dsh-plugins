/**
 * Host half of dsh-electron-env.
 *
 * The desktop host is started with ELECTRON_RUN_AS_NODE=1 so the Electron
 * executable can evaluate the Node bootstrap. `scrubbedParentEnv()` keeps
 * that selector, and GUI Electron apps launched from Open In (Code.exe,
 * Cursor.exe, ...) inherit it: they run as Node, print nothing and exit
 * immediately, which the host reports as "could not open".
 *
 * The selector is only needed to start this process. Remove it once the host
 * is running so child GUI apps start normally.
 */

/** Loader identity. */
export const name = "dsh-electron-env";

/** No host services are required. */
export const inject = [];

/** Remove the inherited Electron selector for every later child spawn. */
export function apply(ctx) {
  const value = process.env.ELECTRON_RUN_AS_NODE;
  if (value === undefined) return;
  delete process.env.ELECTRON_RUN_AS_NODE;
  ctx.logger?.info?.("[electron-env] cleared inherited ELECTRON_RUN_AS_NODE");
}
