# ORA-009 native Node24 checkpoint - 2026-10-02

Fixed canonical work source:4f69a8dd9ed59f58ed42d73094d8681cfd5234a7. Fresh GitHub commit(work) readback matched cached origin/work. Isolated clone checked out work; original main74fe3ac8f896dfac17e7ba904e05f5df5adafa78 clean, unchanged.

## Concrete execution

Runtime:/tmp/oshigoto-node24.21.0/bin/node, plain installed Node24.21.0. No installation or hardened app runtime used.

Command: `/tmp/oshigoto-node24.21.0/bin/node scripts/test-zakko.mjs`

Exit0;30 tests passed,0 failed,0 skipped.8 entry sources syntax-transformed; Node emitted the expected stripTypeScriptTypes experimental warning. Includes 11 parallel same-request reservations, cross-process unique reservation, restart/no-redispatch, local coordinator capacity, RunSlots3active/8waiting, input/path bounds, retention read-only behavior, token-file cases and Japanese-copy identifier stability.

The runner transforms source into a task-owned temporary directory, runs local child tests and removes that directory in finally. It does not resolve dependency imports or perform TypeScript typechecking. No provider API or actual browser/login/profile/cookie operation was executed; temporary synthetic filesystem fixtures were used. No new security changes made.

## Remaining specified gates

Original oracle checkout has no node_modules; pnpm is not on PATH. Canonical packageManager requires pnpm11.27.0 and pnpm-lock.yaml fixed install. No pnpm/dependency installation authorized or attempted. Full typecheck/lint/format/Vitest/build/packedCLI/MCP SDK stdio gates are not run. Do not substitute another repository's dependencies or reduce pinned versions. No full ORA-009 AC accepted; task remains Ready.

Source inspection/reference metadata does not confirm current upstream rules synchronization; requested ORACLE_EXECUTION_STANDARD is absent from local development-rules checkout. Existing canonical AGENTS/accepted design remain the scope for these dependency-free tests; no rule update attempted.

Next prerequisite is an explicitly approved preinstalled/isolated exact dependency environment or approved frozen-lockfile dependency setup. Browser/provider/manual acceptance remains separate. Current test results do not establish24-hour readiness and permanent Mac service setup is unsuitable while Mac return is planned.
