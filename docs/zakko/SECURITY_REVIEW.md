# Security review / 2026-09-24

## 対象と範囲

基点は74fe3ac8f896dfac17e7ba904e05f5df5adafa78。fork/main/work/upstream/main一致をGitHubで確認。今回の監査はfile collector、Browser defaults、service entry/受付・token表示、MCP consult/session入口、共通ruleに重点を置いた。全source・全dependency・全OSでの完全監査ではない。

## Findingと現在の対策

| ID | 重要度 | 確認内容 | 状態 |
|---|---|---|---|
| ORA-S01 | High | 元serviceはdefault0.0.0.0、tokenをloggerへ表示 | wrapperでliteral loopback・token秘匿。Chrome起動flag全経路と旧doc例は残存監査 |
| ORA-S02 | High | globにはfollowSymbolicLinks:falseが既存。明示path/stat/readは別検査が必要 | root/symlink/hardlink/name/content/size検査。consult_safeは検査済みsnapshot。通常raw uploadの再読込・archive内検査は残件 |
| ORA-S03 | Medium | prompt/transcript/artifact/sessionが保存される | 専用home/profile0700、fork記録0600。既存ファイルと全CLI保存経路、Windows ACLは未完了 |
| ORA-S04 | Medium | cookieSync:falseは基点から既存、manual-loginはMacでdefaultではない | fork defaultをmanual-loginに変更。ORACLE_HOME_DIR連動。明示legacy設定の監査は継続 |
| ORA-S05 | Medium | token認証だけでは公開networkでの保護にならない | serviceと明示CDP接続先をloopbackに制限。tokenはenv/private file。legacy CLI token引数・bridge経路を追加確認 |
| ORA-S06 | Medium | npm依存とlockfileのsupply-chain境界 | dependency/lockfile変更なし。指定toolchain install・pnpm auditは未実行 |
| ORA-S07 | Medium | tab/run/queue/session/artifact/diskの増加 | 元RunSlotsを再利用し標準3/8、snapshot入力サイズ制限。disk quota、prune、intent保持上限は残件 |
| ORA-S08 | Medium | model回答はuntrusted | forkは回答を保存して返すのみ。回答からshell/patchを実行する機能は追加していない |

## 重要な未解決点

元serverのbounded modeはclient切断でabortし、runごとに新規UUIDを作る。request ledgerは再送抑止であり、実行を永続daemonへ移す機構ではない。remote再起動からhost-owned session/targetを回収する機構を統合する必要がある。

scannerは高確度パターン検出であり、短いpassword、任意形式token、暗号化/圧縮データ、個人情報すべてを判定できるものではない。file reportと最小入力を併用する。検査rootはowner管理の作業領域を前提とし、同一ユーザーが体系を同時改ざんする状況の完全なsandboxではない。

MCPの既存consult、project_sources、画像等の全経路がconsult_safeと同等の保護を受けたとは判定しない。ログredactionは設定・診断用であり、回答本文を機械変換しない。全経路のsecret logging監査は未完了。
