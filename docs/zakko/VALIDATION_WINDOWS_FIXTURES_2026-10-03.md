# ORA-009 / WU-01 bounded Windows fixture portability

Base: `c90670012293df95b4474eafc5dd77c08f82f1cf`, freshly fetched from `Shota-Zaki/oracle` work before implementation. Task-owned isolated branch: `codex/ora-009-windows-fixtures`. No competing checkout writer was assigned to oracle. The parent explicitly selected this child of ORA-009; it does not complete the full pinned-toolchain task.

## Exact child scope

Only `tests/zakko/policy.test.mjs` and verification/work-tracking documentation change. Production modules, token handling, security boundaries, package manifests, dependency lockfile, workflows and runtime configuration are unchanged.

- Replace the `/repo` absolute-path expectation with a task-owned temporary workspace and native `path.join`. Keep all four rejection cases: relative traversal, a sibling with the same root prefix, the root itself, and another outside path. Preserve the positive contained-file assertion.
- Separate file admission's existing compound link test into file-symlink, directory-link and hardlink tests. The original file-symlink and hardlink rejection assertions remain. This lets supported directory and hardlink checks execute even when file-symlink fixture creation fails.
- Create directory links using an absolute task-owned target: Windows `junction`, other platforms `dir`. Assert `lstat().isSymbolicLink()` before testing rejection. Cover admission through internal and external directory links and the storage directory-link rejection with exact policy codes.
- Replace the capacity fixture's real `/etc` target with a separate task-owned temporary directory containing a synthetic 256-byte file. Preserve the exact `{ bytes: 5, entries: 3 }` result and traversal-budget rejection. Add rejection of the linked directory as the scan root. The external synthetic content must not be counted.

All fixtures are uniquely created under the configured OS temporary directory and cleaned by the existing test hooks. No actual external directory contents, credentials or private user files are used. No Developer Mode, privileges, OS settings, ACLs, dependency installation, provider access or service startup is involved. File symlinks are not replaced by junctions.

## Current fixed-source verification

Installed runtime inspected: Windows x64 Node `24.19.0`. The unchanged dependency-free runner transforms actual production sources with Node's TypeScript transform and executes the tests; it does not resolve the full dependency graph or typecheck.

- `node scripts/test-zakko.mjs`: exit 1, **30/32 passed, two failed, zero skipped/todo**. Eight entry syntax transforms completed. This is not 30/30 and is not suite acceptance.
- Passing checks now include the native absolute path, internal/external directory junction admission rejection, standalone hardlink rejection, storage junction rejection, and external-junction capacity/budget/root rejection.
- Remaining failure 1: `file symlinks fail closed (requires file-symlink fixture privilege)` fails with `EPERM` while creating the file symlink. The rejection assertion is not run.
- Remaining failure 2: the unchanged `token input rejects symlink, hardlink, oversized and whitespace` test fails with `EPERM` while creating its file symlink. Its subsequent symlink rejection, hardlink, oversized-file and whitespace assertions are not reached. No assertion was removed, bypassed or changed to skip.
- Before this child, the Windows suite at the fixed base was 25/30 with five path/symlink-fixture failures. Splitting the compound admission test adds two test cases; three formerly failing tests now execute successfully and independent hardlink coverage also executes.
- `node scripts/test-session-lifecycle.mjs`: exit 0, **20/20 passed, zero skipped**, preserving previous real-source copy/diagnostic checks.
- `node --check tests/zakko/policy.test.mjs` and `git diff --check`: passed.

pnpm `11.27.0` acquisition and frozen-lockfile dependency setup remain proposed, not performed. Full typecheck/lint/format/Vitest/build/packed CLI/MCP/audit gates and Mac acceptance remain unexecuted. ORA-009 remains Ready with this bounded verification child recorded; no full acceptance is claimed. ORA-005 remains In Progress.

The possible Windows `O_NOFOLLOW` token behavior remains an **unvalidated source/runtime observation**, not a confirmed vulnerability. The file-symlink rejection case has not run here. This child neither changes `token.ts` nor authorizes a security fix.

The immutable candidate and independent review evidence are recorded in the task handoff outside this checkout. Publication is held for the parent's fresh policy/remote/trigger gate and explicit go.
