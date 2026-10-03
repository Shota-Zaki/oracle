# ORA-005 / WU-04 lifecycle display checkpoint

Base: `f386d313230ecf77b64aff2021554cd3e45396f4` (`work`). Isolated Windows checkout, branch `codex/ora-005-wu-04-lifecycle-copy`. Initial HEAD matched the fresh source selector and the tree was clean; this task owns the independent checkout. No `.agents/skills` or nested AGENTS files are tracked at this base.

Read AGENTS, PROJECT_BRIEF, DESIGN, TASKS, NEXT_WORK and AI_WORK_STATE. Fresh read-only rules HEAD: `b051b1810f3f692a0ac15c7a60b2db89a514d57d`; ORACLE_EXECUTION_STANDARD blob: `4929bd096eb122fd2a3191fdcb348a202f64d938`. This is scoped rule inspection, not full rules synchronization; no excluded repository was checked out or edited.

## Changed behavior

`formatSessionLifecycleBlock` uses `src/zakko/copy.ts` for its five labels, foreground/background display, model count and detach values. Real CLI call sites are `bin/oracle-cli.ts:2486`, `:2548` and `:2813`. They keep the existing formatter interface. Engine identifiers `api` / `browser`, model/session IDs, stored metadata and exact reattach command bytes are preserved. `buildSessionLifecycle` and `formatSessionExecutionLabel` are unchanged.

This is a bounded formatter subunit. Other status, CLI/TUI, setup and error text remains outside this patch, including `src/cli/sessionDisplay.ts` and `src/cli/reattachGuidance.ts`. ORA-005 stays In Progress.

## Current validation

Runtime inspected before execution: plain installed Node `v24.19.0`; Git `2.54.0.windows.1`. pnpm is absent from PATH and this checkout has no node_modules. No new tooling or dependencies were installed.

- `node scripts/test-session-lifecycle.mjs`: exit 0; 7/7 passed, zero skipped. Uses the existing Node24 `stripTypeScriptTypes` approach in an isolated temporary directory, resolving the actual formatter and copy import. Covers foreground browser, detached API, parallel/single/absent models, detached foreground records, all compact execution labels, byte-exact reattach commands, metadata immutability and legacy mode fallback. This is runtime validation, not a typecheck or full CLI launch.
- Existing Vitest formatter expectations were updated to exact Japanese blocks; Vitest is unexecuted.
- `node scripts/test-zakko.mjs`: exit 1; 25/30 passed, 5 failed, zero skipped; 8 entry syntax transforms completed. The same command at an unmodified archive of the base also produced 25/30 and the same 5 failures: policy.test.mjs lines 58 (POSIX path assertion on Windows), 71, 92, 169 and 181 (Windows symlink EPERM). These are baseline environment limitations. No test was skipped or changed to hide them; no permission changes were made.
- `node --check` for both new mjs files and `git diff --check`: passed.

The pinned pnpm `11.27.0` / frozen-lockfile environment remains required for typecheck, lint, format, full Vitest, build, packed CLI and MCP gates. These gates remain unexecuted; no substitute versions or another project's dependencies were used. No provider/API/browser/profile/login/cookie operations, service startup, credentials, deployment or main merge occurred.

Independent fixed-candidate review and final artifact identity are recorded by the task handoff. Publication is held for the parent's fresh policy/remote/trigger gate and explicit go instruction.
