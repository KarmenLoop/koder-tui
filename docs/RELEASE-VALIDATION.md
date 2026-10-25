# Koder TUI 0.3.1 verification

All 43 private workbench regression tests and seven real macOS PTY interaction checks passed before packaging. They cover persistent input, queue ordering, Todo/undo, steering, first-character recovery from queue focus, Unicode paste and input during streaming.

A local fixture with 156,000 characters of history and a 200 KB configuration reduced P95 key-to-render time from 32.7 ms to 3.6 ms across 45 samples. Per-key synchronous configuration reads fell to zero. These are local fixture measurements, not guarantees for every terminal or input method.

The three platform archives have been built. Hosted installation and public download checks are pending; this record will be updated after those runs complete.

User-device Windows ConPTY/IME, live providers and external ACP, account writes and cross-device migration remain NOT_RUN. The archives are terminal distributions with bundled Node.js, not signed desktop applications.

See [the current machine-readable record](../release-validation.json) for package hashes, and [the preserved 0.3.0 record](releases/tui-0.3.0-validation.json) for earlier checks and failures.
