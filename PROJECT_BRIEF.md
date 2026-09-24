# Oracle / ZAKKO fork

## 目的

Mac miniの24時間Browser運用に向け、OracleをCodexの第二モデルreview/advisory layerとして利用する。実装の正本と検証責任は利用側Repositoryに残す。

## 対象

Repository: Shota-Zaki/oracle。開発branch: work。基点と確認時upstream/main: 74fe3ac8f896dfac17e7ba904e05f5df5adafa78、version0.21.2。開始時のforkとの差分は0 commit。

## 受入

loopback service/CDP、専用profile、秘密情報送信境界、3実行・8待機、session優先の復旧、日本語表示、capacity/retention、Codex Skill/MCP、upstream追従を対象とする。

現在は実装・検証中。独立テストの成功だけで、24時間運用の完成・全体build成功・security監査完了とは判定しない。詳細はTASKS.mdとdocs/zakko/VALIDATION.md。
