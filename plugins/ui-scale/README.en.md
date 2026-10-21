# dsh-ui-scale

A UI scale switcher for DeepSeek Harness. An `Aa` button appears at the bottom of the sidebar; pick **100 / 125 / 150 / 175 / 200%** and the whole interface scales immediately. The choice is persisted and survives restarts.

> 中文说明见 [README.md](README.md)。

## Features

- Sidebar `Aa` trigger plus a five-step flyout, with `aria-*` attributes and keyboard support (`Esc` closes).
- The choice is written to `~/.dsh/ui-scale.json` through a loopback-only host route (`/ui-scale/api`); `localStorage` is only a first-paint cache, so the scale survives a restart.
- `100%` means "the window's current baseline". If the window already starts at 125% zoom, the flyout shows "Window base 125%" so the two layers are not confused.
- Compensates for floating-surface placement, right-panel width and approval-card focus scrolling after scaling (see below).

## Install

The plugin is mounted from the DSH profile patch by absolute path. Clone the repository, then append this to `~/.dsh/profiles/desktop/cordis.patch.yml`:

```yaml
- insert:
    - id: ui-scale
      name: 'D:/repositories/personal-dsh-plugins/plugins/ui-scale/lib/index.js'
```

Use the real path on your machine, then **quit DSH completely from the tray and start it again**. The host half is a Node module; hot reload does not re-import it.

Alternatively, install the folder as a profile dependency:

```powershell
dsh plugin --profile desktop add D:\repositories\personal-dsh-plugins\plugins\ui-scale
```

and use the package name in the patch, `name: 'dsh-ui-scale'`. Pick one method only.

## Usage

1. Expand the sidebar: `Aa` sits above the account row.
2. Click `Aa`, then pick a scale.
3. `100%` restores the window's native size.

Maximize the window at 175% and above: the layout width is `window width / factor`, so at 175% an 850 px window only has about 486 px to lay out and the composer will look cramped. That is expected, not a layout bug.

## How it works

### `transform`, not CSS `zoom`

The plugin sizes `body` to `100% / factor` and then applies `transform: scale(factor)`, with `contain: paint` so fixed-position menus and dialogs use the body as their containing block and scale with it.

This makes the layout viewport genuinely `window / factor`. CSS `zoom` cannot: it scales descendants but leaves body's own box at the narrowed width, squeezing every flex row into a narrow column — the 175% composer bug.

### Floating surfaces

DSH computes inline `left`/`top` for menus, hover cards and tooltips from `getBoundingClientRect()` (visual pixels, already multiplied by the factor), but the body transform multiplies the inline value again, so a surface lands at roughly `anchor × factor`.

A `MutationObserver` watches every `position: fixed` element with inline `left`/`top` and divides those coordinates by the current factor, re-running when React repositions the surface or the factor changes.

### Right panel width

`ui-layout` uses the frame's `getBoundingClientRect().width` as the layout viewport and gives the right panel `viewport × 0.45`. At 175% that rect reports 2560 instead of 1463, so the panel asks for ~1152 local pixels and covers most of the workspace after scaling.

The plugin divides the frame's own rect by the factor and nudges the `ResizeObserver` once so the columns are recomputed from 1463; the panel returns to roughly 45% of the window.

### Approval-card focus

Clicking "Allow once / Reject" focuses the button; inside a scaled card this scrolls the conversation, which the `ui-chat` follow controller reads as the reader scrolling away, so streamed content stops following the tail.

After an approval click the plugin scrolls the visible `[data-conversation-scroll]` back to the bottom a few times, letting the controller see a near-bottom position and resume following.

## Notes

- If you still launch through a shortcut such as `DeepSeek Harness (UI 125%).lnk`, the window already runs at 125%; `100%` in the plugin means that total, and picking 125% compounds it to about 156%. Prefer a normal shortcut and let `Aa` own the scaling.
- The preference lives in `~/.dsh/ui-scale.json`; it is restored on restart and written on every pick.
- Changing `lib/index.js` (the host half) requires a DSH restart; browser-half changes are hot-replaced by the plugin manager.
- If a surface is misplaced after scaling, reset to `100%` and open an issue with the DSH version, window size and reproduction steps.

## Uninstall

Remove the `ui-scale` insert block from `~/.dsh/profiles/desktop/cordis.patch.yml` and restart DSH.

## License

[MIT](../../LICENSE)
