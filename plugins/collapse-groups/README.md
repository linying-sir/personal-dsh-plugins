# dsh-collapse-groups

![collapse-groups 图标](icon.png)

在左侧栏「工作区 / 会话」的标题行加一个按钮：**一键收起所有展开的工作区分组**，再按一次恢复上次展开的分组。

> English: [README.en.md](README.en.md)

## 行为

- 按钮位于搜索框右侧、视图选项/添加工作区按钮组的左边；它插在动作条**外面**，不会占用 `dsh-wsl-workspace` 的 `W` 按钮位置。
- 按钮图标是一枚 **18×18 的蓝紫渐变个人徽标**（与 WSL 的 `W` 同族），内部是收起箭头；进入「恢复」模式时箭头翻转朝下。
- **第一次点击**：收起所有当前展开的工作区分组。树状模式下先收子分组、再收父分组。
- **第二次点击**：只在「当前没有任何分组展开」时恢复上次收起的分组；如果你中间又手动展开了一个分组，按钮会自动回到「收起所有分组」，再点会收起当前展开的分组，而不是恢复上一轮。
- 进入「恢复」模式时 `aria-pressed="true"`，提示文字同步变成「展开上次折叠的分组」。
- 侧栏收起再展开后，按钮会自动重新插回动作条左边，不会跑到「工作区」文字左边。
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

- 官方没有给这一行留插槽（`sidebar.workspaces` 是整块 single slot，已被 `ui-workspace` 占用），所以按钮是 **DOM 注入** 到工作区标题行的 `_sectionHeader` 里；`MutationObserver` 在 React 重渲染把它移除后补回。
- `dsh-wsl-workspace` 也会把 `W` 按钮注入同一个标题行的 `_headerActions` 动作条，并把该动作条的最大宽度限制为 92px。本插件把按钮放在动作条外面，避免第三个按钮把 `W` 挤出可视区。
- 分组行用 `data-row-key^="workspace:"` + `aria-expanded` 识别，点击分组标题行本身触发展开/收起；插件不直接读写 `ui-workspace` 的内部 store。
- 依赖 `data-row-key`、`aria-expanded` 和 `_headerActions` 这些结构；DSH 改版后如果按钮不出现或点击无效，就是这些锚点变了。它不会改动任何会话或工作区数据。
- 只在浏览器端运行，不发网络请求，不读取会话内容。

## 卸载

删除 `cordis.patch.yml` 里的 `collapse-groups` insert，重启 DSH。注入的按钮会随插件一起卸载。

## 许可

[MIT](../../LICENSE)
