# Oracle — ZAKKO fork

Mac mini常駐のBrowser Modeを、Codexの第二モデルレビューに使うためのforkです。開発は `Shota-Zaki/oracle` の `work` で行います。

**現状は開発・検証中です。24時間運用の完成版ではありません。** 追加coreの独立テストは成功していますが、指定toolchainでの全体build/testと、復旧・保存上限等の残作業があります。[Task正本](TASKS.md)と[検証記録](docs/zakko/VALIDATION.md)を確認してください。

## 標準構成

Codex → `oracle-mcp` の `consult_safe` → `oracle serve --host 127.0.0.1` → 専用Chrome profile → ChatGPT。

実行3件・待機8件。Cookie同期はOFF、tokenは環境設定またはowner-onlyファイルから渡します。同じ依頼は同じrequestIdを維持し、timeout後は新規送信ではなくsessionを確認します。回答は助言であり、Codexが採用内容をtest/buildで検証します。

## 開発時の確認

```sh
node scripts/test-zakko.mjs
```

この独立テストは外部API・Chrome・credentialを使いません。full検証はpackage.json指定のtoolchainで行います。

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

## 手順

[運用設定](docs/zakko/OPERATIONS.md)、[Codex Skill](skills/oracle-zakko/SKILL.md)、[安全性の残件](docs/zakko/SECURITY_REVIEW.md)、[実機受入](docs/zakko/MANUAL_ACCEPTANCE.md)、[upstream追従](docs/zakko/UPSTREAM.md)。

upstreamのREADME・ドキュメントには異なるnetwork既定や作者用例が残っています。forkの通常運用は上記の日本語手順を参照します。model IDの登録と、そのアカウントで実際に利用できることは別です。

元のupstream案内は [README.upstream.md](README.upstream.md) に保持しています。upstream packageのinstallだけでは、このforkの追加機能は入りません。
