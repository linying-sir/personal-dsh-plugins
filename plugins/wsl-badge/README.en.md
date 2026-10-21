# dsh-wsl-badge

Replaces the `W` letter of the `dsh-wsl-workspace` sidebar action with a blue-violet gradient badge.

The plugin injects one stylesheet and **does not modify the WSL plugin**, so upgrading `dsh-wsl-workspace` leaves the badge alone. It is also independent of `ui-scale`: scaling and badge styling can be enabled or disabled separately.

> 中文说明见 [README.md](README.md)。

## Appearance

- Expanded sidebar: an 18×18 badge, 5 px radius, blue-violet gradient, white `W`.
- Rail sidebar: 22×22, 6 px radius, slightly larger `W`.
- Hover: a small lift and a deeper shadow.

## Requirements

- [`dsh-wsl-workspace`](https://github.com/dsh-wsl-workspace-maintainers/dsh-wsl-workspace) installed and enabled.
- Without the WSL plugin the stylesheet has no visible effect and the plugin does not error.

## Install

Add one entry to the insert block in `~/.dsh/profiles/desktop/cordis.patch.yml`:

```yaml
- insert:
    - id: ui-scale
      name: 'D:/repositories/personal-dsh-plugins/plugins/ui-scale/lib/index.js'
    - id: wsl-badge
      name: 'D:/repositories/personal-dsh-plugins/plugins/wsl-badge/lib/index.js'
```

Then quit DSH completely from the tray and start it again. The host half is a no-op module; the first install still deserves a restart.

## Uninstall

Remove the `wsl-badge` insert entry and restart DSH. The WSL action returns to its plain `W`.

## License

[MIT](../../LICENSE)
