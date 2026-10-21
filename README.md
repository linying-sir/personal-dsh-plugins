# personal-dsh-plugins

[![CI](https://github.com/linying-sir/personal-dsh-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/linying-sir/personal-dsh-plugins/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![DSH](https://img.shields.io/badge/DSH-0.2.1--rc.2-4f6bff)](https://deepseek.com)

个人维护的 [DeepSeek Harness](https://deepseek.com)（DSH）插件库。自己写的、改的、长期在用的插件都放在这里，一个插件一个目录；第三方插件不复制代码，只在 [`plugins/manifest.json`](plugins/manifest.json) 里记版本，迁移时由安装器统一拉取。

> A personal, MIT-licensed collection of DeepSeek Harness plugins. Local plugins live under [`plugins/`](plugins); third-party plugins are pinned in the manifest instead of being forked. `scripts/install-profile.mjs` installs both into a DSH profile.

## 插件

**本地插件（代码在本仓库）**

| 插件 | 说明 | 版本 |
| --- | --- | --- |
| [`ui-scale`](plugins/ui-scale) | 侧栏界面缩放（100 / 125 / 150 / 175 / 200%），选择重启后保留；修右栏宽度、浮层和轮次导航落点 | 0.1.2 |
| [`wsl-badge`](plugins/wsl-badge) | 给 `dsh-wsl-workspace` 的侧栏 `W` 按钮加蓝紫渐变徽标；只注入 CSS，不改 WSL 代码 | 0.1.0 |

**外部插件（不在本仓库复制代码）**

| 插件 | 版本 | 说明 |
| --- | --- | --- |
| `dsh-wsl-workspace` | 0.7.8 | WSL 工作区支持，由安装器从 npm 拉取；上游是活跃项目，fork 会带来持续合并成本 |

本地插件都**没有构建步骤**：`lib/` 里的文件就是运行的文件，clone 下来即可安装。

## 一键安装 / 迁移到新电脑

前提：新机器已装好 DSH，并至少启动过一次，让 `~/.dsh/profiles/desktop` 存在。

```powershell
git clone https://github.com/linying-sir/personal-dsh-plugins.git D:\repositories\personal-dsh-plugins
cd D:\repositories\personal-dsh-plugins
node scripts/install-profile.mjs --profile desktop            # 先看计划（dry-run）
node scripts/install-profile.mjs --profile desktop --apply    # 真正写入
```

安装器会：

1. 按 `plugins/manifest.json` 执行 `dsh plugin add dsh-wsl-workspace@0.7.8`，并把它加进 profile 的 `dsh.profile.bundles`。
2. 在 `~/.dsh/profiles/desktop/cordis.patch.yml` 末尾写入一个带标记的托管块，用**本机绝对路径**挂载 `ui-scale` 和 `wsl-badge`。
3. 修改前备份 `package.json` 和 `cordis.patch.yml`，文件名带时间戳。

然后从托盘完全退出 DSH 再启动。

常用参数：

```powershell
node scripts/install-profile.mjs --profile desktop --apply --skip-install  # 只刷新 patch/清单，不跑 dsh plugin add
node scripts/install-profile.mjs --profile desktop --apply --dsh "C:\path\to\dsh.cmd"
```

> 第一次在**已有 profile** 上使用安装器时，如果 patch 里已经手写过 `ui-scale` 的 insert，安装器会拒绝执行以避免重复加载。先把旧的那条 insert 删掉，再让它重建托管块。

## 手动安装

如果只想手动改，打开 `~/.dsh/profiles/desktop/cordis.patch.yml`，在末尾加：

```yaml
- insert:
    - id: ui-scale
      name: 'D:/repositories/personal-dsh-plugins/plugins/ui-scale/lib/index.js'
    - id: wsl-badge
      name: 'D:/repositories/personal-dsh-plugins/plugins/wsl-badge/lib/index.js'
```

- `name` 是**宿主入口** `lib/index.js` 的绝对路径，Windows 下用正斜杠最稳。
- 浏览器入口由插件的 `package.json` 里 `dsh.client` 声明，不需要写进 patch。
- `wsl-badge` 需要先装好 `dsh-wsl-workspace`；没装时它不会报错，也不会显示任何东西。

然后从托盘完全退出并重启 DSH。展开左侧栏，应看到 `Aa` 和带渐变徽标的 `W`。

## 卸载

删掉 patch 里对应的 insert 条目，重启 DSH。`wsl-badge` 卸载后 `W` 会恢复成裸字母；`ui-scale` 写出的偏好文件 `~/.dsh/ui-scale.json` 不会自动删除。

如果不再需要 WSL 插件：

```powershell
dsh plugin --profile desktop remove dsh-wsl-workspace
```

并把它从 profile 的 `dsh.profile.bundles` 里删掉。

## 目录结构

```
personal-dsh-plugins/
├── plugins/
│   ├── manifest.json          # 插件清单：本地插件 + 外部插件版本
│   ├── ui-scale/              # 界面缩放
│   │   ├── lib/index.js       # 宿主半：loopback 路由、读写偏好
│   │   ├── lib/client.js      # 浏览器半：侧栏 Aa 按钮、样式、缩放逻辑
│   │   └── package.json
│   └── wsl-badge/             # WSL 按钮渐变徽标
│       ├── lib/index.js       # 宿主半：空模块
│       ├── lib/client.js      # 浏览器半：只注入一段 CSS
│       └── package.json
├── scripts/
│   ├── check.mjs              # 清单字段、入口文件、JS 语法、manifest 完整性
│   └── install-profile.mjs    # 一键安装/迁移
├── .github/workflows/ci.yml
└── README.md
```

## 为什么 WSL 插件不复制进仓库

- `dsh-wsl-workspace` 是 MIT，复制是允许的；但它有约 1.5 MB、49 个预构建文件，且上游更新频繁。整包 fork 后，每次上游发版都要手动覆盖 `lib/` 再重新合并本地改动。
- 你需要的徽标只是 `.dww-letter` 的一段 CSS，和 WSL 的宿主逻辑无关。把它放进独立的 `wsl-badge`，WSL 可以随时升级，徽标不受影响，也不会和 `ui-scale` 混在一起。
- 迁移时“记不住要装什么”的问题由 manifest 解决：`plugins/manifest.json` 同时记录本地插件和 `dsh-wsl-workspace@0.7.8`，安装器一次装齐。

如果以后确实要改 WSL 的内部逻辑（不只是 CSS），再考虑 fork；到时把 `kind: "package"` 改成 `kind: "path"` 并把它放进 `plugins/` 即可。

## 新增一个插件

1. 复制 `plugins/wsl-badge` 或 `plugins/ui-scale` 为 `plugins/<name>`，把 `package.json` 的 `name` 改成 `dsh-<name>`，更新 `description`、`repository.directory`。
2. 在 `plugins/manifest.json` 的 `plugins` 数组里加一项：本地插件用 `{ "id": "<name>", "kind": "path", "dir": "<name>" }`。
3. 在 profile 的 `cordis.patch.yml` 加 insert（或重新运行安装器刷新托管块）。
4. 更新本 README 的插件表，运行 `npm run check`。

需要构建的插件（TypeScript、打包器等）请把构建产物一并提交到 `lib/`，保证 clone 后无需构建即可用。

## 开发约定

- 一个插件一个目录；目录名等于包名去掉 `dsh-` 前缀。
- `plugins/manifest.json` 必须列全所有本地插件，CI 会检查。
- 不提交 `node_modules/`、日志、本机偏好文件。
- 浏览器半不要假设页面结构永远不变：优先用 `data-*` 钩子、插件 slot、公开的 CSS 变量，必要时再退回结构选择器。
- 宿主半涉及网络时只监听 loopback，并校验 `Host` 头。
- 新插件先在本机 profile 里跑通，再提交。

## 许可

[MIT](LICENSE)。`dsh-wsl-workspace` 按其自身 MIT 许可从 npm 安装，本仓库不复制其代码。
