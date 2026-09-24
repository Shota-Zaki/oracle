# AI作業状態 / 2026-09-24

Repository: Shota-Zaki/oracle。branch: work。開始HEAD: 74fe3ac8f896dfac17e7ba904e05f5df5adafa78。upstreamとの差分は開始時0/0。

実施: GitHub正本診断、fork policy layer、送信前検査、専用profile既定、token秘匿、永続request受付、追加MCP tool、主要日本語help、read-only運用report、独立testと文書化。

現在状態: 全体は未完成。詳細はTASKS.md / docs/zakko/VALIDATION.md。30件の独立testはfull Oracle testではない。

制約: 接続済みCodex workspaceの両connectorが400で接続失敗。隔離環境はNode22.16.0 / TypeScript5.8.3、pnpmなし。Repository指定のNode>=24と依存取得ができず、full build/lint/testは未実行。Mac local treeや実Chromeの状態は確認できていない。

変更はGitHub Git data APIでworkへ反映する。ローカルの完全clone/commit/pushを実施したという記録にはしない。branchが変化した場合は最新treeをbaseに再適用し、force updateを使わない。main/upstream/credential/Mac設定には触れない。

次: NEXT_WORK.mdのWU-01。実機だけが残った状態ではない。
