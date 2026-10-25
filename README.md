# Koder TUI

An independent terminal workbench for Koder. Keep writing while an agent works, steer the current turn, order the next tasks, and follow a live checklist without losing the conversation.

**0.3.0 · Windows x64 · macOS Apple Silicon and Intel**  
[Download](https://github.com/KarmenLoop/koder-tui/releases/tag/tui-0.3.0) · [Website](https://karmenloop.com/tui.html) · [Installation and usage](docs/GETTING-STARTED.md) · [Release notes](RELEASE-NOTES.md)

## A workbench around the complete CLI

Koder TUI bundles the Koder CLI 0.4.12 runtime, its KARMEN LOOP engine, configuration, business modules, documentation, MCP and Skills support. It adds a persistent composer, an editable task queue, a session Todo panel, command search, and a configurable status line. The default profile and workspace rules are shared with the CLI.

- **Keep the composer open.** Type during streaming. Press Ctrl-S to steer the active turn; Esc or Ctrl-C interrupts it without closing the workbench.
- **Order upcoming work.** Alt-Q queues a draft. Ctrl-Q focuses the queue; Alt-Up/Down changes its order and Delete removes the selected item.
- **Follow session progress.** Ctrl-T expands or collapses Todo. The running task and queued prompts are separate. `/undo` restores conversation and Todo state, while retaining records of effects that already occurred.
- **See the essentials.** Configure mode, goal, model, tasks, cwd, git and tips through `/statusline`. An unconfigured model still has a slot; unknown context usage is shown as unknown.
- **Find commands.** `/help` contains 79 entries, including aliases and workbench commands. Ctrl-P searches 58 CLI routes. Use `koder-tui -- <CLI arguments>` for exact CLI access.
- **A quieter visual identity.** A transparent, animated refracting loop uses terminal shading. Reduced-motion preferences are supported.

Some CLI modules temporarily take over the terminal for their own interactive screens, then return to the workbench. External engines expose Todo and undo only when their adapters support them.

## Install

Download a platform archive from the release, extract it, and open `koder-tui.command` on macOS or `koder-tui.cmd` on Windows. Each archive includes Node.js; no npm install is needed.

For a persistent `koder-tui` command, use the matching installer from the release:

**macOS**
```bash
curl -fL https://github.com/KarmenLoop/koder-tui/releases/download/tui-0.3.0/koder-tui.sh -o koder-tui.sh
bash koder-tui.sh
```

**Windows PowerShell**
```powershell
Invoke-WebRequest -UseBasicParsing https://github.com/KarmenLoop/koder-tui/releases/download/tui-0.3.0/koder-tui.ps1 -OutFile koder-tui.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\koder-tui.ps1
```

Review the script and license before running it. The installer verifies the archive's SHA-256, installs under your user account, and leaves an existing `koder` command intact. Reopen your terminal after installation. On macOS, add `~/.local/bin` to PATH if it is not already there.

## First session

Run `koder-tui -- setup` to configure a model, or reuse an existing Koder profile. Then run `koder-tui -w /path/to/project`. Provider credentials and tool permissions remain under your control. Installing the workbench does not sign in to a service or approve an external action.

## Updates and compatibility

Re-run the current TUI installer to update the workbench. TUI and CLI have separate release versions. CLI `/update`, automatic-update settings and `/uninstall` retain their original CLI behavior and can act on an existing CLI installation; they do not manage the TUI archive. If an updated CLI lacks embedding API 2, the saved conversation continues in its native terminal. Restart `koder-tui` to reopen this bundled workbench. See the installation guide before removing either product.

This repository contains the workbench interface, installers, release checks and documentation. Full runtime distributions, including the bundled kernel and third-party files, are release assets. The interface is source-available under the included Koder license; it is not an open-source grant.

## License and support

Free for personal, noncommercial local use under [Koder-EULA-1.1](EULA.md). Commercial use, organizational deployment and changes to proprietary implementation require separate permission. Third-party licenses remain intact and ship in every archive.

[Third-party notices](THIRD_PARTY_NOTICES.md) · [Copyright notice](LEGAL-NOTICE.md) · [Report an issue](https://github.com/KarmenLoop/koder-tui/issues)
