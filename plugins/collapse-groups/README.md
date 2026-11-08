# dsh-collapse-groups

在左侧栏「工作区 / 会话」的标题行加一个按钮：**一键收起所有展开的工作区分组**，再按一次恢复上次展开的分组。

> English: [README.en.md](README.en.md)

## 行为

- 按钮位于搜索框、视图选项、添加工作区所在的那一行，在「添加工作区」左边。
- **第一次点击**：收起所有当前展开的工作区分组。树状模式下先收子分组、再收父分组。
- **第二次点击**：只重新展开「上次收起时处于展开状态」的那些分组，不会把原本就折叠的分组打开。
- 按钮进入「已收起」模式时变成主题强调色，`aria-pressed="true"`，提示文字同步变成「展开上次折叠的分组」。
- 平铺模式或没有任何工作区分组时，按钮自动隐藏。
- 展开状态仍由 `ui-workspace` 自己的 store 管理，原有的持久化行为不变。

## 安装

在 `~/.dsh/profiles/desktop/cordis.patch.yml` 的本地插件 insert 里加一条：

```yaml
- insert:
    - id: collapse-groups
      name: 'D:/repositories/personal-dsh-plugins/plugins/collapse-groups/lib/index.js'
```

然后从托盘完全退出并重启 DSH。宿主半是空模块，浏览器半需要随页面重新加载。

## 实现与限制

- 官方没有给这一行留插槽（`sidebar.workspaces` 是整块 single slot，已被 `ui-workspace` 占用），所以按钮是 **DOM 注入** 到工作区标题行的 `_headerActions` 容器里；`MutationObserver` 在 React 重渲染把它移除后补回。
- 分组行用 `data-row-key^="workspace:"` + `aria-expanded` 识别，点击分组标题行本身触发展开/收起；插件不直接读写 `ui-workspace` 的内部 store。
- 依赖 `data-row-key`、`aria-expanded` 和 `_headerActions` 这些结构；DSH 改版后如果按钮不出现或点击无效，就是这些锚点变了。它不会改动任何会话或工作区数据。
- 只在浏览器端运行，不发网络请求，不读取会话内容。

## 卸载

删除 `cordis.patch.yml` 里的 `collapse-groups` insert，重启 DSH。注入的按钮会随插件一起卸载。

## 许可

[MIT](../../LICENSE)
