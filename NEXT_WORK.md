# 次のWork Unit

## WU-01 / ORA-009

現在work HEAD・作業tree・originを取得し、並行変更を保つ。Node>=24、packageManagerのpnpm11.27.0、pnpm-lock.yamlを維持して `pnpm install --frozen-lockfile`。旧toolchain向けの依存version引下げで辻褄を合わせない。

`node scripts/test-zakko.mjs` → `pnpm typecheck` → `pnpm lint` → `pnpm format:check` → `pnpm test` → `pnpm build` → `pnpm test:packed-cli` → MCP unit / 実SDK stdio smoke。既存testの既定値・英語snapshotは挙動を確認して更新する。sourceを未検証のままDoneへしない。

## WU-02 / ORA-006

src/remote/server.upstream.ts のclient disconnectでのabortと、毎回runIdを作る経路を対象に、host-owned durable session/target対応を設計する。queued/submitted/completed/recovery-requiredを永続化し、送信済みか不明なら再送しない。requestIdと同じpromptでも複数回送信しないことを、HTTP応答喪失・service kill・MCP kill・Browser timeoutのfake integrationで確認する。既存RunSlots/tab leaseは再利用する。

## WU-03 / ORA-007・008

completed以外を保持するpruneを実装し、参照artifactとintent tombstoneの保持方針を決める。ディスク満杯・inode不足・permission拒否・symlink差替えの失敗系をtestする。raw attachmentを検査済みbytesへ固定し、通常CLI/MCP/bridge/project_sourcesの送信境界を監査する。Chrome起動flag・明示remote endpoint・tokenのCLI引数と全ログ経路も確認する。

## WU-04 / ORA-005

user-facing / protocol / DOM / test固定文字列を分類し、残るCLI/TUI/status/setup/errorをcopy layerへ移す。DOM label、flag、ID、schema、回答本文は維持する。翻訳前後の動作と日本語helpの全optionをsnapshotする。

全体検証後にMANUAL_ACCEPTANCE.mdへ進み、実機未確認は未確認のまま残す。変更はworkへ通常pushし、remote SHAと主要fileをreadbackする。

## WU-01 checkpoint - 2026-10-02

Dependency-free source/runtime checks passed on plain Node24.21.0 at4f69a8dd. See docs/zakko/VALIDATION_NATIVE_NODE24_2026-10-02.md. Node24 is available; remaining full-gate prerequisite is exact pnpm11.27.0/locked dependencies (no install authorized). Acquire approved dependency environment before typecheck/lint/format/Vitest/build/packed/MCP. Do not rerun provider/live tests or use shared browser profiles as a substitute.
