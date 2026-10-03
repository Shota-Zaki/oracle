# AI作業状態 / 2026-09-24

Repository: Shota-Zaki/oracle。branch: work。開始HEAD: 74fe3ac8f896dfac17e7ba904e05f5df5adafa78。upstreamとの差分は開始時0/0。

実施: GitHub正本診断、fork policy layer、送信前検査、専用profile既定、token秘匿、永続request受付、追加MCP tool、主要日本語help、read-only運用report、独立testと文書化。

現在状態: 全体は未完成。詳細はTASKS.md / docs/zakko/VALIDATION.md。30件の独立testはfull Oracle testではない。

制約: 接続済みCodex workspaceの両connectorが400で接続失敗。隔離環境はNode22.16.0 / TypeScript5.8.3、pnpmなし。Repository指定のNode>=24と依存取得ができず、full build/lint/testは未実行。Mac local treeや実Chromeの状態は確認できていない。

変更はGitHub Git data APIでworkへ反映する。ローカルの完全clone/commit/pushを実施したという記録にはしない。branchが変化した場合は最新treeをbaseに再適用し、force updateを使わない。main/upstream/credential/Mac設定には触れない。

次: NEXT_WORK.mdのWU-01。実機だけが残った状態ではない。

## Native verification checkpoint - 2026-10-02

At canonical work4f69a8dd9ed59f58ed42d73094d8681cfd5234a7, isolated plain Node24.21.0 execution of scripts/test-zakko.mjs passed30/30,0 skipped;8 entry transforms passed. The older Node22/no-local-tree constraints above are historical. pnpm11.27.0 and oracle dependencies remain unavailable; no installation attempted. Full toolchain/provider/browser acceptance still pending. Evidence: docs/zakko/VALIDATION_NATIVE_NODE24_2026-10-02.md. No task completion or service/publication implied.

## WU-04 lifecycle display checkpoint - 2026-10-03

Isolated Windows work started at f386d313230ecf77b64aff2021554cd3e45396f4. The CLI lifecycle block now uses Japanese copy; its seven dependency-free real-formatter tests pass on Node24.19.0. Metadata, IDs, reattach bytes and compact execution labels are preserved. Five existing policy-test failures are reproduced at the base and reflect Windows path/symlink limits; full pinned pnpm/dependency gates are unexecuted. No install or service/provider operation occurred. ORA-005 is In Progress. See docs/zakko/VALIDATION_LIFECYCLE_COPY_2026-10-03.md; further copy localization remains bounded follow-on work.

Lifecycle candidate dc448abef7aed6abb7742568728b033ec0f80e03 was independently reviewed and normally pushed to work after the parent's fresh gate; remote SHA/tree matched. Follow-on branch localizes only browser recovery guidance introduction and command explanations, preserving executable prefixes and runner guards. Native lifecycle/recovery checks pass 9/9; full pinned gates and Vitest orchestration remain unexecuted. Evidence: docs/zakko/VALIDATION_REATTACH_COPY_2026-10-03.md. ORA-005 remains In Progress; follow-on publication requires a fresh parent gate.

Recovery candidate 9719d8d6b490f04c0e313a1a4ef847aad6445ec5 was independently reviewed and normally pushed to work after the parent's next fresh gate; remote SHA/tree matched. Next isolated unit moves only synthesized CLI fallback errors into Japanese copy, preserving original message/code bytes and logged-error guards. Native CLI copy checks pass 13/13; policy suite is the baseline 25/30 Windows outcome and full pinned gates remain unexecuted. See docs/zakko/VALIDATION_ERROR_COPY_2026-10-03.md. ORA-005 remains In Progress; next publication requires a fresh parent gate.
