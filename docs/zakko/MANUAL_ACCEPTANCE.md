# Mac実機受入（すべて未実行）

Repository側の残件とfull検証を完了した後、実測Evidenceを追加する。以下は実機依存であり、Linuxのfixture成功からPASSへ置き換えない。

| ID | 項目 | 受入条件 | 状態 |
|---|---|---|---|
| MAC-01 | 専用Chrome login / approval | 通常profileと分離し、本人ログイン・debugging approval後に接続できる | 未実行 |
| MAC-02 | CDP / service bind | lsof等で待受がloopbackのみ、tokenがargv/log/UIに出ない | 未実行 |
| MAC-03 | 実model選択 | 画面上の利用可能model・思考設定・選択Evidenceが要求と一致、silent fallbackを検出 | 未実行 |
| MAC-04 | 実Codex MCP | 複数agentでrequestId/sessionを保持し、3実行/8待機/overflowを実測 | 未実行 |
| MAC-05 | 24時間連続 | queue/tab/session/artifact/disk、待機時間、認証失敗を測定し資源が無制限増加しない | 未実行 |
| MAC-06 | sleep / network復帰 | 既存sessionを維持・回収し、不明状態で重複送信しない | 未実行 |
| MAC-07 | Mac / service再起動 | 再起動は本人の明示操作。永続IDとhost targetから復旧できる | 未実行 |
| MAC-08 | Browser crash / rate limit | degraded記録と有限の復旧案内。無限retryや同prompt再送なし | 未実行 |
| MAC-09 | ChatGPT UI変更 | DOM選択・Markdown・会話ID・回答harvestの整合を確認 | 未実行 |

実機確認だけが残っている状態ではない。Repository残件はTASKS.md、実行環境不足はVALIDATION.mdで管理する。
