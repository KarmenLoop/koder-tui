# Koder TUI independent workbench

Date: 2026-10-25, Asia/Shanghai. User decision: independent terminal workbench; every existing CLI function, configuration, business module and engine is mandatory. The user confirmed the independent-workbench route and instructed implementation. This document records the reversible implementation choices.

## Product

Koder TUI adds a full-screen workspace around the current CLI, retaining its command semantics. A searchable module directory exposes every registered command, its description, usage and editable arguments. Conversation, command output, input, execution state and module discovery share one terminal workspace. Chinese and English, keyboard navigation, multiline input, bracketed paste, scrolling, resizing, dark/light terminal readability and terminal restoration are required. The CLI remains available for scripts and pipes.

## Approaches

1. Expand CLI readline menus: least change, but limited parallel context and workspace navigation.
2. Independent terminal workbench reusing the complete CLI: selected by the user. Reuse terminal rendering primitives from the earlier TUI and the actual current CLI dispatcher/chat/command modules.
3. Fork the agent engine: rejected because permissions, memory, tools and future features would diverge.

## Source baseline

The source under CK-20261025-cli-release-0.4.12/work/source/koder-cli registers 58 routes and 49 unique command modules. The 2026-10-17 standalone TUI directly calls older openAgent/openThread/runPrompt and has 13 slash entries. It lacks current command coverage and cannot be the business authority. Public release: https://github.com/KarmenLoop/koder-cli/releases/tag/cli-0.4.12 .

## Architecture

The frontend owns rendering, keyboard/focus, drafts, module selection and transient output. The pinned CLI owns commands, chat, createSession, engine choice, provider configuration, permissions, persistent memory, projects, tools, receipts, automatic-update decisions and business rules. Four CLI files add optional embedding and supervisor hooks; the published baseline is unchanged. Use runCli(argv, io) with a frontend prompter, bounded text output, explicit cwd/env, normal CLI flags and no custom decider. This preserves CLI permission enforcement, including explicit deny and separate computer/learning/message grants. Never call the old TUI engine adapter.

CLI input adapter: ask(prompt, {fresh}), enqueue, prefill, snapshot/freeze, setBusy, interrupt/wake, close, withInputSuspended. Ordinary conversation reads the draft/queue. Fresh approval prompts require new input after the prompt; pretyped commands never count as approval. Busy input uses CLI setBusy.submit to preserve steering, interruption and queuing semantics. All errors and uncertain receipts retain the CLI result.

Module commands run through the live chat's own dispatcher without restarting that chat. This retains mode, project, session, preview ownership and other runtime settings. An optional dispatchLocal hook records the module and exit code. Commands that require exclusive native streams temporarily own the same terminal in the same process; workbench rendering/input is suspended and restored in finally. During this native-console handoff, the original CLI screen occupies the terminal and the workbench composer is temporarily hidden. The handoff modules are setup, onboard, prompts, netlify, celebrate, gateway, connect, acp, update, uninstall and migrate.

The CLI supervisor and worker retain restart ownership. A compatible replacement runtime resumes in the workbench. A replacement without embedding API version 1 resumes in its native CLI, carrying the saved continuation rather than pretending the frontend is compatible. The module catalog is pinned to the bundled 0.4.12 dispatcher.

## Function coverage

The directory comes from CLI help metadata and is mechanically compared with actual LOADERS routes. Include routes omitted from help metadata with a fallback label. Preserve aliases, globals, subcommands and advanced arguments via an editable command line; never send a recognized local command to the model. `koder-tui -- <CLI arguments>` preserves pipes, JSON/protocol commands and ordinary CLI exit codes. Each routed capability must be listed in the inventory with its actual local or NOT_RUN evidence.

Required families: chat/run/ask and seven modes; review/fix/test/scan/flow/ci; engine/harness/MoA/provider; projects and sessions; memory/account/growth/prompt templates; Skills/apps/MCP/REA/reverse; gateway/connect/mail; GitHub/Netlify/preview/visuals; permissions/setup/onboarding; activate/deactivate/status/agentd; encrypted migration; update/uninstall/logs/doctor; help/learn with 180 Chinese and 30 English lessons; language/theme/banner/about/privacy/EULA/feedback/resources/business/star/celebrate.

## Interaction

Open Modules with Ctrl+P or /modules. Search by Chinese/English name or description, use arrows to select, Tab/Enter to stage editable argv, Esc to return to the saved draft. Exact CLI slash commands execute locally. Plain tasks go to current CLI chat. While busy, inputs follow the original CLI steering contract. Fresh questions have a separate highlighted prompt and cannot consume queued task text. Ctrl+C cancels running work or closes a prompt; empty idle Ctrl+C twice exits. Opening a panel never cancels execution. Native handoff pauses frontend input/output and restores raw/alternate-screen/cursor/paste state in finally.

Only frontend-owned output is rendered. Strip terminal escape/control sequences from untrusted output. Bound output retained in UI; durable history and receipts remain with the CLI. Secret answers are not added to frontend task history or transcript. Embedded secret questions use a masked answer line; native modules use the original protected input reader with exclusive terminal ownership. As in the CLI, users should supply credentials through protected prompts, not through ordinary task text or command arguments.

## Compatibility and delivery

Use Node 22.21+ or 24+ and the existing built-in terminal renderer; no added runtime dependencies. Ship independent koder-tui source with a pinned CLI 0.4.12 snapshot and matching bundled kernel, retaining licenses/notices. Show TUI version and CLI runtime version separately. No arbitrary system process is killed. Final verification uses isolated synthetic profiles. No new ledger, scheduler, provider or account authority.

## Acceptance

Local tests must establish: every route discoverable; shell metacharacters stay literal argv; tasks versus local commands are distinct; queued text cannot approve; busy steering retained; selection preserves drafts; real CLI project/settings/help/lesson180/migration help work; original permission-deny behavior remains; terminal handoff and exit restore input ownership; source baseline unchanged. Test fake-terminal UI and real macOS PTY separately.

Native Windows ConPTY/IME, real provider/model, GitHub/email/Netlify writes, MCP GUI, server SSH migration and production publication remain NOT_RUN until separately exercised under their existing authorization. Availability of a command does not establish that external integration works. The historic four tutorial workflow failures and previous CLI platform limits remain. Do not claim full product acceptance from route coverage or UI snapshots.

## Design references

2026-10-25: lazygit official repository (https://github.com/jesseduffield/lazygit), read documentation only, for visible key hints and command discovery; Apple Feedback (https://developer.apple.com/design/human-interface-guidelines/feedback), accessible documentation only, for state and outcome feedback. No third-party implementation copied or installed.
