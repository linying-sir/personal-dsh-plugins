# personal-dsh-plugins

[![CI](https://github.com/linying-sir/personal-dsh-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/linying-sir/personal-dsh-plugins/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![DSH](https://img.shields.io/badge/DSH-0.2.1--rc.2-4f6bff)](https://deepseek.com)

A personal collection of [DeepSeek Harness](https://deepseek.com) (DSH) plugins. Local plugins live under [`plugins/`](plugins); third-party plugins are not forked but pinned in [`plugins/manifest.json`](plugins/manifest.json) so a migration installs everything in one go.

> 中文说明见 [README.md](README.md)。

## Plugins

**Local (code in this repository)**

| Plugin | What it does | Version |
| --- | --- | --- |
| [`ui-scale`](plugins/ui-scale) | Sidebar UI scale switcher (100 / 125 / 150 / 175 / 200%) with a preference that survives restarts | 0.1.1 |
| [`wsl-badge`](plugins/wsl-badge) | Gradient badge for the `dsh-wsl-workspace` sidebar `W`; CSS-only, does not modify the WSL plugin | 0.1.0 |

**External (not vendored here)**

| Plugin | Version | Why |
| --- | --- | --- |
| `dsh-wsl-workspace` | 0.7.8 | WSL workspace support; installed from npm by the installer. Upstream is active, so forking would mean merging every release |

Local plugins have **no build step**: files in `lib/` are the files that run.

## One-command install / migrate

Prerequisite: DSH is installed on the new machine and has been started once, so `~/.dsh/profiles/desktop` exists.

```powershell
git clone https://github.com/linying-sir/personal-dsh-plugins.git D:\repositories\personal-dsh-plugins
cd D:\repositories\personal-dsh-plugins
node scripts/install-profile.mjs --profile desktop            # dry run: print the plan
node scripts/install-profile.mjs --profile desktop --apply    # write the changes
```

The installer:

1. Runs `dsh plugin add dsh-wsl-workspace@0.7.8` and adds it to the profile's `dsh.profile.bundles`.
2. Writes a marked managed block at the end of `~/.dsh/profiles/desktop/cordis.patch.yml` that mounts `ui-scale` and `wsl-badge` from this machine's repository path.
3. Backs up `package.json` and `cordis.patch.yml` with a timestamp before changing them.

Then quit DSH completely from the tray and start it again.

Useful flags:

```powershell
node scripts/install-profile.mjs --profile desktop --apply --skip-install  # refresh the patch/list only
node scripts/install-profile.mjs --profile desktop --apply --dsh "C:\path\to\dsh.cmd"
```

> On an existing profile that already has a hand-written `ui-scale` insert, the installer refuses to run to avoid loading the plugin twice. Remove the old insert first, then let it rebuild the managed block.

## Manual install

Append this to `~/.dsh/profiles/desktop/cordis.patch.yml`:

```yaml
- insert:
    - id: ui-scale
      name: 'D:/repositories/personal-dsh-plugins/plugins/ui-scale/lib/index.js'
    - id: wsl-badge
      name: 'D:/repositories/personal-dsh-plugins/plugins/wsl-badge/lib/index.js'
```

- `name` is the absolute path of the **host entry** `lib/index.js`; forward slashes are safest on Windows.
- The browser entry is declared by `dsh.client` in the plugin's `package.json`.
- `wsl-badge` needs `dsh-wsl-workspace`; without it the stylesheet has no visible effect and does not error.

Restart DSH afterwards. The sidebar should show `Aa` and the gradient `W`.

## Uninstall

Remove the relevant insert entries and restart DSH. Uninstalling `wsl-badge` restores the plain `W`; the `ui-scale` preference file `~/.dsh/ui-scale.json` is not deleted automatically.

To drop the WSL plugin entirely:

```powershell
dsh plugin --profile desktop remove dsh-wsl-workspace
```

and remove it from `dsh.profile.bundles`.

## Layout

```
personal-dsh-plugins/
├── plugins/
│   ├── manifest.json          # inventory: local plugins + external versions
│   ├── ui-scale/              # UI scale switcher
│   │   ├── lib/index.js       # host half: loopback route, preference file
│   │   ├── lib/client.js      # browser half: sidebar Aa button, styles, scaling
│   │   └── package.json
│   └── wsl-badge/             # gradient W badge
│       ├── lib/index.js       # host half: no-op
│       ├── lib/client.js      # browser half: one stylesheet
│       └── package.json
├── scripts/
│   ├── check.mjs              # manifest, entry files, JS syntax, inventory completeness
│   └── install-profile.mjs    # one-command install/migration
├── .github/workflows/ci.yml
└── README.md
```

## Why the WSL plugin is not vendored

- `dsh-wsl-workspace` is MIT, so vendoring is legal, but it ships about 1.5 MB of prebuilt files in 49 files and is actively maintained. A fork would need a manual merge on every upstream release.
- The badge is only a `.dww-letter` stylesheet rule, independent of the WSL host logic. Keeping it in `wsl-badge` lets WSL upgrade freely, keeps the badge out of `ui-scale`, and still ships the customization from this repository.
- The "which plugins do I need?" problem is solved by the manifest: `plugins/manifest.json` lists both local plugins and `dsh-wsl-workspace@0.7.8`, and the installer provisions both.

If you later need to change the WSL plugin's internal logic (not just CSS), fork it then: change the manifest entry from `kind: "package"` to `kind: "path"` and put the copy under `plugins/`.

## Adding a plugin

1. Copy `plugins/wsl-badge` or `plugins/ui-scale` to `plugins/<name>`, set `name` to `dsh-<name>` in `package.json`, and update `description` and `repository.directory`.
2. Add `{ "id": "<name>", "kind": "path", "dir": "<name>" }` to `plugins/manifest.json`.
3. Add an insert entry to the profile patch, or re-run the installer to refresh the managed block.
4. Add the plugin to the table above and run `npm run check`.

If a plugin needs a build (TypeScript, a bundler, ...), commit the built files under `lib/` so the repository stays installable without a toolchain.

## Conventions

- One folder per plugin; the folder name is the package name without the `dsh-` prefix.
- `plugins/manifest.json` must list every local plugin; CI checks it.
- Do not commit `node_modules/`, logs or local preference files.
- The browser half should not assume the DOM never changes: prefer `data-*` hooks, plugin slots and public CSS variables; fall back to structural selectors only when necessary.
- A host half that opens a network listener binds loopback only and validates the `Host` header.
- Get a plugin working in a local profile before committing it.

## License

[MIT](LICENSE). `dsh-wsl-workspace` is installed from npm under its own MIT license and is not copied into this repository.
