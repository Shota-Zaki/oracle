# ZAKKO extension 設計

## 構成

Codex → consult_safe / Skill → 共通Oracle service（loopback）→ Oracle Browser → ChatGPT。

Control Centerは外部Gatewayからserviceを呼ぶ。OracleをCore内部libraryに組み込まず、Cookie/CDP/tokenをfrontendへ渡さない。

## 実装境界

| 元のentry | 元実装の保持先 | adapterの責務 |
|---|---|---|
| src/remote/server.ts | server.upstream.ts | loopback、3/8、専用profile、token読込・ログ秘匿 |
| src/browser/config.ts | config.upstream.ts | manual-login既定、ORACLE_HOME_DIR配下profile、明示CDP接続先検査 |
| src/oracle/files.ts | files.upstream.ts | 収集後の許可root・秘密候補・サイズ検査 |

src/zakko/copy.ts が表示copyの境界。MCPには追加tool consult_safe を登録し、既存tool名・schemaを保存する。既存toolが新toolと同じ保護範囲を持つとは扱わない。

## 受付と復旧

requestIdのSHA-256をdirectory名としてatomic mkdirで予約する。intent.jsonとsession.jsonはowner-only、fsyncしてから実行する。同じIDは既存記録の照会であり、新しいpromptへの差替えではない。MCPが終了しても再起動後に同じIDから新規送信しない。session作成とbinding間のcrashはfail-closedで保留する。

受付を返すMCPプロセスは実行中維持する。これは独立daemonへの永続queue委譲ではない。remote service再起動後の実行再開や会話の自動回収は未完成で、既存session/会話targetによる復旧を統合する必要がある。

## データ境界

consult_safeは検査済みUTF-8をpromptにsnapshotし、送信時にはfile pathを再読込しない。入力は合計128 KiBまで、model IDと明示UI labelを区別して保持する。バイト上限はtoken計測ではない。configのpromptSuffixを暗黙追加しない。保存するBrowser設定はallowlistで作り、remoteToken等を落とす。

通常CLIのraw attachment再読込・archive内のsecret・レガシーtoolの保存ログは追加監査対象。owner自身が同時にファイル体系を改ざんする状況に対する完全なOS sandboxではない。

## 保存と容量

専用home/profileは0700、新しいfork記録は0600。tokenは既存env/fileから読み、生成・変更・表示しない（programmatic createRemoteServerの一時tokenは返り値のみ）。maintenanceは容量・retention候補のread-only report。7日超のcompletedのみ候補とし、running/partial/error/cancelled・不明・復旧待ちを保持する。自動削除・quota強制・intent墓標の圧縮は別の受入対象。
