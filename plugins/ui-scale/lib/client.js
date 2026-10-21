window.__ModuleLoader__.load({
  id: "dsh-ui-scale",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");

    /** Locale namespace owned by this plugin. */
    const NS = "uiScale";
    /** Fast local cache; the Host file at this route is the durable copy. */
    const STORAGE_KEY = "dsh.ui-scale";
    /** Loopback-only Host route that reads and writes the durable preference. */
    const ROUTE = "/ui-scale/api";
    /** The five offered factors; 1 means "native, no extra CSS zoom". */
    const LEVELS = [1, 1.25, 1.5, 1.75, 2];
    /** The A glyph sizes that preview each factor inside the picker. */
    const A_SIZES = [10, 12, 14, 16, 18];
    const STYLE_ATTR = 'data-plugin="dsh-ui-scale"';
    const STYLE_SELECTOR = `style[${STYLE_ATTR}]`;

    const zh = {
      "button.title": "界面缩放",
      "button.aria": "调整界面缩放",
      "panel.title": "界面缩放",
      "panel.subtitle": "整个界面按比例放大，立即生效",
      "panel.footer": "重启后保持",
      "panel.base": "窗口基准",
      "panel.total": "总",
      "panel.active": "当前",
      "level.100": "标准",
      "level.125": "舒适",
      "level.150": "大",
      "level.175": "更大",
      "level.200": "超大",
    };

    const en = {
      "button.title": "UI scale",
      "button.aria": "Adjust the interface scale",
      "panel.title": "UI scale",
      "panel.subtitle": "Scales the whole interface instantly",
      "panel.footer": "Kept after restart",
      "panel.base": "Window base",
      "panel.total": "Total",
      "panel.active": "Current",
      "level.100": "Standard",
      "level.125": "Comfortable",
      "level.150": "Large",
      "level.175": "Larger",
      "level.200": "Huge",
    };

    const CSS = `
/* ---------- sidebar trigger ---------- */
.uis-root {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.uis-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  transition: background-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease), transform 120ms var(--ds-ease-in-out, ease);
}
.uis-trigger:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.uis-trigger:active { transform: scale(0.94); }
.uis-trigger:focus-visible {
  outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 1px;
}
.uis-trigger--rail {
  width: 36px;
  height: 36px;
  color: var(--dsw-alias-label-primary);
}
.uis-glyph {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1;
  transform: translateY(-0.5px);
}
.uis-trigger--rail .uis-glyph { font-size: 15px; }
.uis-dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--dsw-alias-state-business-primary);
  box-shadow: 0 0 0 2px var(--dsw-specific-sidebar-fill, var(--dsw-alias-bg-layer-1));
}
.uis-trigger--rail .uis-dot { top: 7px; right: 7px; }

/* ---------- popover ---------- */
.uis-pop {
  position: fixed;
  left: 12px;
  bottom: 58px;
  z-index: 2147483000;
  box-sizing: border-box;
  width: 272px;
  padding: 13px 13px 11px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-xl, 16px);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  box-shadow: var(--dsw-elevation-prominent, 0 10px 32px rgba(15, 23, 42, 0.18));
  backdrop-filter: blur(18px) saturate(140%);
  transform-origin: 24px calc(100% + 6px);
  animation: uis-pop-in 160ms var(--ds-ease-in-out, ease-out);
}
.uis-pop--rail {
  left: 64px;
  bottom: 12px;
  transform-origin: -6px calc(100% - 26px);
}
.uis-pop::before {
  content: "";
  position: absolute;
  left: 18px;
  bottom: -5.5px;
  width: 10px;
  height: 10px;
  border-right: 0.5px solid var(--dsw-alias-border-l2);
  border-bottom: 0.5px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-1);
  transform: rotate(45deg);
}
.uis-pop--rail::before {
  left: -5.5px;
  bottom: 24px;
  border: 0;
  border-left: 0.5px solid var(--dsw-alias-border-l2);
  border-bottom: 0.5px solid var(--dsw-alias-border-l2);
}
@keyframes uis-pop-in {
  from { opacity: 0; transform: translateY(5px) scale(0.985); }
  to { opacity: 1; transform: none; }
}

/* ---------- header ---------- */
.uis-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 1px 1px 11px;
}
.uis-headText { min-width: 0; }
.uis-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  letter-spacing: 0.01em;
}
.uis-sub {
  margin-top: 2px;
  font-size: 11px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary);
}
.uis-current {
  flex: none;
  padding: 1px 9px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent);
  color: var(--dsw-alias-state-business-primary);
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 20px;
}

/* ---------- five-factor grid ---------- */
.uis-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 5px;
}
.uis-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 58px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  transition: background-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease), transform 120ms var(--ds-ease-in-out, ease), box-shadow 120ms var(--ds-ease-in-out, ease);
}
.uis-card:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
  transform: translateY(-1px);
}
.uis-card:focus-visible {
  outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 1px;
}
.uis-card--active {
  background: linear-gradient(155deg, var(--dsw-alias-state-business-primary) 8%, color-mix(in srgb, var(--dsw-alias-state-business-primary) 62%, #7c5cff) 100%);
  color: #fff;
  box-shadow: 0 5px 14px color-mix(in srgb, var(--dsw-alias-state-business-primary) 34%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.28);
}
.uis-card--active:hover { color: #fff; }
.uis-a {
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.02em;
}
.uis-pct {
  font-size: 9px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
  opacity: 0.72;
}
.uis-card--active .uis-pct { opacity: 0.92; }

/* ---------- footer ---------- */
.uis-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 11px;
  padding: 9px 1px 0;
  border-top: 1px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-tertiary);
  font-size: 10px;
  line-height: 14px;
}
.uis-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}
.uis-status::before {
  content: "";
  flex: none;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--dsw-alias-state-success-primary, #22c55e);
}
.uis-base {
  flex: none;
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
}

@media (prefers-reduced-motion: reduce) {
  .uis-pop, .uis-card, .uis-trigger { animation: none; transition: none; }
}

/* ---------- scaled document ---------- */
html[data-dsh-ui-zoom] {
  overflow: hidden;
  background: var(--dsw-alias-bg-base, #fff);
}
html[data-windows-titlebar][data-dsh-ui-zoom] {
  --dsh-windows-titlebar-height: calc(40px / var(--dsh-ui-scale, 1)) !important;
}
`;

    /** Inject the plugin stylesheet once. */
    function ensureStyles() {
      if (typeof document === "undefined" || document.head === null) return;
      if (document.querySelector(STYLE_SELECTOR) !== null) return;
      const style = document.createElement("style");
      style.setAttribute("data-plugin", "dsh-ui-scale");
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    /** Remove the plugin stylesheet (plugin unload / HMR). */
    function removeStyles() {
      if (typeof document === "undefined") return;
      document.querySelector(STYLE_SELECTOR)?.remove();
    }

    /** Read the local cache, used only for the first paint before the Host answers. */
    function readCachedScale() {
      try {
        const raw = Number(window.localStorage.getItem(STORAGE_KEY));
        if (LEVELS.includes(raw)) return raw;
      } catch {
        /* storage may be unavailable; the Host preference still applies */
      }
      return 1;
    }

    /** Cache the choice locally so the next paint does not flash the wrong size. */
    function writeCachedScale(scale) {
      try {
        window.localStorage.setItem(STORAGE_KEY, String(scale));
      } catch {
        /* the Host preference is the durable copy */
      }
    }

    /** The one live value every picker instance renders. */
    let currentScale = 1;
    /** The factor the document is currently transformed by; menu coordinates divide by it. */
    let cssScale = 1;
    /** Bumped on every user choice so a slow initial GET cannot overwrite it. */
    let revision = 0;
    const scaleListeners = new Set();

    /** Current factor for `useSyncExternalStore`. */
    function getScale() {
      return currentScale;
    }

    /** Subscribe one React tree to factor changes. */
    function subscribeScale(listener) {
      scaleListeners.add(listener);
      return () => {
        scaleListeners.delete(listener);
      };
    }

    /** Publish a factor to every mounted picker. */
    function publishScale(next) {
      if (next === currentScale) return;
      currentScale = next;
      for (const listener of scaleListeners) listener();
    }

    /** Read the durable Host preference; `null` means the route is unavailable. */
    async function loadPersistedScale() {
      try {
        const response = await fetch(ROUTE, {
          method: "GET",
          headers: { accept: "application/json" },
        });
        if (!response.ok) return null;
        const body = await response.json();
        const scale = Number(body?.value?.scale);
        return LEVELS.includes(scale) ? scale : null;
      } catch {
        return null;
      }
    }

    /** Write the durable Host preference; failures leave the cache in charge. */
    async function savePersistedScale(scale) {
      try {
        await fetch(ROUTE, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scale }),
        });
      } catch {
        /* cache + current session still hold the choice */
      }
    }

    /**
     * Apply the factor to the document.
     *
     * A true page zoom needs the layout viewport to become `window / factor`
     * while the rendered page grows back to the window. CSS `zoom` cannot do
     * that: it scales descendants but leaves the body's own box at the
     * reduced width, which squeezes every flex row into a narrow column
     * (the 175% composer bug). A transform on the body scales the body box
     * itself, so the narrowed layout is stretched back over the whole window;
     * `contain: paint` gives fixed-position menus and dialogs the body as
     * their containing block, so they zoom with it instead of escaping to
     * the untransformed viewport.
     */
    function applyScale(scale) {
      const body = document.body;
      if (body === null) return;
      cssScale = scale;
      if (scale === 1) {
        for (const property of [
          "zoom",
          "width",
          "height",
          "transform",
          "transform-origin",
          "contain",
          "overflow",
        ]) {
          body.style.removeProperty(property);
        }
        body.removeAttribute("data-dsh-ui-scale");
        document.documentElement.removeAttribute("data-dsh-ui-zoom");
        document.documentElement.style.removeProperty("--dsh-ui-scale");
        refreshFloatingPositions();
        scheduleFrameMeasure();
        return;
      }
      body.style.removeProperty("zoom");
      body.style.width = `calc(100% / ${scale})`;
      body.style.height = `calc(100% / ${scale})`;
      body.style.transform = `scale(${scale})`;
      body.style.transformOrigin = "0 0";
      body.style.contain = "paint";
      body.style.overflow = "hidden";
      body.setAttribute("data-dsh-ui-scale", String(scale));
      document.documentElement.setAttribute("data-dsh-ui-zoom", "");
      document.documentElement.style.setProperty("--dsh-ui-scale", String(scale));
      refreshFloatingPositions();
      scheduleFrameMeasure();
    }

    /** The three-column frame that owns the left, center and right tracks. */
    function frameElement() {
      if (typeof document === "undefined") return null;
      const column = document.querySelector("[data-rightbar-col]");
      if (column instanceof HTMLElement && column.parentElement !== null) return column.parentElement;
      for (const candidate of document.querySelectorAll('[style*="grid-template-columns"]')) {
        if (candidate instanceof HTMLElement && candidate.style.gridTemplateColumns.includes("minmax(")) {
          return candidate;
        }
      }
      return null;
    }

    /**
     * Make the frame's own measurement local to the transformed document.
     *
     * `ui-layout` sets `viewportWidth` from `frame.getBoundingClientRect().width`
     * and derives the right panel's default width from it (`viewport * 0.45`).
     * That rect is in visual pixels, so at 175% the 2560-pixel window is
     * reported as a 2560-pixel layout viewport even though the frame only
     * lays out 1463 local pixels; the right panel then asks for ~1152 local
     * pixels, which becomes ~2016 visual pixels and covers most of the
     * workspace. Dividing the frame's own rect by the factor gives the layout
     * the same number the CSS grid sees.
     */
    function patchFrameMeasurement() {
      const frame = frameElement();
      if (frame === null || frame.__dshUiScaleRect === true) return;
      const native = frame.getBoundingClientRect.bind(frame);
      frame.getBoundingClientRect = function measureFrame() {
        const rect = native();
        if (cssScale === 1) return rect;
        return new DOMRect(
          rect.x / cssScale,
          rect.y / cssScale,
          rect.width / cssScale,
          rect.height / cssScale,
        );
      };
      frame.__dshUiScaleRect = true;
    }

    /** Nudge the frame's content box so its ResizeObserver re-runs `measure`. */
    function forceFrameMeasure() {
      const frame = frameElement();
      if (frame === null) return;
      const previous = frame.style.width;
      frame.style.width = "calc(100% - 1px)";
      requestAnimationFrame(() => {
        frame.style.width = previous;
      });
    }

    /** Install the frame patch and force one local measurement after a scale change. */
    function scheduleFrameMeasure() {
      if (typeof requestAnimationFrame !== "function") return;
      requestAnimationFrame(() => {
        patchFrameMeasurement();
        forceFrameMeasure();
      });
    }

    /**
     * Inline placement of floating surfaces, keyed by element.
     *
     * DSH computes `left`/`top` for menus, hover cards and tooltips from
     * `getBoundingClientRect()` plus `window.innerWidth`, all in visual
     * viewport pixels. Once the body is transformed those numbers are in the
     * visual system while the inline style is interpreted in the body-local
     * system, so the surface lands at roughly `anchor * factor` — the
     * dropdown or hover card floating far from its anchor. Dividing the
     * inline coordinates by the factor puts the surface back on its anchor;
     * the body transform then scales it to the right visual spot.
     */
    const floatingPositions = new WeakMap();

    /** True for a fixed-position element (inline or computed). */
    function isFixedElement(element) {
      if (element.style.position === "fixed") return true;
      try {
        return getComputedStyle(element).position === "fixed";
      } catch {
        return false;
      }
    }

    /**
     * Rewrite one floating surface's inline coordinates into body-local space.
     * @param element - candidate fixed-position element.
     * @param force - recompute from the last raw values (after a scale change).
     */
    function correctFloatingPosition(element, force = false) {
      if (typeof document === "undefined" || !(element instanceof HTMLElement)) return;
      const left = element.style.left.trim();
      const top = element.style.top.trim();
      if (!left.endsWith("px") || !top.endsWith("px")) return;
      if (!isFixedElement(element)) return;
      const numericLeft = Number.parseFloat(left);
      const numericTop = Number.parseFloat(top);
      if (!Number.isFinite(numericLeft) || !Number.isFinite(numericTop)) return;
      const state = floatingPositions.get(element);
      const alreadyApplied =
        state !== undefined &&
        !force &&
        Math.abs(numericLeft - state.appliedLeft) < 0.5 &&
        Math.abs(numericTop - state.appliedTop) < 0.5;
      if (alreadyApplied) return;
      const rawLeft = force && state !== undefined ? state.rawLeft : numericLeft;
      const rawTop = force && state !== undefined ? state.rawTop : numericTop;
      const appliedLeft = rawLeft / cssScale;
      const appliedTop = rawTop / cssScale;
      floatingPositions.set(element, { rawLeft, rawTop, appliedLeft, appliedTop });
      element.style.left = `${appliedLeft}px`;
      element.style.top = `${appliedTop}px`;
    }

    /** Re-place every open floating surface after the factor changed. */
    function refreshFloatingPositions() {
      if (typeof document === "undefined") return;
      for (const element of document.querySelectorAll('[style*="left"]')) {
        correctFloatingPosition(element, true);
      }
    }

    /** Watch portal surfaces as React adds them and as their placement updates. */
    function installFloatingCorrection() {
      if (typeof document === "undefined" || document.body === null) return () => {};
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === "attributes") {
            correctFloatingPosition(record.target);
            continue;
          }
          for (const node of record.addedNodes) {
            if (!(node instanceof HTMLElement)) continue;
            if (node.matches('[style*="left"]')) correctFloatingPosition(node);
            for (const child of node.querySelectorAll('[style*="left"]')) correctFloatingPosition(child);
          }
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style"],
      });
      return () => {
        observer.disconnect();
      };
    }

    /** The visible main transcript scrollport, if one is mounted. */
    function conversationScroller() {
      if (typeof document === "undefined") return null;
      let best = null;
      for (const element of document.querySelectorAll("[data-conversation-scroll]")) {
        if (!(element instanceof HTMLElement) || element.clientHeight === 0) continue;
        if (element.offsetParent === null) continue;
        if (best === null || element.clientHeight > best.clientHeight) best = element;
      }
      return best;
    }

    /**
     * Return the transcript to the floor after an approval decision.
     *
     * Clicking an approval button focuses it; when the scaled card is taller
     * than the visible strip, that focus scroll moves the transcript just
     * enough for the chat's follow controller to treat it as reader movement
     * and stop following the tail. Scrolling back to the floor lets the
     * controller see a near-floor position again and resume following, so
     * the next streamed content stays visible without pressing the arrow.
     */
    function installApprovalFollowRepair() {
      if (typeof document === "undefined") return () => {};
      const nudge = () => {
        const scroller = conversationScroller();
        if (scroller !== null) scroller.scrollTop = scroller.scrollHeight;
      };
      const onClick = (event) => {
        const approval = event.target instanceof Element ? event.target.closest("[data-approval-key]") : null;
        if (approval === null) return;
        window.setTimeout(nudge, 200);
        window.setTimeout(nudge, 800);
        window.setTimeout(nudge, 1600);
      };
      document.addEventListener("click", onClick, true);
      return () => {
        document.removeEventListener("click", onClick, true);
      };
    }

    /** Format a factor as a whole percentage. */
    function pct(scale) {
      return `${Math.round(scale * 100)}%`;
    }

    /**
     * The footer action: an `Aa` trigger with a flyout of five factors.
     * @param props - slot props (`wide`) plus the injected translator.
     */
    function ScaleAction({ wide, t }) {
      const scale = React.useSyncExternalStore(subscribeScale, getScale, () => 1);
      const [open, setOpen] = React.useState(false);
      const rootRef = React.useRef(null);
      const triggerRef = React.useRef(null);

      React.useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (event) => {
          if (rootRef.current !== null && rootRef.current.contains(event.target)) return;
          setOpen(false);
        };
        const onKeyDown = (event) => {
          if (event.key !== "Escape") return;
          setOpen(false);
          triggerRef.current?.focus();
        };
        document.addEventListener("pointerdown", onPointerDown, true);
        document.addEventListener("keydown", onKeyDown);
        return () => {
          document.removeEventListener("pointerdown", onPointerDown, true);
          document.removeEventListener("keydown", onKeyDown);
        };
      }, [open]);

      const choose = (next) => {
        revision += 1;
        publishScale(next);
        writeCachedScale(next);
        applyScale(next);
        void savePersistedScale(next);
      };

      const baseline = React.useMemo(
        () => Math.round((typeof window === "undefined" ? 1 : window.devicePixelRatio || 1) * 100),
        [],
      );

      const trigger = React.createElement(
        "button",
        {
          type: "button",
          ref: triggerRef,
          className: `uis-trigger${wide ? "" : " uis-trigger--rail"}`,
          title: `${t("button.title")} · ${pct(scale)}`,
          "aria-label": t("button.aria"),
          "aria-haspopup": "dialog",
          "aria-expanded": open,
          onClick: () => setOpen((value) => !value),
        },
        React.createElement("span", { className: "uis-glyph", "aria-hidden": "true" }, "Aa"),
        scale > 1 ? React.createElement("span", { className: "uis-dot", "aria-hidden": "true" }) : null,
      );

      const picker = React.createElement(
        "div",
        {
          className: `uis-pop${wide ? "" : " uis-pop--rail"}`,
          role: "dialog",
          "aria-label": t("panel.title"),
        },
        React.createElement(
          "div",
          { className: "uis-head" },
          React.createElement(
            "div",
            { className: "uis-headText" },
            React.createElement("div", { className: "uis-title" }, t("panel.title")),
            React.createElement("div", { className: "uis-sub" }, t("panel.subtitle")),
          ),
          React.createElement(
            "span",
            {
              className: "uis-current",
              title:
                baseline > 100
                  ? `${t("panel.total")} ${Math.round((baseline / 100) * scale * 100)}%`
                  : undefined,
            },
            pct(scale),
          ),
        ),
        React.createElement(
          "div",
          { className: "uis-grid" },
          LEVELS.map((level, index) =>
            React.createElement(
              "button",
              {
                key: level,
                type: "button",
                className: `uis-card${level === scale ? " uis-card--active" : ""}`,
                "aria-pressed": level === scale,
                title: `${pct(level)} · ${t(`level.${Math.round(level * 100)}`)}`,
                onClick: () => choose(level),
              },
              React.createElement(
                "span",
                {
                  className: "uis-a",
                  style: { fontSize: `${A_SIZES[index]}px` },
                  "aria-hidden": "true",
                },
                "A",
              ),
              React.createElement("span", { className: "uis-pct" }, pct(level)),
            ),
          ),
        ),
        React.createElement(
          "div",
          { className: "uis-foot" },
          React.createElement("span", { className: "uis-status" }, t("panel.footer")),
          baseline > 100
            ? React.createElement("span", { className: "uis-base" }, `${t("panel.base")} ${baseline}%`)
            : null,
        ),
      );

      return React.createElement("div", { className: "uis-root", ref: rootRef }, trigger, open ? picker : null);
    }

    /** Services required by the browser half. */
    const inject = ["slots", "locale"];

    /**
     * Mount the footer action, its dictionary, and the document-level scale.
     * @param ctx - browser plugin context.
     */
    function apply(ctx) {
      ctx.effect(() => {
        ensureStyles();
        return removeStyles;
      }, "ui-scale: styles");

      ctx.effect(() => installFloatingCorrection(), "ui-scale: floating position correction");

      ctx.effect(() => installApprovalFollowRepair(), "ui-scale: approval follow repair");

      ctx.effect(() => {
        patchFrameMeasurement();
      }, "ui-scale: frame measurement");

      ctx.effect(() => ctx.locale.register(NS, { zh, en }), "ui-scale: dictionaries");
      const t = ctx.locale.bind(NS);

      ctx.effect(() => {
        const cached = readCachedScale();
        publishScale(cached);
        applyScale(cached);
        const generation = revision;
        void loadPersistedScale().then((value) => {
          if (value === null || generation !== revision) return;
          writeCachedScale(value);
          publishScale(value);
          applyScale(value);
        });
        return () => applyScale(1);
      }, "ui-scale: document scale");

      ctx.effect(
        () =>
          ctx.slots.inject("sidebar.footer.action", () =>
            ctx.slots.register(
              {
                name: "sidebar.footer.action",
                id: "ui-scale",
                inject: () => ({ t }),
              },
              ScaleAction,
            ),
          ),
        "ui-scale: sidebar footer action",
      );
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
