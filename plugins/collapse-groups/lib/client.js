window.__ModuleLoader__.load({
  id: "dsh-collapse-groups",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");
    const ReactDOMClient = require("react-dom/client");
    const { Tooltip } = require("@deepseek-ai/dsh-client-ui-primitives");

    /** The plugin's own attribute value; also namespaces its stylesheet. */
    const PLUGIN = "dsh-collapse-groups";
    /** Workspace group rows: stable semantic attributes, not CSS-module classes. */
    const GROUP_SELECTOR = '[data-row-key^="workspace:"][role="treeitem"][aria-expanded]';
    /** The style tag carries the same data-plugin attribute as the button. */
    const STYLE_SELECTOR = `style[data-plugin="${PLUGIN}"]`;

    const ICON = `
<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="dscg-personal-gradient" x1="2" y1="2" x2="16" y2="16" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#6aa2ff"/>
      <stop offset="0.46" stop-color="#5b6cff"/>
      <stop offset="1" stop-color="#9a5cff"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="18" height="18" rx="5.5" fill="url(#dscg-personal-gradient)"/>
  <g data-chevrons>
    <path d="M4.6 8.9 9 4.5l4.4 4.4" stroke="#fff" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4.6 13.5 9 9.1l4.4 4.4" stroke="#fff" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

    const CSS = `
.dscg-host {
  display: inline-flex;
  flex: none;
}
.dscg-icon {
  display: inline-flex;
}
button[data-plugin="dsh-collapse-groups"]:not([class*="iconButton"]) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--dsw-radius-md, 8px);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
button[data-plugin="dsh-collapse-groups"]:not([class*="iconButton"]):hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
button[data-plugin="dsh-collapse-groups"]:focus-visible {
  outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: -2px;
}
button[data-plugin="dsh-collapse-groups"][data-mode="expand"] [data-chevrons] {
  transform: rotate(180deg);
  transform-origin: 9px 9px;
}
button[data-plugin="dsh-collapse-groups"]:disabled {
  opacity: 0.55;
}
/* Match the action strip's own search-expanded state. */
[class*="_sectionHeader"]:has([class*="_headerActionsHidden"]) button[data-plugin="dsh-collapse-groups"] {
  display: none !important;
}
button[data-plugin="dsh-collapse-groups"] svg {
  display: block;
  width: 18px;
  height: 18px;
}
`;

    /** Inject the plugin stylesheet once. */
    function ensureStyles() {
      if (typeof document === "undefined" || document.head === null) return;
      if (document.querySelector(STYLE_SELECTOR) !== null) return;
      const style = document.createElement("style");
      style.setAttribute("data-plugin", PLUGIN);
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    /** Remove the plugin stylesheet (plugin unload / HMR). */
    function removeStyles() {
      if (typeof document === "undefined") return;
      document.querySelector(STYLE_SELECTOR)?.remove();
    }

    /** True when the current UI language is Chinese. */
    function isChinese() {
      const language = document.documentElement.lang || navigator.language || "";
      return language.toLowerCase().startsWith("zh");
    }

    /** All workspace group rows currently mounted. */
    function groupRows() {
      if (typeof document === "undefined") return [];
      return [...document.querySelectorAll(GROUP_SELECTOR)].filter(
        (row) =>
          row instanceof HTMLElement && (row.dataset.rowKey ?? "").startsWith("workspace:"),
      );
    }

    /** Wait until React has committed the state updates caused by the clicks. */
    function afterCommit() {
      return new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    }

    /** True for the workspace header's add button (localized label). */
    function isAddWorkspaceButton(element) {
      if (!(element instanceof HTMLElement)) return false;
      return /添加工作区|add workspace/i.test(element.getAttribute("aria-label") ?? "");
    }

    /**
     * Find the workspace section header and its action strip. The button is
     * inserted into the header *beside* the strip, not inside it: dsh-wsl-workspace
     * also mounts its W entry inside `_headerActions` and pins that strip to
     * 92px, so a third button inside would clip the W.
     * @returns {container: HTMLElement, anchor: HTMLElement, sample: Element | null} | null
     */
    function headerAnchor() {
      const containers = [...document.querySelectorAll('[class*="_headerActions"]')].filter(
        (node) => node instanceof HTMLElement,
      );
      for (const actions of containers) {
        const header = actions.closest('[class*="_sectionHeader"]');
        if (!(header instanceof HTMLElement)) continue;
        const add = [...actions.querySelectorAll("button[aria-label]")].find(isAddWorkspaceButton);
        if (add instanceof HTMLElement) {
          return { container: header, anchor: actions, sample: add };
        }
      }
      for (const actions of containers) {
        const header = actions.closest('[class*="_sectionHeader"]');
        if (header instanceof HTMLElement) {
          return { container: header, anchor: actions, sample: actions.querySelector("button") };
        }
      }
      return null;
    }

    /** The host span owned by this plugin; React renders the tooltip and button inside it. */
    let host = null;
    /** React root mounted into `host`. */
    let root = null;
    /** Class list copied from the shipped header button. */
    let buttonClass = "";
    /** Last rendered React props, so unrelated DOM mutations do not re-render. */
    let lastRenderKey = "";
    /** Group keys that were expanded when the last collapse started. */
    let savedKeys = null;
    /** True while a collapse/restore pass is running. */
    let busy = false;
    /** Ignore group mutations caused by this plugin's own clicks until this time. */
    let internalUntil = 0;
    /** Set by cleanup so an in-flight pass stops touching the DOM. */
    let disposed = false;

    /** The button wrapped in the same Tooltip primitive the shipped controls use. */
    function CollapseButton({ label, mode, className, disabled, onClick }) {
      return React.createElement(
        Tooltip,
        { label, side: "bottom", delayMs: 500 },
        React.createElement(
          "button",
          {
            type: "button",
            className,
            "data-plugin": PLUGIN,
            "data-mode": mode,
            "aria-label": label,
            "aria-pressed": mode === "expand" ? "true" : "false",
            disabled,
            onClick,
          },
          React.createElement("span", {
            className: "dscg-icon",
            "aria-hidden": "true",
            dangerouslySetInnerHTML: { __html: ICON },
          }),
        ),
      );
    }

    /** Update label, pressed state and visibility from the current state. */
    function renderButton() {
      if (host === null || root === null) return;
      const rows = groupRows();
      const hasGroups = rows.length > 0;
      host.style.display = hasGroups ? "" : "none";
      const zh = isChinese();
      // Restore is only the action when nothing is expanded and the last
      // collapse left a remembered set. A manual expansion flips the button
      // back to "collapse" through the aria-expanded observer.
      const expanding =
        rows.every((row) => row.getAttribute("aria-expanded") !== "true") &&
        savedKeys !== null &&
        savedKeys.size > 0;
      const label = expanding
        ? zh
          ? "展开上次折叠的分组"
          : "Expand last collapsed groups"
        : zh
          ? "收起所有分组"
          : "Collapse all groups";
      const mode = expanding ? "expand" : "collapse";
      const className = buttonClass === "" ? "dscg-button" : buttonClass;
      const key = `${label}|${mode}|${className}|${String(busy)}`;
      if (key === lastRenderKey) return;
      lastRenderKey = key;
      root.render(
        React.createElement(CollapseButton, {
          label,
          mode,
          className,
          disabled: busy,
          onClick,
        }),
      );
    }

    /**
     * Collapse every expanded workspace group.
     *
     * Groups are clicked in reverse document order so nested children collapse
     * before their parent hides them. Repeats for a few frames in case React
     * batches or mounts rows late.
     * @returns whether anything was expanded.
     */
    async function collapseAll() {
      const expanded = groupRows().filter(
        (row) => row.getAttribute("aria-expanded") === "true",
      );
      if (expanded.length === 0) return false;
      savedKeys = new Set(expanded.map((row) => row.dataset.rowKey));
      for (let pass = 0; pass < 6; pass += 1) {
        if (disposed) return false;
        const remaining = groupRows()
          .filter((row) => row.getAttribute("aria-expanded") === "true")
          .reverse();
        if (remaining.length === 0) break;
        for (const row of remaining) row.click();
        await afterCommit();
      }
      if (disposed) return false;
      internalUntil = performance.now() + 150;
      return true;
    }

    /**
     * Re-expand the groups remembered by the last collapse, parents first.
     * @returns whether the restore pass ran.
     */
    async function restoreAll() {
      if (savedKeys === null || savedKeys.size === 0) return false;
      const keys = savedKeys;
      for (let pass = 0; pass < 6; pass += 1) {
        if (disposed) return false;
        const collapsed = groupRows().filter(
          (row) =>
            keys.has(row.dataset.rowKey) && row.getAttribute("aria-expanded") === "false",
        );
        if (collapsed.length === 0) break;
        for (const row of collapsed) row.click();
        await afterCommit();
      }
      if (disposed) return false;
      savedKeys = null;
      internalUntil = performance.now() + 150;
      return true;
    }

    /** Collapse the current expansion, or restore it when nothing is expanded. */
    async function onClick(event) {
      event.preventDefault();
      event.stopPropagation();
      if (busy) return;
      busy = true;
      renderButton();
      try {
        const hasExpanded = groupRows().some(
          (row) => row.getAttribute("aria-expanded") === "true",
        );
        if (hasExpanded) await collapseAll();
        else await restoreAll();
      } finally {
        busy = false;
        renderButton();
      }
    }

    /** Create the React host that will carry the Tooltip and button. */
    function createHost() {
      const element = document.createElement("span");
      element.className = "dscg-host";
      element.setAttribute("data-plugin-host", PLUGIN);
      root = ReactDOMClient.createRoot(element);
      return element;
    }

    /**
     * Keep exactly one plugin host in the workspace section header.
     * React owns that row, so this runs again whenever the row is replaced.
     */
    function ensureButton() {
      if (typeof document === "undefined" || document.body === null) return;
      if (host === null) host = createHost();
      for (const stale of document.querySelectorAll(`span[data-plugin-host="${PLUGIN}"]`)) {
        if (stale !== host) stale.remove();
      }
      const found = headerAnchor();
      if (found === null) {
        host.style.display = "none";
        return;
      }
      const sample =
        found.sample instanceof HTMLElement
          ? found.sample
          : found.anchor.querySelector("button");
      const nextClass =
        sample instanceof HTMLElement && sample.className !== "" ? sample.className : "";
      if (nextClass !== buttonClass) {
        buttonClass = nextClass;
        lastRenderKey = "";
      }
      const anchor = found.anchor.parentElement === found.container ? found.anchor : null;
      const placed =
        host.isConnected &&
        host.parentElement === found.container &&
        (anchor === null ? host.nextElementSibling === null : host.nextElementSibling === anchor);
      if (!placed) {
        // React can mount the label/search around our node when the sidebar
        // collapses and expands; always put the host back just before the
        // action strip rather than trusting its previous index.
        found.container.insertBefore(host, anchor);
      }
      renderButton();
    }

    /** Install styles, the button and its re-insertion observers. */
    function installButton() {
      if (typeof document === "undefined" || document.body === null) return () => {};
      disposed = false;
      ensureStyles();
      ensureButton();
      let frame = null;
      const schedule = () => {
        if (frame !== null) return;
        frame = requestAnimationFrame(() => {
          frame = null;
          ensureButton();
        });
      };
      const observer = new MutationObserver(schedule);
      observer.observe(document.body, { childList: true, subtree: true });
      const stateObserver = new MutationObserver((records) => {
        if (busy || performance.now() < internalUntil) return;
        for (const record of records) {
          if (record.type !== "attributes" || record.attributeName !== "aria-expanded") continue;
          const target = record.target;
          if (!(target instanceof HTMLElement)) continue;
          if (!(target.dataset.rowKey ?? "").startsWith("workspace:")) continue;
          // A manual group change invalidates the remembered restore set.
          savedKeys = null;
          renderButton();
          return;
        }
      });
      stateObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["aria-expanded"],
        subtree: true,
      });
      const languageObserver = new MutationObserver(() => renderButton());
      languageObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["lang"],
      });
      return () => {
        disposed = true;
        observer.disconnect();
        stateObserver.disconnect();
        languageObserver.disconnect();
        if (frame !== null) cancelAnimationFrame(frame);
        if (root !== null) {
          root.unmount();
          root = null;
        }
        if (host !== null) {
          host.remove();
          host = null;
        }
        removeStyles();
        savedKeys = null;
        internalUntil = 0;
        busy = false;
        buttonClass = "";
        lastRenderKey = "";
      };
    }

    /** Required browser services. */
    const inject = [];

    /**
     * Install the header button beside the workspace search/view/add controls.
     * @param ctx - browser plugin context.
     */
    function apply(ctx) {
      ctx.effect(() => installButton(), "collapse-groups: workspace header button");
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
