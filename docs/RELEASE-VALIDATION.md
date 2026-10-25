# Release verification

Koder TUI 0.3.0 ships with Koder CLI 0.4.12 and Node.js 22.23.3.

The [Windows, Apple Silicon and Intel package checks](https://github.com/KarmenLoop/koder-tui/actions/runs/40214861097) passed archive integrity, extraction, 58 CLI routes, 39 named workbench tests, isolated installation into a path containing Unicode and spaces, and installed-launcher checks.

The [public Windows installation check](https://github.com/KarmenLoop/koder-tui/actions/runs/40215581720) downloaded the CMD bootstrap from the official website, ran the published installer, verified the archive, installed it, and launched the installed command. The bootstrap enables TLS 1.2 and prefers Windows PowerShell downloads, with curl and a second download source available as fallbacks. It stops if no source succeeds.

All three public platform archives and the installation files were downloaded and matched their SHA-256 checksums. Both language pages, existing CLI metadata and the download statistics service were checked after publication.

Before packaging, 40 Node test entries (39 named workbench tests plus one helper-file entry), 127 targeted CLI tests, 10 real macOS PTY interaction checks and six supervised-launcher checks passed. Those PTY checks used local fixtures and did not call a live model or account.

The focused website checks passed 39 tests, with one skipped. The full website suite has four remaining assertions that also failed against the production baseline, covering legacy download counts, link restrictions and copy assumptions. It is not a fully passing site-wide suite.

Hosted Windows checks do not establish user-device ConPTY/IME, Windows-MCP GUI, live provider/ACP, account-write, accessibility or migration acceptance. These remain NOT_RUN. The release contains terminal archives and installation scripts, not signed desktop applications.

The [machine-readable record](../release-validation.json) preserves package hashes, tested commits, prior failed runs, and the remaining limits.
