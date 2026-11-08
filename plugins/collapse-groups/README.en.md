# dsh-collapse-groups

Adds one button to the workspace sidebar header: **collapse every expanded workspace group at once**, and press it again to restore the groups that were expanded before.

> 中文说明见 [README.md](README.md)。

## Behaviour

- The button sits in the same row as search, view options and Add workspace, immediately left of Add workspace.
- **First press** collapses every currently expanded workspace group. In tree mode children collapse before their parent.
- **Second press** re-expands only the groups that were expanded when the collapse started; groups that were already collapsed stay collapsed.
- In the collapsed state the button turns the theme accent colour, sets `aria-pressed="true"` and its label becomes "Expand last collapsed groups".
- The button hides itself when there are no workspace groups (flat mode, or no workspaces).
- Group expansion is still owned and persisted by `ui-workspace`; the plugin does not change that store.

## Install

Add one entry to the local-plugin insert block in `~/.dsh/profiles/desktop/cordis.patch.yml`:

```yaml
- insert:
    - id: collapse-groups
      name: 'D:/repositories/personal-dsh-plugins/plugins/collapse-groups/lib/index.js'
```

Quit DSH from the tray and start it again. The host half is a no-op; the browser half needs a page load.

## Implementation and limits

- The official UI leaves no slot in that row (`sidebar.workspaces` is one single slot owned by `ui-workspace`), so the button is **DOM-injected** into the row's `_headerActions` container. A `MutationObserver` puts it back if a React re-render removes it.
- Group rows are found by `data-row-key^="workspace:"` plus `aria-expanded`, and the plugin clicks the row itself to toggle it; it never writes the internal store.
- It depends on `data-row-key`, `aria-expanded` and the `_headerActions` class suffix. If a DSH update changes those anchors the button may disappear or do nothing; it never touches session or workspace data.
- Browser-only: no network requests, no conversation content is read.

## Uninstall

Remove the `collapse-groups` insert from `cordis.patch.yml` and restart DSH. The injected button goes away with the plugin.

## License

[MIT](../../LICENSE)
