# Koder TUI Implementation Plan

Goal: deliver an independent launchable TUI with every current CLI route and unchanged execution authority.
Architecture: reuse CLI runCli/chat/commands, adapt frontend input/output, and use the prior TUI terminal renderer.
Tech stack: Node 22.21+ or 24+, built-in node:test, no added dependencies.
Spec: ../specs/2026-10-25-koder-tui-design.md
Execution: Codex directly in this task; isolated snapshots only. No changes to release source or old TUI.

## Review focus

- A queued task must never be consumed as an approval.
- Shell symbols, quotes and Windows paths must remain literal arguments.
- Module changes, busy steering and cancellation must preserve CLI ownership.
- Secrets and ANSI sequences must not leak through frontend output or history.
- Closing or switching terminal modes must release listeners and restore modes.

## Tasks

- [x] Create baseline snapshots and SHA inventory; write route, prompt and terminal tests; run to observe missing-behavior failures.
- [x] Implement catalog/argv adapter with exact route coverage and UI command staging. Verify command completeness and literal arguments.
- [x] Implement frontend prompter preserving fresh approval, busy steering, queued tasks, protected-input suspension and close semantics. Run input tests.
- [x] Build full-screen workbench with modules, transcript, activity, editable input and CLI dispatcher backend. Verify fake-terminal navigation and command output.
- [x] Exercise actual CLI modules in disposable profiles, including settings/project/lesson180/migration help, and real macOS PTY mode restoration.
- [x] Review scope, source integrity and failure records; write launch guide and acceptance evidence, with external/platform NOT_RUN.

## Recorded outcome

Implementation and local candidate verification are complete. See ../../acceptance.md for exact checks, retained failures, and target-platform and external-service acceptance that remains NOT_RUN. The final architecture keeps the CLI chat alive during module dispatch; it does not restart the chat after each command.
