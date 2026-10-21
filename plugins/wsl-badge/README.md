# dsh-wsl-badge

给 `dsh-wsl-workspace` 侧栏底部的 `W` 按钮换一枚蓝紫渐变的圆角徽标。

插件只向页面注入一段 CSS，**不修改 WSL 插件本身的代码**，所以 WSL 插件升级时徽标不受影响；它也不依赖 `ui-scale`，界面缩放和徽标可以各自开关。

> English: [README.en.md](README.en.md)

## 效果

- 侧栏展开时：18×18 的圆角徽标，5px 圆角，蓝紫渐变，白色 `W`。
- 侧栏收起成 rail 时：22×22，6px 圆角，`W` 略大。
- 悬停时轻微上浮并加深阴影。

## 依赖

- 已安装并启用 [`dsh-wsl-workspace`](https://github.com/dsh-wsl-workspace-maintainers/dsh-wsl-workspace)。
- 没装 WSL 插件时，这个插件不会显示任何东西，也不会报错。

## 安装

在 `~/.dsh/profiles/desktop/cordis.patch.yml` 的 `ui-scale` 同一批 insert 里加一条：

```yaml
- insert:
    - id: ui-scale
      name: 'D:/repositories/personal-dsh-plugins/plugins/ui-scale/lib/index.js'
    - id: wsl-badge
      name: 'D:/repositories/personal-dsh-plugins/plugins/wsl-badge/lib/index.js'
```

然后从托盘完全退出并重启 DSH。宿主半是空模块，浏览器半热重载有时也能生效，但第一次安装建议重启。

## 卸载

删掉 `wsl-badge` 这一条 insert，重启 DSH。WSL 按钮恢复成原来的裸字母 `W`。

## 许可

[MIT](../../LICENSE)
