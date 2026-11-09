# AGENTS.md

本仓库是个人 DSH 插件库。所有插件共享一套「个人功能」视觉语言；新插件、改图标前先读这里。

## 一眼区分

- **DSH 原生图标**：16×16 线性图标，`currentColor`，放在 28×28 按钮里。
- **个人插件图标**：18×18 蓝紫渐变圆角块 + 白色 glyph，仍放在同样的 28×28 按钮里。视觉上比原生大 2px、颜色占位更满，但按钮热区和布局不变。
- 所有个人图标共用同一套特征色和尺寸；不要引入第二种「个人强调色」。

## 特征色

```css
background: linear-gradient(145deg, #6aa2ff 0%, #5b6cff 46%, #9a5cff 100%);
```

- 白色前景 glyph，圆角 5px；可选 1px 内高光/阴影。
- 这套渐变与 WSL 的 `W` 徽标同族；第三方 W 徽标本身也是 18×18。
- 激活/收起状态只通过 glyph 翻转、点或文字表达，不要换一套颜色。

## 特征尺寸

- 图标块 **18×18**；按钮热区 **28×28**（rail 36×36）。
- 线性 glyph 描边 1.5–1.6；不要低于 1.3。
- 文字类图标（`Aa`）也必须放进同样的 18×18 渐变块：白色、9.5–10px、700、`letter-spacing: -0.06em`；不要用裸文字。
- 图标在按钮里居中；块占 18px，比 DSH 原生 16px 图标略大、更满。

## 文件约定

- 每个插件提供 `icon.svg`（`viewBox="0 0 18 18"`）和 `icon.png`（256×256，透明背景）。
- `package.json` 写 `"icon": "./icon.svg"`，`files` 包含 `icon.svg`、`icon.png`。
- README 顶部用 `icon.png` 展示。
- 纯 CSS 覆盖插件（如 `wsl-badge`）可以复用目标图标，但仍应提供自己的图标文件。

## 交互与共存

- 按钮的悬浮解释统一用 `@deepseek-ai/dsh-client-ui-primitives` 的 `Tooltip`，**不要用原生 `title`**：浏览器默认提示偏小，和 DSH/WSL 的提示不一致。
- **已知问题**：`ui-scale` 在 175% 下，共享 `Tooltip` 的 fixed portal 会被 body transform 和浮层修正影响，位置/字号可能异常。在 scale-aware 定位方案完成前，`ui-scale` 和 `collapse-groups` 暂时保留原生 `title`；不要直接照搬它们的写法。
- 标题行按钮用 `side="bottom"`，底栏按钮用 `side="top"`，`delayMs={500}`；`label` 与 `aria-label` 保持一致。
- 不要挤占第三方已有的 DOM 宽度或座位：`dsh-wsl-workspace` 的 `_headerActions` 固定 92px，个人按钮要放在动作条外或另找位置。
- 标题/`aria-label` 只描述动作；「个人」身份由图标表达，不加「个人」前缀。
- 悬停、焦点沿用 DSH 的 token，不自定义颜色。

## 新插件检查表

- [ ] 图标是 18×18 渐变块，不是 16×16 线性图标？
- [ ] 白色 glyph 清晰，描边 ≥1.5？
- [ ] 按钮仍是 28×28（rail 36×36）？
- [ ] 文字图标也用了同一渐变块？
- [ ] 若使用共享 `Tooltip`，已在 175% 下确认 portal 位置和字号正常？
- [ ] `icon.svg` / `icon.png` / `package.json` 的 `icon` / README 预览齐了？

## English summary

Every personal plugin uses the same blue-violet **18×18 gradient tile** with a white glyph inside DSH's standard **28×28** button. It reads slightly larger and fuller than DSH's 16×16 line icons. Text glyphs such as `Aa` use the same tile, never bare text. Hover labels should use the shared DSH `Tooltip`, but verify its portal placement at 175% first; the current ui-scale/collapse buttons keep a native `title` until that scale-aware fix lands. No second accent colour; respect third-party seats (for example the WSL `W` strip).
