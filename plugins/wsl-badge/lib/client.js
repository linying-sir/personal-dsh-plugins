window.__ModuleLoader__.load({
  id: "dsh-wsl-badge",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const STYLE_ATTR = 'data-plugin="dsh-wsl-badge"';
    const STYLE_SELECTOR = `style[${STYLE_ATTR}]`;

    /**
     * The badge stylesheet.
     *
     * dsh-wsl-workspace owns the `.dww-letter` span and gives it the sidebar
     * action's typography. This stylesheet turns that span into a compact
     * gradient badge and draws the W with a pseudo-element, hiding the text
     * node at `font-size: 0`. `!important` is deliberate: the two stylesheets
     * may load in either order, and the badge must win either way.
     */
    const CSS = `
.dww-letter {
  box-sizing: border-box !important;
  width: 18px !important;
  height: 18px !important;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  background: linear-gradient(145deg, #6aa2ff 0%, #5b6cff 46%, #9a5cff 100%);
  box-shadow: 0 1px 2px rgba(18, 32, 70, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.34);
  color: #fff !important;
  font-size: 0 !important;
  line-height: 1 !important;
  flex: none !important;
  user-select: none;
  transition: transform 140ms var(--ds-ease-in-out, ease), box-shadow 140ms var(--ds-ease-in-out, ease);
}
.dww-letter::before {
  content: "W";
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  text-shadow: 0 1px 1px rgba(10, 20, 50, 0.24);
}
.dww-action:hover .dww-letter {
  transform: translateY(-1px);
  box-shadow: 0 3px 7px rgba(18, 32, 70, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.4);
}
.dww-action--rail .dww-letter {
  width: 22px !important;
  height: 22px !important;
  border-radius: 6px;
}
.dww-action--rail .dww-letter::before { font-size: 13px; }

@media (prefers-reduced-motion: reduce) {
  .dww-letter { transition: none; }
}
`;

    /** Inject the plugin stylesheet once. */
    function ensureStyles() {
      if (typeof document === "undefined" || document.head === null) return;
      if (document.querySelector(STYLE_SELECTOR) !== null) return;
      const style = document.createElement("style");
      style.setAttribute("data-plugin", "dsh-wsl-badge");
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    /** Remove the plugin stylesheet (plugin unload / HMR). */
    function removeStyles() {
      if (typeof document === "undefined") return;
      document.querySelector(STYLE_SELECTOR)?.remove();
    }

    /** Required browser services. */
    const inject = [];

    /**
     * Install the stylesheet and remove it when the plugin unloads.
     * @param ctx - browser plugin context.
     */
    function apply(ctx) {
      ctx.effect(() => {
        ensureStyles();
        return removeStyles;
      }, "wsl-badge: styles");
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
