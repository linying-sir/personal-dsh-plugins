# personal-dsh-plugins

[![CI](https://github.com/linying-sir/personal-dsh-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/linying-sir/personal-dsh-plugins/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![DSH](https://img.shields.io/badge/DSH-0.2.1--rc.2-4f6bff)](https://deepseek.com)

个人维护的 [DeepSeek Harness](https://deepseek.com)（DSH）插件库。自己写的、改的、长期在用的插件都放在这里，一个插件一个目录，方便复用、版本管理和分享。

> A personal, MIT-licensed collection of DeepSeek Harness plugins. Each plugin lives in its own folder under [`plugins/`](plugins). Install instructions and code comments are in Chinese and English.

## 插件

| 插件 | 说明 | 版本 | 状态 |
| --- | --- | --- | --- |
| [`ui-scale`](plugins/ui-scale) | 侧栏界面缩放（100 / 125 / 150 / 175 / 200%），选择重启后保留；顺带把 WSL 工作区的 `W` 换成渐变徽标 | 0.1.0 | 稳定 |

插件都**没有构建步骤**：`lib/` 里的文件就是运行的文件，clone 下来即可安装，不需要在用户机器上装工具链。

## 环境

- DeepSeek Harness Desktop **0.2.1-rc.2**（开发与验证所用版本；更早或更新的版本未逐一验证）
- Windows 11（插件只依赖 Node 内置模块与浏览器 API，macOS / Linux 理论可用）
- Node.js ≥ 22（仅运行仓库自检 `npm run check` 时需要）

## 安装

### 1. 克隆到一个固定位置

```powershell
git clone https://github.com/linying-sir/personal-dsh-plugins.git D:\repositories\personal-dsh-plugins
```

路径随你，但**不要放在临时目录**：profile 里记录的是绝对路径，移动仓库后要同步修改。

### 2. 在 profile 的 patch 里加一条 insert

打开：

```
C:\Users\<你>\.dsh\profiles\desktop\cordis.patch.yml
```

在文件末尾追加：

```yaml
- insert:
    - id: ui-scale
      name: 'D:/repositories/personal-dsh-plugins/plugins/ui-scale/lib/index.js'
```

- `id` 是这个插件在插件树里的唯一名字，保持 `ui-scale`。
- `name` 是**宿主入口** `lib/index.js` 的绝对路径，Windows 下用正斜杠最稳。
- 浏览器入口由插件的 `package.json` 里 `dsh.client` 声明，不需要写进 patch。

### 3. 重启 DSH

从托盘完全退出后重新打开（只关窗口通常只是隐藏到托盘）。宿主半是 Node 模块，热重载只替换浏览器半，**必须重启**才会 import 新的 `lib/index.js`。

展开左侧栏，底部账号行上方出现 `Aa` 即安装成功。

### 另一种安装方式：装进 profile

如果希望 DSH 直接管理这个依赖，也可以：

```powershell
dsh plugin --profile desktop add D:\repositories\personal-dsh-plugins\plugins\ui-scale
```

然后把 patch 里的 `name` 改成包名：

```yaml
- insert:
    - id: ui-scale
      name: 'dsh-ui-scale'
```

两种方式**只选一种**。同时写会加载两份，侧栏出现两个 `Aa`。

## 卸载

删掉 patch 里对应的 `insert` 块，重启 DSH。如果用过第二种方式，再执行：

```powershell
dsh plugin --profile desktop remove dsh-ui-scale
```

插件写出的偏好文件（例如 `~/.dsh/ui-scale.json`）不会自动删除，需要的话手动删。

## 目录结构

```
personal-dsh-plugins/
├── plugins/
│   └── ui-scale/              # 第一个插件：界面缩放
│       ├── lib/index.js       # 宿主半：Node ESM，注册 loopback 路由、读写偏好
│       ├── lib/client.js      # 浏览器半：侧栏 Aa 按钮、样式、缩放逻辑
│       ├── package.json       # dsh.client 清单 + npm 元数据
│       ├── README.md          # 中文说明
│       └── README.en.md       # English readme
├── scripts/check.mjs          # 仓库自检：清单字段、入口文件、JS 语法
├── .github/workflows/ci.yml   # push / PR 跑自检
└── README.md
```

## 新增一个插件

1. 复制 `plugins/ui-scale` 为 `plugins/<name>`，把 `package.json` 的 `name` 改成 `dsh-<name>`，并更新 `description`、`repository.directory`。
2. 宿主半 `lib/index.js`：Node ESM，导出 `name`、`inject`、`apply`。需要 HTTP 路由、文件、配置等能力时，从 `ctx` 取对应服务。
3. 浏览器半 `lib/client.js`：用 `window.__ModuleLoader__.load({ id, factory })` 注册；`package.json` 的 `dsh.client.inject` 列出依赖的客户端服务，并在 `inject` 里声明。
4. 在 profile 的 `cordis.patch.yml` 加一条 `insert`，指向新插件的 `lib/index.js`。
5. 更新本 README 的插件表，运行 `npm run check`。

需要构建的插件（TypeScript、打包器等）请把构建产物一并提交到 `lib/`，保证别人 clone 后无需构建即可用。

## 开发约定

- 一个插件一个目录；目录名等于包名去掉 `dsh-` 前缀。
- 不提交 `node_modules/`、日志、本机偏好文件。
- 浏览器半不要假设页面结构永远不变：优先用 `data-*` 钩子、插件 slot、公开的 CSS 变量，必要时再退回结构选择器。
- 宿主半涉及网络时只监听 loopback，并校验 `Host` 头。
- 新插件先在本机 profile 里跑通，再提交。

## 许可

[MIT](LICENSE)。插件内引用到的第三方代码或灵感来源会在对应插件的 README 里注明。
