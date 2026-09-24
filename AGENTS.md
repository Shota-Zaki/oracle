# Oracle fork 開発指針

正本は `Shota-Zaki/oracle` の `work`。`main` は公開用です。実装・設計・受入状態は PROJECT_BRIEF.md / DESIGN.md / TASKS.md / NEXT_WORK.md / AI_WORK_STATE.md / docs/zakko/ を参照します。

## 共通ルール

`Shota-Zaki/development-rules` work の `docs/rules/ORACLE_EXECUTION_STANDARD.md` に合わせます。確認済みHEADは `2eb0c985de49473d2681eeeff344a1fe085b7783`、候補versionは3.2.0です。作業開始時にremote HEADを再取得し、ルール全体を同期済みと推測しないでください。

## 開発境界

fork独自処理は src/zakko/、利用案内は docs/zakko/ と README.ja.md にまとめます。*.upstream.ts は基点の元実装を保持する移動先です。元の公開import pathを薄いpolicy adapterとして維持します。upstreamの差分は rename-aware mergeで取り込み、adapter経由のテストも行います。

model ID・flag・環境変数・session ID・API field・HTTP status・DOM selectorは維持します。日本語化は表示層に適用し、ChatGPT DOM判定やモデル回答そのものには適用しません。

## 安全な運用

標準はloopback service、専用manual-login profile、Cookie同期OFF、3実行・8待機です。秘密値は安全な環境設定から注入します。回答は助言として検証し、Oracleが回答内のshellやpatchを自動実行する設計にはしません。

送信前に入力reportを確認します。timeoutは同じrequest/sessionを確認し、reattach/harvestを優先します。保留・不明状態は再送の許可ではありません。

## 検証と変更

独立test、全体test、integration、実機受入を分離します。未実行をPASSにせず、受入履歴と現在検証を分けます。原実装のlive testは明示opt-inです。ChatGPTの「Answer now」を自動選択せず、思考の完了を待ちます。Browser回答はMarkdownや会話IDの整合も確認します。

並行変更は保存し、branch更新はfast-forwardで行います。既存commitへの強制上書きはせず、最新HEADへ差分を再適用します。main更新・公開・credential変更・再起動は個別の明示指示を起点に扱います。GitHub Actionsを新設・起動する代わりに、まず指定toolchainでローカル検証します。
