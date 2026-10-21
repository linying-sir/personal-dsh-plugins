# dsh-ui-scale

DeepSeek Harness 的界面缩放插件。左侧栏底部多一个 `Aa` 按钮，点开选 **100 / 125 / 150 / 175 / 200%**，整个界面立即按比例放大，选择会持久化，重启后保留。

> English: [README.en.md](README.en.md)

## 功能

- 侧栏 `Aa` 触发器 + 五档比例弹层，带 `aria-*` 与键盘操作（`Esc` 关闭）。
- 选择写入 `~/.dsh/ui-scale.json`（宿主半的 loopback 路由 `/ui-scale/api`），`localStorage` 只做首屏缓存，所以关掉再开仍是同一比例。
- 弹层里的 `100%` 表示「当前窗口基准」；如果窗口启动时本身带了 125% 缩放，弹层底部会显示「窗口基准 125%」，避免把两层缩放叠加弄混。
- 适配放大后的浮层定位、右栏宽度、审批卡片焦点滚动和右侧轮次导航落点；放大时刻度也略加粗，详见下面「实现要点」。

## 安装

插件按绝对路径挂在 DSH profile 的 patch 里。克隆仓库后，在 `~/.dsh/profiles/desktop/cordis.patch.yml` 末尾追加：

```yaml
- insert:
    - id: ui-scale
      name: 'D:/repositories/personal-dsh-plugins/plugins/ui-scale/lib/index.js'
```

把路径换成你机器上的实际位置，然后**从托盘完全退出并重启 DSH**。宿主半是 Node 模块，热重载不会重新 import 它。

也可以把插件作为依赖装进 profile：

```powershell
dsh plugin --profile desktop add D:\repositories\personal-dsh-plugins\plugins\ui-scale
```

再把 patch 里的 `name` 改成包名 `'dsh-ui-scale'`。两种方式只选一种。

## 使用

1. 展开左侧栏，底部账号行上方会看到 `Aa`。
2. 点 `Aa`，在弹层里点一个比例。
3. `100%` = 当前窗口的原生大小（复位）。

175% 及以上建议把窗口最大化：布局宽度 = 窗口宽度 ÷ 倍率，窗口只有 850px 宽时，175% 只剩约 486px 可用，输入框会显得挤，这不是布局 bug。

## 实现要点

### 为什么是 `transform` 而不是 `zoom`

插件把 `body` 的布局尺寸缩到 `100% / 倍率`，再用 `transform: scale(倍率)` 把整个 body 放大回窗口，并用 `contain: paint` 让固定定位的菜单、弹窗跟随 body 一起缩放。

这样布局视口真正变成 `窗口 / 倍率`。CSS `zoom` 做不到这一点：它只缩放后代，body 自己的盒子仍停在缩窄后的宽度，最终会把每一行 flex 布局压进一条窄列——这就是早期 175% 时输入框缩成一团的原因。

### 浮层坐标修正

DSH 用 `getBoundingClientRect()`（视觉坐标，已经乘过倍率）计算浮动元素的 `left/top`，但内联样式会被 body 的 transform 再乘一次，于是浮层落到「锚点 × 倍率」的位置。

插件用 `MutationObserver` 监听所有 `position: fixed` 且带内联 `left/top` 的元素，把坐标除以当前倍率；React 重新定位或倍率变化时会再修正。工作区、模型、模式、会话「…」菜单，以及工作区悬浮卡、tooltip 都走这条路径。

### 右栏宽度

右侧栏宽度有同样的测量问题：`ui-layout` 用 frame 的 `getBoundingClientRect().width` 当布局视口，再按 `视口 × 0.45` 给右栏默认宽度。175% 时这个值读到的是 2560 而不是 1463，右栏就会拿到约 1152 个局部像素、放大后几乎铺满工作区。

插件把 frame 自身的 rect 除以当前倍率，并轻推一次 `ResizeObserver`，让布局按 1463 重新计算列宽；右栏恢复成窗口的 45% 左右。

### 审批卡片焦点

点「允许一次 / 拒绝」时按钮获得焦点，在放大后的卡片里这会滚动会话区，`ui-chat` 的 follow 控制器把它当成读者主动滚动，于是后续流式内容不再自动跟到底部。

插件在审批按钮点击后分几次把可见的 `[data-conversation-scroll]` 滚回底部，让控制器重新看到 near-bottom 位置并恢复跟随。

### 轮次导航

`ui-chat` 的轮次跳转用 `row.getBoundingClientRect().top - scroller.getBoundingClientRect().top` 算出视觉差，再加到 `scrollTop`（布局像素）上。body 被放大后，视觉差是布局差的 1.75 倍，所以点击右侧轮次刻度会越跳越偏，多轮会话里尤其明显。

插件在捕获阶段监听刻度点击，等 `ui-chat` 自己落点后，把视觉差除以当前倍率，重新把目标轮次对齐到视口顶部 24px；点击未加载的轮次时会等历史加载完再落点。放大状态下刻度从 20×2 提到 24×3（当前项 28×3.5），长会话里更容易看清和点中。

## 注意

- 如果仍用 `DeepSeek Harness (UI 125%).lnk` 这类带缩放的快捷方式启动，窗口本身已经是 125%；插件里的 `100%` 就表示这个 125% 的总效果，再选 125% 会叠加成约 156%。建议用普通快捷方式启动，缩放交给 `Aa`。
- 选择会写到 `~\.dsh\ui-scale.json`；重启后从该文件恢复，之后每次点 `Aa` 都会立即写文件。
- 改动宿主半 `lib/index.js` 后必须重启 DSH；只改浏览器半时插件管理器会热替换。
- 若某个界面在放大后位置不对，先点 `100%` 复位，再提 issue 并附上 DSH 版本、窗口尺寸和复现步骤。

## 卸载

删除 `~\.dsh\profiles\desktop\cordis.patch.yml` 末尾的 `ui-scale` 插入块，重启 DSH。

## 许可

[MIT](../../LICENSE)
