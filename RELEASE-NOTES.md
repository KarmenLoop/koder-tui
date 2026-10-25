# Koder TUI 0.3.1

This update fixes dropped input after queue navigation and reduces typing latency during streamed output. Windows x64, Apple Silicon Mac and Intel Mac archives include Koder CLI 0.4.12 and Node.js 22.23.3.

- Typing or pasting from queue navigation returns to the composer and preserves the first character.
- Keyboard input takes priority over background repainting. Configuration reads no longer block each key.
- Completed Markdown lines are reused during streaming. Slow terminal output keeps the newest pending frame instead of accumulating outdated frames.
- The decorative refracting loop and its animation refreshes have been removed. Conversation output uses the recovered space.
- Persistent input, queued task ordering, Todo, steering, interruptions, status settings and all 58 CLI routes remain available.

Before packaging, 43 private regression tests and seven real macOS PTY interaction checks passed. In a local fixture with 156,000 characters of streamed history and a 200 KB configuration, the P95 key-to-render time fell from 32.7 ms to 3.6 ms across 45 samples. This measures the local test environment; it is not a claim about every terminal or input method.

Re-run the current installer to update. Existing profiles and the separate koder command are preserved. See [release verification](docs/RELEASE-VALIDATION.md) for platform checks and remaining device tests.

The same Koder-EULA-1.1 agreement applies. This repository publishes downloads, documentation, installers and release verification; proprietary development source and private test suites are maintained outside the public branch. Runtime archives include the files needed to run the product under the applicable licenses.
