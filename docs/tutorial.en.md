# Koder TUI tutorial (English)

[English](tutorial.en.md) · [中文](tutorial.zh-CN.md) · Product: **TUI 0.3.1** · Bundled CLI: **0.4.12**

This walkthrough takes you from prerequisites to a first useful session, then covers update, rollback, and removal. Keyboard detail and edge cases also live in [GETTING-STARTED.md](GETTING-STARTED.md). Release evidence: [RELEASE-VALIDATION.md](RELEASE-VALIDATION.md).

---

## 1. Prerequisites

| Need | Detail |
|---|---|
| OS | Windows 10/11 **x64**, or macOS on **Apple Silicon** or **Intel** |
| Terminal | Windows Terminal, macOS Terminal, or another modern terminal that can run a Node CLI |
| Network | To download the release once; day-to-day model calls use **your** provider |
| Account | **None** from KarmenLoop — bring your own model API key or supported local endpoint |
| Disk | Roughly the size of the platform archive (~170 MB compressed) plus extract space |
| License | Read [EULA.md](../EULA.md) (Koder-EULA-1.1) before installing |

**Not required:** a separate Koder CLI install, system Node.js, npm, membership, or invite code.

**Not in this release:** Linux bundles, Windows ARM64 native builds, MSI/EXE/PKG/DMG, signed or notarized desktop apps.

---

## 2. Choose a package

| Computer | Archive |
| --- | --- |
| Windows 10/11 x64 | `koder-tui-0.3.1-windows-x64.zip` |
| Mac with Apple Silicon | `koder-tui-0.3.1-macos-arm64.tar.gz` |
| Mac with Intel processor | `koder-tui-0.3.1-macos-x64.tar.gz` |

Open the [tui-0.3.1 release](https://github.com/KarmenLoop/koder-tui/releases/tag/tui-0.3.1). Prefer the GitHub asset or the matching file on [karmenloop.com/tui.html](https://karmenloop.com/tui.html). Download [SHA256SUMS](https://github.com/KarmenLoop/koder-tui/releases/download/tui-0.3.1/SHA256SUMS) with the archive.

Verify:

```bash
# macOS
shasum -a 256 koder-tui-0.3.1-macos-arm64.tar.gz
```

```powershell
# Windows PowerShell
Get-FileHash .\koder-tui-0.3.1-windows-x64.zip -Algorithm SHA256
```

Compare the digest to SHA256SUMS. Inspect the publisher before running downloaded code; do not disable system protection globally.

---

## 3. Install

### Option A — Portable (no PATH change)

1. Extract the archive.
2. macOS: open `koder-tui.command` in the extracted folder.  
   Windows: open `koder-tui.cmd`.
3. Each archive includes Node.js **22.23.3**; no `npm install` is needed.

### Option B — Persistent `koder-tui` command

**macOS**

```bash
curl -fL https://github.com/KarmenLoop/koder-tui/releases/download/tui-0.3.1/koder-tui.sh -o koder-tui.sh
# Review the script and EULA, then:
bash koder-tui.sh
```

Installs under `~/.koder-tui/versions` and links `~/.local/bin/koder-tui`. Add `~/.local/bin` to PATH if needed. Reopen the terminal.

**Windows**

Prefer downloading [koder-tui.cmd](https://karmenloop.com/install/tui-0.3.1/koder-tui.cmd) in your browser and opening it. Or, with TLS 1.2 enabled:

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

Installs under `%LOCALAPPDATA%\koder-tui` and adds its `bin` directory to the **user** PATH. An existing `koder` command is left intact. Reopen the terminal.

The installer verifies SHA-256 and asks you to accept the EULA. Unattended install is only for after you have read and accepted the terms: `KODER_TUI_EULA_ACCEPT=1`.

---

## 4. First task

1. **Confirm versions**

   ```bash
   koder-tui --version
   ```

   Expect **TUI 0.3.1** and **CLI 0.4.12**.

2. **Configure a model** (or reuse an existing Koder profile)

   ```bash
   koder-tui -- setup
   ```

   Same provider/engine flow as Koder CLI. No model account ships in the archive.

3. **Open a project workspace**

   ```bash
   koder-tui -w "/path/to/project"
   ```

   On Windows, quote paths with spaces, e.g. `koder-tui -w "C:\Users\Name\Projects\My Project"`.

4. **Ask for something concrete** — for example: summarize the repository layout, propose a small safe edit, or list open TODOs in the tree. Review any permission prompt before approving a tool.

5. **Discover the workbench**

   | Action | How |
   |---|---|
   | Help | `/help` (79 entries) |
   | CLI routes | **Ctrl-P** (58 routes) or `koder-tui -- help` |
   | Steer active turn | **Ctrl-S** (draft must be ready) |
   | Interrupt without exit | **Esc** / **Ctrl-C** |
   | Queue draft | **Alt-Q** |
   | Focus / reorder queue | **Ctrl-Q**, **Alt-Up/Down**, **Delete** |
   | Todo panel | **Ctrl-T** |
   | Status line | `/statusline` |
   | Undo conversation/Todo metadata | `/undo` |

6. **Optional profile isolation** — set `KODER_CLI_HOME` to another directory before launch. Do not point an untrusted project at a credential directory.

Installing the workbench does not sign in to a service or approve an external action. Credentials and tool permissions stay under your control.

---

## 5. Troubleshooting

| Symptom | What to try |
|---|---|
| `koder-tui` not found after install | Reopen the terminal. On macOS, ensure `~/.local/bin` is on PATH. On Windows, confirm the user PATH includes the TUI `bin` folder. |
| PowerShell “connection closed” / missing installer file | Do **not** run `-File` on a failed download. Use the [browser CMD installer](https://karmenloop.com/install/tui-0.3.1/koder-tui.cmd), or the TLS 1.2 snippet above. Do not disable certificate validation. |
| Ctrl-S does nothing / freezes output | Terminal may own software flow control: `stty -ixon`, or use slash commands. |
| Alt/Option shortcuts fail | Configure the terminal so Option/Alt reaches the app. |
| Startup failure | Capture `koder-tui --version`, OS and terminal names, and the error text. Run `koder-tui -- doctor` for CLI diagnostics. Strip credentials and private project content before filing a [GitHub issue](https://github.com/KarmenLoop/koder-tui/issues). |
| Input dropped after queue focus | Fixed in **0.3.1** for the tested paths; if it still happens, report terminal, OS, IME, and whether a task was streaming. |
| Todo / undo missing with an external engine | Adapters must opt in; the engine’s own UI remains available. |
| `/undo` did not reverse a file write | Expected — undo restores conversation/Todo metadata only. |

Full keyboard table and Windows download notes: [GETTING-STARTED.md](GETTING-STARTED.md).

---

## 6. Update

Re-run the **current** TUI installer (`koder-tui.sh` / `koder-tui.ps1` / `koder-tui.cmd` for **0.3.1** or newer). It switches the launcher to a new version directory and keeps previous version folders.

**TUI and CLI version independently.** CLI `/update`, auto-update settings, and `/uninstall` manage the **CLI** installation, not this TUI archive. If a newer CLI lacks embedding API 2, the saved conversation may continue in the native CLI UI; restart `koder-tui` to use the bundled workbench again.

For predictable portable sessions, you may set `KODER_AUTO_UPDATE=0` for that process; saved settings are unchanged.

---

## 7. Rollback and removal

### Rollback (installed copy)

Each install keeps version directories. Run the previous version’s launcher under:

- macOS: `~/.koder-tui/versions/…`
- Windows: `%LOCALAPPDATA%\koder-tui\versions\…`

### Remove portable

Close the workbench and delete the extracted folder.

### Remove installed

1. Close all TUI sessions.
2. macOS: delete `~/.local/bin/koder-tui` and `~/.koder-tui`.
3. Windows: delete `%LOCALAPPDATA%\koder-tui` and remove its `bin` entry from the user PATH.

Keep the separate Koder CLI profile if you want settings and conversations. **Do not** use `/uninstall --purge` to remove only the TUI.

---

## 8. What this tutorial does not claim

Hosted package and installer checks passed for the published platforms; they do **not** replace user-device IME, live provider, external ACP, account-write, migration, or accessibility acceptance. Those remain **NOT_RUN** unless [RELEASE-VALIDATION.md](RELEASE-VALIDATION.md) says otherwise. Local P95 typing measurements in the release notes describe a fixture, not every terminal.

---

## Next reading

- [README.md](../README.md) · [README.zh-CN.md](../README.zh-CN.md)
- [GETTING-STARTED.md](GETTING-STARTED.md) — keyboard map and Windows download errors
- [RELEASE-NOTES.md](../RELEASE-NOTES.md) · [SOURCE-STATUS.md](../SOURCE-STATUS.md) · [EULA.md](../EULA.md)
- Sibling product: [Koder CLI](https://github.com/KarmenLoop/koder-cli)
