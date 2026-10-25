# Koder TUI 0.3.1 verification

Version 0.3.1 is published on [GitHub](https://github.com/KarmenLoop/koder-tui/releases/tag/tui-0.3.1) and the [official website](https://karmenloop.com/tui.html). The archives include Koder CLI 0.4.12 and Node.js 22.23.3.

All 43 private workbench regression tests and seven real macOS PTY interaction checks passed before packaging. They cover persistent input, queue ordering, Todo/undo, steering, first-character recovery from queue focus, Unicode paste and input during streaming.

A local fixture with 156,000 characters of history and a 200 KB configuration reduced P95 key-to-render time from 32.7 ms to 3.6 ms across 45 samples. Per-key synchronous configuration reads fell to zero. These are local fixture measurements, not guarantees for every terminal or input method.

The [three-platform package run](https://github.com/KarmenLoop/koder-tui/actions/runs/40227541377) passed on Windows x64, macOS arm64 and macOS x64. Each job checked the archive hash, bundled runtime, all 58 CLI routes, queue-focus typing, Unicode paste, input during streaming and isolated installation in a path containing spaces and Unicode characters. The [public Windows installer run](https://github.com/KarmenLoop/koder-tui/actions/runs/40228059307) also passed: Windows PowerShell downloaded the CMD bootstrap from the official site, installed the public package and verified the installed version.

All ten files listed in SHA256SUMS were downloaded from the official website and matched their expected SHA-256 values and GitHub asset digests. The checksum file matched byte for byte. Production file hashes match the scoped deployment, and the existing CLI download manifest and server functions remain unchanged.

User-device Windows and macOS terminal/IME acceptance, live providers and external ACP, account writes and cross-device migration remain NOT_RUN. The archives are terminal distributions with bundled Node.js, not signed or notarized desktop applications. Hosted input tests do not replace tests of a user's input method or physical display.

New development source and private tests remain outside the public branch. Downloads include the runtime files needed to run the product under Koder-EULA-1.1 and applicable third-party licenses; they are not opaque binaries.

See [the machine-readable record](../release-validation.json) for package hashes and [the preserved 0.3.0 record](releases/tui-0.3.0-validation.json) for earlier checks and failures.
