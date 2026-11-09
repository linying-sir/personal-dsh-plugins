# dsh-electron-env

A **host-only** helper that strips the inherited `ELECTRON_RUN_AS_NODE` selector **only for GUI Electron apps launched by Open In**, leaving DSH's own Node-mode children alone.

## What it fixes

DSH Desktop starts its host with `ELECTRON_RUN_AS_NODE=1` so the Electron executable can evaluate the Node bootstrap. The host must keep that selector for its own **Node-mode children** (the Windows job runner is one of them), but GUI Electron apps must not inherit it:

- `Code.exe` / `Cursor.exe` launched from **Open In** run as Node, print nothing and exit;
- the menu shows VS Code, but clicking it reports that it could not be opened;
- `code` works in pwsh because pwsh does not have the selector.

Version 0.1.0 deleted the variable from `process.env` globally. That fixed VS Code but broke DSH's own Node children; the agent shell then reported:

```text
subprocess-local: Windows Job runner exited with exit code 0
before proving its managed range empty
```

Version 0.1.1 is **targeted**: it wraps `child_process.spawn` and removes the selector only when the command is `Code.exe`, `Code - Insiders.exe`, `Cursor.exe` or `Windsurf.exe`.

```js
childProcess.spawn = function spawnWithGuiEnvironment(command, args, options) {
  if (isGuiElectron(command)) {
    const env = { ...(options?.env ?? process.env) };
    delete env.ELECTRON_RUN_AS_NODE;
    options = { ...(options ?? {}), env };
  }
  return nativeSpawn.call(this, command, args, options);
};
```

It then calls `syncBuiltinESMExports()` so modules that already did `import { spawn }` (Open In) see the wrapper too.

## Why DSH works this way

Open In's host half uses `scrubbedParentEnv()` to remove credentials, `DSH_*`, proxy settings and similar values before launching an app. That design is correct. The problem is that `ELECTRON_RUN_AS_NODE` is not a credential: it is DSH Desktop's own Node bootstrap switch. Keeping it for DSH's internal children is reasonable; passing it to GUI Electron apps is not. The current version does not separate those two cases, hence this targeted workaround.

`ELECTRON_RUN_AS_NODE` is only needed to boot the host, but it **must not be deleted globally**, or DSH's job runner and similar internal Node children stop working.

## Install

Mount it by absolute path in the profile patch:

```yaml
- insert:
    - id: electron-env
      name: 'D:/repositories/personal-dsh-plugins/plugins/electron-env/lib/index.js'
```

It has no browser half and no client bundle. Restart DSH to reload host plugins.

## Verify

1. Restart DSH.
2. Open the “Open with File Explorer” dropdown and choose VS Code.
3. VS Code should open directly, without repeated clicks or an error.
4. The agent shell / job runner should also recover.

If it still fails, check that `%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe` exists and that Open In is launching `Code.exe`.
