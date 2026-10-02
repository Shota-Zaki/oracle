# Task正本

状態: Ready / In Progress / Review / Done。実機待ちと開発環境の不足を区別する。

| ID | 内容 | 状態 | 現在の根拠 / 受入条件 |
|---|---|---|---|
| ORA-001 | fork/upstream/rules診断 | Done | remote取得で基点0/0、work存在、rule HEAD一致を確認 |
| ORA-002 | policy / private storage / intent基盤 | Done | 独立30テスト、8moduleのisolated typecheck。entry統合受入は別Task |
| ORA-003 | service/browser/file adapter | Review | source反映。実依存でのfull test/build、既定変更に追従する既存test更新が必要 |
| ORA-004 | consult_safe / Skill | Review | tool登録とadapter実装。実SDK schema、並列stdio、HTTP切断・応答回収の統合検証が必要 |
| ORA-005 | 日本語表示 | In Progress | help主要copy、運用案内、safe toolを実装。status/TUI/setup/既存warning全件の残存英語監査が必要 |
| ORA-006 | restart recovery | In Progress | 永続request予約・session bindingは独立テスト済み。service再起動後のsession→remote target復旧は未完成 |
| ORA-007 | retention / quota / prune | In Progress | read-only容量・7日候補判定を実装。未完了保護付きprune、disk admission、artifact/intent保持上限は未完成 |
| ORA-008 | security全経路監査 | In Progress | ORA-S01/S02/S03/S04/S05の部分対策。残件はSECURITY_REVIEW.md |
| ORA-009 | 指定toolchainの全体検証 | Ready | Node>=24 / pnpm11.27.0、lockfile固定install、typecheck/lint/format/test/build/packed/MCP/audit |
| ORA-010 | Mac実機受入 | Ready | Repository側の未完了と独立。MANUAL_ACCEPTANCE.mdの全項目を実測 |

## Acceptance History

2026-09-24: fork/rules基点確認。追加coreの独立runtime test 30/30 PASS、isolated TypeScript5.8.3 strict check PASS。upstream RunSlotsの使用fixtureは元blob SHA一致。

## Current Validation

全体完成判定: 未達。Mac用運用開始・main公開の受入条件は満たしていない。指定依存のbuild/test未実行と、実装残件を、実機確認だけに置き換えない。

## ORA-009 verification checkpoint - 2026-10-02

At fixed source4f69a8dd9ed59f58ed42d73094d8681cfd5234a7, existing dependency-free tests passed30/30 with plain Node24.21.0 and8 entry syntax transforms. Full dependency/typecheck/lint/Vitest/build/packed/MCP gate remains unexecuted; ORA-009 stays Ready, no full AC accepted. Exact toolchain prerequisite and limits: docs/zakko/VALIDATION_NATIVE_NODE24_2026-10-02.md.
