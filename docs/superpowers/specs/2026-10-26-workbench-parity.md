# Workbench interaction parity

The user requests these additions to the existing approved independent TUI: a collapsible current-session Todo with Ctrl+T and undo support; a persistent composer with Ctrl+S steering and non-exiting Escape/Ctrl+C interruption; configurable mode/goal/model/tasks/cwd/git/tips status fields, a visible unconfigured model slot, rotating tips and context percentage; a searchable /help panel covering every real slash command; continued reuse of all CLI capabilities.

## Implementation

Keep the approved workbench layout and transparent animated loop. The right queue continues to mean later tasks. Current-session Todo is a separate compact strip above the composer, expanded by Ctrl+T; long expanded lists scroll without hiding the composer. Move the previous activity shortcut to Ctrl+O and retain /activity.

Use the bundled CLI session as the authority for Todo and undo. The other CLI session-dock task is still active, so implement these additions against the fixed 0.4.12 baseline in this isolated candidate; do not consume its unfinished source. The metadata shape is compatible with its inspected public adapter contract. Do not synthesize progress from assistant prose or queue length. Keep completed, pending, in-progress and cancelled states distinct. Undo restores prior conversation/Todo state through the session API; retained tool/effect receipts must not be erased or replayed. External effects are not undone by editing the displayed checklist.

Ctrl+S explicitly requests steering even when normal Enter is configured to queue. It reports confirmed acceptance, rejection or unknown receipt separately. A rejected request remains editable; an uncertain receipt is not automatically replayed. Fresh questions are never answered by steering or queued task text. Escape/Ctrl+C cancel current work and keep the workbench open; /exit and Ctrl+D are explicit exit actions.

Read status fields from actual CLI context/session events. Configuration is stored in the normal CLI profile under tui.statusLine and merged without discarding unrelated settings. Model defaults to not set when absent. Unknown context usage is shown as unknown, never 0 by inference. Git is an optional bounded local read cached per workspace. Tips rotate independently of the animation's reduced-motion preference.

Keep the 58 CLI module routes as one catalog; build a separate slash catalog from actual chat shortcuts, registered routes and implemented workbench commands. Report its measured count instead of manufacturing 70 entries. Help selection stages an editable command and never executes it.

The CLI session-dock source is currently active in another task. Read-only inspection informs the adapter contract; any consumed snapshot must record source hashes, retain upstream failures, and pass this candidate's integration tests. Do not change that task's files.

## Acceptance

Tests must demonstrate actual Todo events during a synthetic provider turn, undo and reload, Ctrl+S consumption by the same active turn, draft persistence while streaming, repeated interruption without app exit, unconfigured model/context slots, saved status settings, rotating tips, all slash entry coverage and explicit native-terminal handoff. Existing tests and source integrity checks remain. Real accounts, providers, Windows devices and publication are not inferred from synthetic tests.
