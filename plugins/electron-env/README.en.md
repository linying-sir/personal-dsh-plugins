# dsh-electron-env

A **host-only** helper plugin that removes the inherited `ELECTRON_RUN_AS_NODE` environment variable after the DSH desktop host starts.

## What it fixes

The DSH desktop host is started with `ELECTRON_RUN_AS_NODE=1` so the Electron executable can evaluate the Node bootstrap. Its scrubbed child environment keeps that selector, so GUI Electron apps launched from **Open In** (`Code.exe`, `Cursor.exe`, ...) start in Node mode, print nothing and exit. The symptom is:

- VS Code appears in the menu;
- clicking it reports that it could not be opened;
- `code` works fine in pwsh.

This plugin runs on the host:

```js
delete process.env.ELECTRON_RUN_AS_NODE;
```

Every later child process — including GUI apps launched by Open In — starts without the selector. The variable is only needed to boot the host, so removing it afterwards is safe.

## Install

Mount it by absolute path in the profile patch, like the other local plugins:

```yaml
- insert:
    - id: electron-env
      name: 'D:/repositories/personal-dsh-plugins/plugins/electron-env/lib/index.js'
```

It has no browser half and no client bundle. Restart DSH to reload host plugins.

## Verify

1. Restart DSH.
2. Open the “Open with File Explorer” dropdown at the top right and choose VS Code.
3. VS Code should open directly, without repeated clicks or an error.

If it still fails, check that `%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe` exists and note which host process launched DSH.
