# personal-dsh-plugins

[![CI](https://github.com/linying-sir/personal-dsh-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/linying-sir/personal-dsh-plugins/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![DSH](https://img.shields.io/badge/DSH-0.2.1--rc.2-4f6bff)](https://deepseek.com)

A personal collection of [DeepSeek Harness](https://deepseek.com) (DSH) plugins: everything I write, fork or keep using lives here, one folder per plugin.

> 中文说明见 [README.md](README.md)。

## Plugins

| Plugin | What it does | Version | Status |
| --- | --- | --- | --- |
| [`ui-scale`](plugins/ui-scale) | Sidebar UI scale switcher (100 / 125 / 150 / 175 / 200%) with a preference that survives restarts; also turns the WSL workspace `W` into a gradient badge | 0.1.0 | stable |

The plugins have **no build step**: files in `lib/` are the files that run, so a clone is ready to install without a toolchain.

## Requirements

- DeepSeek Harness Desktop **0.2.1-rc.2** (the version this library is developed and verified against)
- Windows 11 (the plugins use only Node built-ins and browser APIs; macOS / Linux should work in principle)
- Node.js ≥ 22 (only for the repository self-check `npm run check`)

## Install

### 1. Clone to a stable location

```powershell
git clone https://github.com/linying-sir/personal-dsh-plugins.git D:\repositories\personal-dsh-plugins
```

Do **not** clone into a temporary directory: the profile stores an absolute path, so moving the repository later means updating that path.

### 2. Add an insert entry to the profile patch

Open:

```
C:\Users\<you>\.dsh\profiles\desktop\cordis.patch.yml
```

Append:

```yaml
- insert:
    - id: ui-scale
      name: 'D:/repositories/personal-dsh-plugins/plugins/ui-scale/lib/index.js'
```

- `id` is the plugin's unique name in the plugin tree; keep `ui-scale`.
- `name` is the absolute path of the **host entry** `lib/index.js`. Forward slashes are safest on Windows.
- The browser entry is declared by the plugin's `dsh.client` manifest; it does not go into the patch.

### 3. Restart DSH

Quit completely from the tray and start it again (closing the window usually only hides it). The host half is a Node module; hot reload only replaces the browser half, so a restart is required before the new `lib/index.js` is imported.

Expand the sidebar: an `Aa` button appears above the account row.

### Alternative: install into the profile

```powershell
dsh plugin --profile desktop add D:\repositories\personal-dsh-plugins\plugins\ui-scale
```

Then use the package name in the patch:

```yaml
- insert:
    - id: ui-scale
      name: 'dsh-ui-scale'
```

Pick **one** method. Using both loads the plugin twice and shows two `Aa` buttons.

## Uninstall

Remove the `insert` block from the patch and restart DSH. If you installed the package, also run:

```powershell
dsh plugin --profile desktop remove dsh-ui-scale
```

Preference files written by the plugin (for example `~/.dsh/ui-scale.json`) are not removed automatically.

## Layout

```
personal-dsh-plugins/
├── plugins/
│   └── ui-scale/              # first plugin: UI scale switcher
│       ├── lib/index.js       # host half: Node ESM, loopback route, preference file
│       ├── lib/client.js      # browser half: sidebar Aa button, styles, scaling
│       ├── package.json       # dsh.client manifest + npm metadata
│       ├── README.md          # Chinese
│       └── README.en.md       # English
├── scripts/check.mjs          # manifest, entry-file and syntax self-check
├── .github/workflows/ci.yml   # runs the self-check on push / PR
└── README.md
```

## Adding a plugin

1. Copy `plugins/ui-scale` to `plugins/<name>`, set `name` to `dsh-<name>` in `package.json`, and update `description` and `repository.directory`.
2. Host half `lib/index.js`: Node ESM exporting `name`, `inject` and `apply`. Take HTTP, filesystem or config services from `ctx` when needed.
3. Browser half `lib/client.js`: register with `window.__ModuleLoader__.load({ id, factory })`; list the client services you use in `package.json` under `dsh.client.inject`.
4. Add an `insert` entry pointing at the new `lib/index.js` to your profile's `cordis.patch.yml`.
5. Add the plugin to the table above and run `npm run check`.

If a plugin needs a build (TypeScript, a bundler, ...), commit the built files under `lib/` so the repository stays installable without a toolchain.

## Conventions

- One folder per plugin; the folder name is the package name without the `dsh-` prefix.
- Do not commit `node_modules/`, logs or local preference files.
- The browser half should not assume the DOM never changes: prefer `data-*` hooks, plugin slots and public CSS variables; fall back to structural selectors only when necessary.
- A host half that opens a network listener binds loopback only and validates the `Host` header.
- Get a plugin working in a local profile before committing it.

## License

[MIT](LICENSE). Third-party code or inspiration is credited in the README of the relevant plugin.
