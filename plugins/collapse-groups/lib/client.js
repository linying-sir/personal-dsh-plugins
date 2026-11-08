window.__ModuleLoader__.load({
  id: "dsh-collapse-groups",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    /** The plugin's own attribute value; also namespaces its stylesheet. */
    const PLUGIN = "dsh-collapse-groups";
    /** Workspace group rows: stable semantic attributes, not CSS-module classes. */
    const GROUP_SELECTOR = '[data-row-key^="workspace:"][role="treeitem"][aria-expanded]';
    /** The style tag carries the same data-plugin attribute as the button. */
    const STYLE_SELECTOR = `style[data-plugin="${PLUGIN}"]`;

    const ICON = `
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="dscg-personal-gradient" x1="2" y1="2" x2="14" y2="14" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#6aa2ff"/>
      <stop offset="0.46" stop-color="#5b6cff"/>
      <stop offset="1" stop-color="#9a5cff"/>
    </linearGradient>
  </defs>
  <rect x="1.5" y="1.5" width="13" height="13" rx="3.8" fill="url(#dscg-personal-gradient)"/>
  <g data-chevrons>
    <path d="M4.4 7.7 8 4.1l3.6 3.6" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4.4 11.9 8 8.3l3.6 3.6" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

    const CSS = `
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
  transform-origin: 8px 8px;
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

    /** The button, created once and re-inserted if React replaces the header. */
    let button = null;
    /** "collapse" = next press collapses; "expand" = next press restores. */
    let mode = "collapse";
    /** Group keys that were expanded when the last collapse started. */
    let savedKeys = null;
    /** True while a collapse/restore pass is running. */
    let busy = false;
    /** Set by cleanup so an in-flight pass stops touching the DOM. */
    let disposed = false;

    /** Update label, pressed state and visibility from the current state. */
    function renderButton() {
      if (button === null) return;
      const hasGroups = groupRows().length > 0;
      button.style.display = hasGroups ? "" : "none";
      const zh = isChinese();
      const expanding = mode === "expand";
      const label = expanding
        ? zh
          ? "展开上次折叠的分组"
          : "Expand last collapsed groups"
        : zh
          ? "收起所有分组"
          : "Collapse all groups";
      button.setAttribute("aria-label", label);
      button.title = label;
      button.setAttribute("aria-pressed", expanding ? "true" : "false");
      button.dataset.mode = mode;
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
      mode = "expand";
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
      mode = "collapse";
      return true;
    }

    /** Collapse on one press, restore the previous expansion on the next. */
    async function onClick(event) {
      event.preventDefault();
      event.stopPropagation();
      if (busy) return;
      busy = true;
      if (button !== null) button.disabled = true;
      try {
        if (mode === "collapse") await collapseAll();
        else await restoreAll();
      } finally {
        busy = false;
        if (button !== null) button.disabled = false;
        renderButton();
      }
    }

    /** Create the header button once. */
    function createButton() {
      const element = document.createElement("button");
      element.type = "button";
      element.setAttribute("data-plugin", PLUGIN);
      element.innerHTML = ICON;
      element.addEventListener("click", onClick);
      return element;
    }

    /**
     * Keep exactly one plugin button in the workspace section header.
     * React owns that row, so this runs again whenever the row is replaced.
     */
    function ensureButton() {
      if (typeof document === "undefined" || document.body === null) return;
      if (button === null) button = createButton();
      for (const stale of document.querySelectorAll(`button[data-plugin="${PLUGIN}"]`)) {
        if (stale !== button) stale.remove();
      }
      if (
        button.isConnected &&
        button.parentElement instanceof HTMLElement &&
        button.parentElement.matches('[class*="_sectionHeader"]')
      ) {
        renderButton();
        return;
      }
      const found = headerAnchor();
      if (found === null) {
        button.style.display = "none";
        return;
      }
      const sample =
        found.sample instanceof HTMLElement
          ? found.sample
          : found.anchor.querySelector("button");
      if (sample instanceof HTMLElement && sample.className !== "") {
        button.className = sample.className;
      }
      const anchor = found.anchor.parentElement === found.container ? found.anchor : null;
      found.container.insertBefore(button, anchor);
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
      const languageObserver = new MutationObserver(() => renderButton());
      languageObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["lang"],
      });
      return () => {
        disposed = true;
        observer.disconnect();
        languageObserver.disconnect();
        if (frame !== null) cancelAnimationFrame(frame);
        if (button !== null) {
          button.remove();
          button = null;
        }
        removeStyles();
        savedKeys = null;
        mode = "collapse";
        busy = false;
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
