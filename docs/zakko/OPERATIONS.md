# Mac mini運用手順（受入前）

この文書は構成案と開発用の起動手順です。TASKS.mdのRepository残件と全体検証を完了してから、24時間運用を受け入れます。

## 専用保存先

`ORACLE_HOME_DIR` は通常のOracleデータと分けた、本人所有の実directoryにします。例: `/Users/zaki/.oracle-zakko`。profileはその配下の `browser-profile`。Cookie DBを既存Chromeからコピーしません。`/Users/zaki/Developer` のような参照pathではなく、必要に応じて実体のRepository rootをMCPのcwdに設定します。

既存のtokenを環境変数 `ORACLE_REMOTE_TOKEN` または `ORACLE_REMOTE_TOKEN_FILE` のowner-onlyファイルから渡します。ファイルは本人所有・通常ファイル・hard linkなし・0600、32文字以上4096文字以下です。この変更ではtokenを作成・変更していません。token値をコマンド引数、URL、チャット、Git、コピー操作へ載せません。WindowsのACL検証は別途必要です。

## 起動例

buildが成功したcheckoutで使用します。tokenの安全な注入を先に済ませてください。

```sh
export ORACLE_HOME_DIR=/Users/zaki/.oracle-zakko
export ORACLE_REMOTE_TOKEN_FILE=/Users/zaki/.config/oracle/transport-secret
node dist/bin/oracle-cli.js serve --host 127.0.0.1 --port 9475 --max-concurrent-runs 3 --max-queued-runs 8
```

上記tokenファイルは既存の安全な保存先の例であり、この手順はファイルを生成しません。初回は開いたOracle専用Chromeで本人がChatGPTへログインします。Chrome login / remote debugging approval は実機受入です。service内部のtab上限が3未満なら実行数はさらに小さくなります。

CDPを別Hostへ公開する構成ではなく、認証済みtransportからloopbackのOracle serviceへ接続します。既存ドキュメントの0.0.0.0例は通常運用に使いません。

## MCP

MCPプロセスも同じ `ORACLE_HOME_DIR` を使用し、`ORACLE_REMOTE_HOST=127.0.0.1:9475` と安全なtoken注入を設定します。server entryは `node <checkout>/dist/bin/oracle-mcp.js`。MCPの作業directoryが添付の許可rootです。MacのRepositoryは `/Volumes/ZAKKO_DEV/repos` の実体を使用できます。

`consult_safe` はテキストの助言専用です。最初に `dryRun:true` でfiles/bytes/reportを確認し、実行は同じ入力・requestIdで `dryRun:false` にします。modelは画面とアカウントで実際に利用可能なIDを指定し、必要なら正確な `browserModelLabel` を渡します。modelの存在・選択成功・提供側の利用上限をdry-runで検証したとは扱いません。

toolはsession IDを保存した後に受付を返します。MCPプロセスは実行中維持してください。完了確認は既存 `wait` / `sessions` または `oracle session <sessionId>`。同じrequestIdの再呼出しは元の依頼の照会であり、異なるpromptへの差替えにはなりません。記録が不明でも新規IDに変えて自動再送しません。

consult_safeの入力はUTF-8 textのみ、合計128 KiB以下です。画像・PDF・archiveは直接受け付けません。秘密候補scannerは完全ではないため、送信者による入力確認を併用します。通常CLIでは `--dry-run summary --files-report` でtoken数も確認します。

## 保存状況

```sh
node dist/bin/oracle-ops.js report
```

ディスク使用量、7日超completedの削除候補、復旧対象を表示します。prompt・token・Cookieは表示しません。このreportは削除やquota enforcementを行いません。手動の一括session削除は復旧情報を失うため、prune実装の受入までは個別に確認します。

## 停止・復旧

timeout後は新しいpromptの送信よりsession/会話target確認を優先します。MCP kill・service restart・network断で継続保証はまだありません。保存IDから復旧可能性を確認し、serviceの永続実行queueとhost target対応を完成させてから自動再開を有効にします。

launchd登録・Mac設定変更・sleep抑制・自動再起動は今回行っていません。まず手動起動で受入を通し、その後に運用設定を適用します。
