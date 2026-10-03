# ORA-005 / WU-04 CLI validation diagnostics batch

Base: `41f6f2733eda9ca975b0afec8ed793fbbec715e6`, independently reviewed and published to work after the parent's fresh gate. Isolated task-owned branch: `codex/ora-005-wu-04-validation-copy`.

## Coherent scope

Move related CLI input/document validation diagnostics into `src/zakko/copy.ts` in one batch:

- `stdin.ts`: TTY pipe requirement and empty stdin failures for `-p -`.
- `docsCheck.ts`: successful check summary, drift heading/issue descriptions, explicit missing path and no-documents failures.

Actual CLI integration is unchanged: `bin/oracle-cli.ts:379` resolves dash prompts; `:1237-1244` checks docs flags, prints plain diagnostics or unchanged JSON and sets exitCode from the same issue count. Command examples, flags, arguments, paths, counts, data interfaces, scope matching and stream/scanner logic remain unchanged. English `Core consult flags` is a Markdown matching key, not presentation copy, and is preserved. Command paths and original document section names are data and remain untouched in reported scopes.

## Current verification

Installed Node24.19.0 inspected before execution. No pnpm on PATH, no node_modules and no installs.

- `node scripts/test-session-lifecycle.mjs`: exit 0, 20/20 passed, zero skipped. Its existing isolated source-transform runner now also loads actual stdin/docsCheck/copy modules and runs seven new diagnostic behavior checks plus the previous thirteen.
- Native checks use real in-memory Node streams and task-owned temporary Markdown fixtures. They exercise actual reading, prompt trim/bypass behavior, TTY/empty rejection and unchanged read-error identity; actual doc scanning and success/drift printing, result nonmutation/file preservation, flag sorting, root-only/command scoping, explicit/default path failures and negation/slash flag extraction. Commander is a type-only import here: data-only metadata fixtures use the fields the scanner reads, not an alternate parser. Real Commander CLI integration remains unexecuted.
- Existing Vitest input errors and missing-path CLI expectation are updated to exact Japanese output, retaining the same validation conditions; Vitest and its CLI subprocess test are unexecuted.
- `node scripts/test-zakko.mjs`: exit 1, 25/30 passed, same five baseline Windows POSIX-path/symlink-EPERM failures, eight entry syntax transforms. Baseline failure identities were independently reproduced in previous fixed-candidate reviews. No skips or security/permission changes.
- Both native mjs syntax checks, CLI-entry/changed-Vitest TypeScript syntax transforms and `git diff --check` passed. Transforms do not typecheck or launch the CLI.

Full pinned pnpm11.27.0/frozen-lockfile typecheck/lint/format/Vitest/build/packed CLI/MCP gates remain unexecuted. No dependency downgrade, borrowed tooling or provider/browser/account/profile/cookie/service operation occurred. Independent fixed-candidate review and artifacts are recorded in the task handoff. Publication requires a fresh parent policy/remote/trigger gate and explicit go.

ORA-005 stays In Progress. Full CLI/TUI/help/setup/warning localization and locked-dependency/manual acceptance are incomplete. The task-owned setup proposal describes the exact isolated dependency environment needed for real CLI/Commander and dependency-heavy outputs; no setup was executed.
