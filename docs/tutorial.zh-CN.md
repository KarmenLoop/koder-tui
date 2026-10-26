# Koder TUI 教程（简体中文）

[English](tutorial.en.md) · [中文](tutorial.zh-CN.md) · 产品：**TUI 0.3.1** · 捆绑 CLI：**0.4.12**

本教程从前置条件走到第一次有用的会话，再覆盖更新、回滚与卸载。快捷键与边界情况另见 [GETTING-STARTED.md](GETTING-STARTED.md)。发行证据见 [RELEASE-VALIDATION.md](RELEASE-VALIDATION.md)。

---

## 1. 前置条件

| 需要 | 说明 |
|---|---|
| 系统 | Windows 10/11 **x64**，或 macOS **Apple Silicon** / **Intel** |
| 终端 | Windows Terminal、macOS 终端，或其他能跑 Node CLI 的现代终端 |
| 网络 | 至少下载一次发行包；日常模型调用走**你自己的**提供商 |
| 账号 | KarmenLoop **不提供**账号——自备模型 API 密钥或受支持的本地端点 |
| 磁盘 | 约等于平台压缩包体积（压缩后约 170 MB）再加解压空间 |
| 许可 | 安装前阅读 [EULA.md](../EULA.md)（Koder-EULA-1.1） |

**不需要：** 另装 Koder CLI、系统 Node.js、npm、会员或邀请码。

**本发行未提供：** Linux 包、Windows ARM64 原生构建、MSI/EXE/PKG/DMG、已签名或公证的桌面应用。

---

## 2. 选择压缩包

| 电脑 | 压缩包 |
| --- | --- |
| Windows 10/11 x64 | `koder-tui-0.3.1-windows-x64.zip` |
| Apple Silicon Mac | `koder-tui-0.3.1-macos-arm64.tar.gz` |
| Intel Mac | `koder-tui-0.3.1-macos-x64.tar.gz` |

打开 [tui-0.3.1 发行页](https://github.com/KarmenLoop/koder-tui/releases/tag/tui-0.3.1)。优先使用 GitHub 资产或 [karmenloop.com/tui.html](https://karmenloop.com/tui.html) 上的对应文件。同时下载 [SHA256SUMS](https://github.com/KarmenLoop/koder-tui/releases/download/tui-0.3.1/SHA256SUMS)。

校验：

```bash
# macOS
shasum -a 256 koder-tui-0.3.1-macos-arm64.tar.gz
```

```powershell
# Windows PowerShell
Get-FileHash .\koder-tui-0.3.1-windows-x64.zip -Algorithm SHA256
```

将摘要与 SHA256SUMS 对照。运行下载代码前请确认发布方；不要全局关闭系统防护。

---

## 3. 安装

### 方式 A — 便携（不改 PATH）

1. 解压压缩包。
2. macOS：在解压目录打开 `koder-tui.command`。  
   Windows：打开 `koder-tui.cmd`。
3. 每个压缩包已含 Node.js **22.23.3**，无需 `npm install`。

### 方式 B — 持久 `koder-tui` 命令

**macOS**

```bash
curl -fL https://github.com/KarmenLoop/koder-tui/releases/download/tui-0.3.1/koder-tui.sh -o koder-tui.sh
# 审阅脚本与 EULA 后：
bash koder-tui.sh
```

安装到 `~/.koder-tui/versions`，并链接 `~/.local/bin/koder-tui`。如需请将 `~/.local/bin` 加入 PATH。重新打开终端。

**Windows**

建议在浏览器下载 [koder-tui.cmd](https://karmenloop.com/install/tui-0.3.1/koder-tui.cmd) 并打开。或在启用 TLS 1.2 后执行：

```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$installer = Join-Path $env:TEMP ('koder-tui-' + [guid]::NewGuid().ToString('N') + '.ps1')
try {
  Invoke-WebRequest -UseBasicParsing https://karmenloop.com/install/tui-0.3.1/koder-tui.ps1 -OutFile $installer -ErrorAction Stop
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installer
} catch {
  Write-Error 'Download failed. Open the Windows installer link in your browser.'
}
```

安装到 `%LOCALAPPDATA%\koder-tui`，并将其 `bin` 目录加入**用户** PATH。已有的 `koder` 命令保持不动。重新打开终端。

安装器校验 SHA-256，并要求接受 EULA。无人值守安装仅适用于你已阅读并接受条款之后：`KODER_TUI_EULA_ACCEPT=1`。

---

## 4. 第一个任务

1. **确认版本**

   ```bash
   koder-tui --version
   ```

   应看到 **TUI 0.3.1** 与 **CLI 0.4.12**。

2. **配置模型**（或复用已有 Koder 配置档）

   ```bash
   koder-tui -- setup
   ```

   与 Koder CLI 同一套提供商 / 引擎流程。压缩包不附带模型账号。

3. **打开项目工作区**

   ```bash
   koder-tui -w "/path/to/project"
   ```

   Windows 路径含空格时请加引号，例如：`koder-tui -w "C:\Users\Name\Projects\My Project"`。

4. **提出一个具体请求**——例如：概括仓库结构、提议一处小而安全的改动，或列出树中待办。批准任何工具前先审阅权限提示。

5. **熟悉工作台**

   | 动作 | 方式 |
   |---|---|
   | 帮助 | `/help`（79 条） |
   | CLI 路由 | **Ctrl-P**（58 条）或 `koder-tui -- help` |
   | 纠偏当前回合 | **Ctrl-S**（草稿需就绪） |
   | 中断但不退出 | **Esc** / **Ctrl-C** |
   | 加入队列 | **Alt-Q** |
   | 聚焦 / 重排队列 | **Ctrl-Q**、**Alt-Up/Down**、**Delete** |
   | Todo 面板 | **Ctrl-T** |
   | 状态栏 | `/statusline` |
   | 撤销对话 / Todo 元数据 | `/undo` |

6. **可选：隔离配置档** — 启动前将 `KODER_CLI_HOME` 指到其他目录。不要把不信任的项目指向凭证目录。

安装工作台不会登录任何服务，也不会替你批准外部动作。凭证与工具权限仍由你控制。

---

## 5. 故障排查

| 现象 | 可尝试 |
|---|---|
| 安装后找不到 `koder-tui` | 重新打开终端。macOS 确认 `~/.local/bin` 在 PATH 中。Windows 确认用户 PATH 含 TUI 的 `bin`。 |
| PowerShell「连接已关闭」/ 安装文件不存在 | **不要**对失败下载执行 `-File`。改用[浏览器 CMD 安装器](https://karmenloop.com/install/tui-0.3.1/koder-tui.cmd)，或上文 TLS 1.2 片段。不要关闭证书校验。 |
| Ctrl-S 无效 / 输出卡住 | 终端可能占用软件流控：`stty -ixon`，或改用斜杠命令。 |
| Alt/Option 快捷键失效 | 在终端设置中让 Option/Alt 传到应用。 |
| 启动失败 | 记录 `koder-tui --version`、系统与终端名称、错误原文。可用 `koder-tui -- doctor` 做 CLI 诊断。提交 [GitHub issue](https://github.com/KarmenLoop/koder-tui/issues) 前去掉凭证与私有项目内容。 |
| 队列聚焦后丢输入 | **0.3.1** 已修复已测路径；若仍出现，请报告终端、系统、输入法，以及当时是否在流式输出。 |
| 外部引擎没有 Todo / undo | 适配器需显式支持；引擎原有界面仍可用。 |
| `/undo` 没有回滚文件写入 | 预期行为——undo 只恢复对话 / Todo 元数据。 |

完整快捷键与 Windows 下载说明见 [GETTING-STARTED.md](GETTING-STARTED.md)。

---

## 6. 更新

重新运行**当前** TUI 安装器（**0.3.1** 或更新的 `koder-tui.sh` / `koder-tui.ps1` / `koder-tui.cmd`）。安装器把启动器切到新版本目录，并保留旧版本文件夹。

**TUI 与 CLI 版本线独立。** CLI 的 `/update`、自动更新与 `/uninstall` 管理的是 **CLI** 安装，不是本 TUI 压缩包。若更新后的 CLI 缺少 embedding API 2，已保存对话可能在原生 CLI 界面继续；重新启动 `koder-tui` 可再次使用捆绑工作台。

便携场景若需可预期行为，可为该进程设 `KODER_AUTO_UPDATE=0`；已保存设置不变。

---

## 7. 回滚与卸载

### 回滚（安装版）

每次安装保留版本目录。在下列位置运行旧版本启动器：

- macOS：`~/.koder-tui/versions/…`
- Windows：`%LOCALAPPDATA%\koder-tui\versions\…`

### 删除便携版

关闭工作台后删除解压目录。

### 删除安装版

1. 关闭全部 TUI 会话。
2. macOS：删除 `~/.local/bin/koder-tui` 与 `~/.koder-tui`。
3. Windows：删除 `%LOCALAPPDATA%\koder-tui`，并从用户 PATH 去掉其 `bin` 项。

若要保留设置与会话，请保留独立的 Koder CLI 配置档。**不要**用 `/uninstall --purge` 只卸 TUI。

---

## 8. 本教程不宣称什么

已发布平台的托管打包与安装检查已通过；它们**不能**替代用户设备上的 IME、真实提供商、外部 ACP、账号写入、迁移或无障碍验收。除非 [RELEASE-VALIDATION.md](RELEASE-VALIDATION.md) 另有说明，这些仍为 **NOT_RUN**。发行说明中的本地 P95 打字测量描述的是夹具，不是每台终端。

---

## 接着读

- [README.md](../README.md) · [README.zh-CN.md](../README.zh-CN.md)
- [GETTING-STARTED.md](GETTING-STARTED.md) — 快捷键与 Windows 下载故障
- [RELEASE-NOTES.md](../RELEASE-NOTES.md) · [SOURCE-STATUS.md](../SOURCE-STATUS.md) · [EULA.md](../EULA.md)
- 姊妹产品：[Koder CLI](https://github.com/KarmenLoop/koder-cli)
