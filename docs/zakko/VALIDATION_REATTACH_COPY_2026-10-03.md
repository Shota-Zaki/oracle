# ORA-005 / WU-04 browser recovery guidance checkpoint

Base: `dc448abef7aed6abb7742568728b033ec0f80e03`, published and read back on work after the parent's policy/remote/trigger gate. Isolated task-owned branch: `codex/ora-005-wu-04-reattach-copy`.

## Scope and behavior

`src/cli/reattachGuidance.ts` now uses Japanese copy from `src/zakko/copy.ts` for its uncertain-run introduction and explanations of three distinct recovery actions: render the final Markdown after completion, follow output until done, and harvest a snapshot of the current answer. The introduction preserves uncertainty; it does not assert that the run completed.

Executable command prefixes, flags, session IDs, spacing, line order and newline layout are preserved. Only the introduction and explanatory comments after `#` change. The previous lifecycle formatter's exact stored reattach command bytes and compact labels remain unchanged.

Real integration is the existing `sessionRunner.ts` helper at line 606, logging the actual formatter at line 614. Its call sites at 683, 820 and 855 handle recoverable Chrome disconnect, assistant timeout and other eligible browser failures. The existing guard suppresses guidance for nonbrowser, duplicate or unsubmitted/unrecoverable runs. No runner production code, guards, error categories, persistence, retry or recovery behavior was changed. Updated positive and negative Vitest expectations retain these checks; neighboring English recovery logs remain outside this subunit.

## Verification and limits

Runtime inspected: installed Node `v24.19.0`; no pnpm on PATH, no node_modules. No tooling was installed.

- `node scripts/test-session-lifecycle.mjs`: exit 0, 9/9 passed, no skips. The existing dependency-free runner now transforms the actual recovery formatter and copy module as well as the lifecycle formatter. Two new native tests cover exact localized action instructions and byte-identical executable command prefixes for ordinary, Unicode and empty identifiers (no new identifier validation). Seven existing lifecycle checks still pass.
- `node scripts/test-zakko.mjs`: exit 1, 25/30 passed, the same five Windows path/symlink failures already independently reproduced at this base in the lifecycle review. Eight entry syntax transforms complete. No security/permission change or test skip was introduced.
- New native test and runner syntax checks pass. Node TypeScript syntax transforms for sessionRunner and both changed Vitest files pass; this does not resolve dependencies or execute the recovery orchestration.
- `git diff --check`: passed.

Full pinned pnpm11.27.0/frozen-lockfile typecheck, lint, format, Vitest (including sessionRunner integration), build, packed CLI and MCP gates remain unexecuted. An approved exact dependency environment is still required. No lower versions or borrowed dependencies are used. No browser/profile/login/cookie/provider/API calls, service startup, credential or permission changes occurred.

Independent fixed-candidate review and publication gate are recorded in the task-owned handoff. Hold publication for the parent's fresh policy/remote/trigger check and explicit go. ORA-005 remains In Progress; this is neither complete CLI/TUI localization nor full dependency/manual acceptance.
