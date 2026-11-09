# dsh-electron-env

一个**只有宿主半**的小插件：在 DSH 桌面宿主启动后删除继承的 `ELECTRON_RUN_AS_NODE` 环境变量。

## 解决什么

DSH 的桌面宿主是用 `ELECTRON_RUN_AS_NODE=1` 启动 Electron 可执行文件的。宿主把环境变量清理后传给子进程时，没有去掉这个选择变量，于是从 **Open In / 用 VS Code 打开** 启动的 `Code.exe`、`Cursor.exe` 等 Electron GUI 应用会以 Node 模式运行、立即退出。表现就是：

- 菜单里能看见 VS Code；
- 点击后 DSH 报「打不开」；
- 但在 pwsh 里 `code` 完全正常。

本插件在宿主启动时执行：

```js
delete process.env.ELECTRON_RUN_AS_NODE;
```

之后所有子进程（包括 Open In 启动的 GUI 应用）都不会再继承它。`ELECTRON_RUN_AS_NODE` 只在启动宿主时有用，宿主已经在运行后删除它是安全的。

## 安装

和其他本地插件一样按绝对路径挂在 profile 的 patch 里：

```yaml
- insert:
    - id: electron-env
      name: 'D:/repositories/personal-dsh-plugins/plugins/electron-env/lib/index.js'
```

它是宿主插件，不需要浏览器半，也没有客户端 bundle。改完需要**重启 DSH** 才能重新加载宿主插件。

## 验证

1. 重启 DSH；
2. 右上角「用文件资源管理器打开」→ 下拉选 VS Code；
3. 应该直接打开 VS Code，不再需要点几次，也不报打不开。

如果仍失败，检查 `%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe` 是否存在，并确认 DSH 是从哪个宿主进程启动的。
