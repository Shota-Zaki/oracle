# ORA-005 / WU-04 CLI error fallback checkpoint

Base: `9719d8d6b490f04c0e313a1a4ef847aad6445ec5`, published and read back on work after the parent's fresh policy/remote/trigger gate. Isolated task-owned branch: `codex/ora-005-wu-04-error-copy`.

## Actual user-facing scope

The CLI main catch at `bin/oracle-cli.ts:3081` calls `formatCliError` when the error has not already been logged, and still sets exitCode to 1. `src/cli/errorUtils.ts` now obtains only its two synthesized fallback messages from `src/zakko/copy.ts`: code-only operation failure and unexpected/blank error guidance with the unchanged `--verbose` flag.

The original nonblank Error message or string still takes precedence and is returned byte-for-byte. Code strings keep their exact bytes, including whitespace; only surrounding presentation changes. Original value classification and trim checks, the logged symbol, mark/isErrorLogged behavior, main's conditional logging, exit status and sessionRunner's logging marker are unchanged. Unknown/provider/user error messages are not translated. No command, ID, persisted data or error-handling condition is changed.

## Verification and limits

Installed Node `v24.19.0` inspected before execution. No pnpm on PATH or node_modules; no tooling or dependencies installed.

- `node scripts/test-session-lifecycle.mjs`: exit 0, 13/13 pass, zero skips. The existing isolated transformer now loads actual errorUtils/copy modules and executes four new tests for blank/unsupported input fallback, byte-exact original messages and precedence, raw code bytes/nonmutation, and Error-only already-logged behavior. Nine prior lifecycle/recovery checks continue to pass.
- `node scripts/test-zakko.mjs`: exit 1, 25/30 pass, same five known Windows path/symlink failures independently reproduced at earlier bases. Eight entry syntax transforms completed; no skip or permission change.
- New native test and runner syntax checks and `git diff --check` passed. Node TypeScript syntax transforms for actual bin/oracle-cli.ts and changed Vitest expectations passed; these do not resolve dependencies or launch the CLI.
- Existing Vitest error expectations now check exact Japanese fallback text and code presentation; Vitest itself is unexecuted.

Full pinned pnpm11.27.0/frozen-lockfile typecheck/lint/format/Vitest/build/packed CLI/MCP gates remain unexecuted. Their prerequisite is an approved exact dependency environment; no downgraded or borrowed toolchain is used. No provider/browser/account/profile/cookie actions, service startup, credential/security/permission changes occurred.

Independent fixed-candidate review is recorded in the task-owned handoff. Publication is held for the parent's fresh policy/remote/trigger gate and explicit go. ORA-005 remains In Progress; sessionDisplay, TUI, setup and remaining warning/error strings still require audit/localization and full dependency acceptance.
