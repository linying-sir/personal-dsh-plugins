# dsh-electron-env

一个**只有宿主半**的小插件：只对 Open In 启动的 GUI Electron 应用清掉继承的 `ELECTRON_RUN_AS_NODE`，不影响 DSH 自己的 Node 子进程。

## 解决什么

DSH 的桌面宿主是用 `ELECTRON_RUN_AS_NODE=1` 启动 Electron 可执行文件的。这个变量必须保留给 DSH 自己的 **Node 模式子进程**（Windows 的 job runner 就是其中之一），但 GUI Electron 应用不能继承它：

- 从 **Open In / 用 VS Code 打开** 启动的 `Code.exe`、`Cursor.exe` 会以 Node 模式运行、立即退出；
- 表现是菜单里能看见 VS Code，点击后 DSH 报「打不开」；
- 但在 pwsh 里 `code` 完全正常，因为 pwsh 没有这个变量。

第一版插件图省事，直接在宿主进程里 `delete process.env.ELECTRON_RUN_AS_NODE`。VS Code 是能打开了，但 DSH 自己的 Node 子进程也被破坏，agent 的 shell 会报：

```text
subprocess-local: Windows Job runner exited with exit code 0
before proving its managed range empty
```

所以 0.1.1 改成**定向**处理：包装 `child_process.spawn`，只在命令是 `Code.exe` / `Code - Insiders.exe` / `Cursor.exe` / `Windsurf.exe` 时，从子进程环境里删掉这个变量。

```js
childProcess.spawn = function spawnWithGuiEnvironment(command, args, options) {
  if (isGuiElectron(command)) {
    const env = { ...(options?.env ?? process.env) };
    delete env.ELECTRON_RUN_AS_NODE;
    options = { ...(options ?? {}), env };
  }
  return nativeSpawn.call(this, command, args, options);
};
```

然后调用 `syncBuiltinESMExports()`，让已经 `import { spawn }` 的 Open In 模块也拿到包装后的版本。

## 为什么 DSH 会这样设计

Open In 的宿主半使用 `scrubbedParentEnv()`：它清掉凭据、`DSH_*`、代理等敏感变量，再把环境传给启动的应用。这个“清理后启动”的设计是对的；问题在于 `ELECTRON_RUN_AS_NODE` 不是凭据，而是 DSH 桌面宿主自己的 Node 启动开关。它被保留给 DSH 自己的子进程是合理的，但不该传给 GUI Electron 应用。当前版本没有把这两类子进程分开，所以需要这个定向补丁。

`ELECTRON_RUN_AS_NODE` 只在启动宿主时有用；但**不能全局删除**，否则 DSH 的 job runner 这类内部 Node 子进程也会失效。

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
3. 应该直接打开 VS Code，不再需要点几次，也不报打不开；
4. 同时 agent 的 shell / job runner 应恢复正常。

如果仍失败，检查 `%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe` 是否存在，并确认 Open In 的启动命令确实是 `Code.exe`。
