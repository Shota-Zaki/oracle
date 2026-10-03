import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const modules = process.env.ZAKKO_LIFECYCLE_MODULES;
assert.ok(modules, "Run with node scripts/test-session-lifecycle.mjs");
const { formatBrowserReattachGuidance } = await import(
  pathToFileURL(path.join(modules, "src/cli/reattachGuidance.js")).href
);

test("browser recovery instructions show localized explanations for three different actions", () => {
  assert.equal(formatBrowserReattachGuidance("gpt55-pro-plan-review"), [
    "この実行は正常に応答を返しませんでしたが、まだ実行中の可能性があります。再接続:",
    "  oracle session gpt55-pro-plan-review --render    # 完了後の最終Markdownを表示",
    "  oracle session gpt55-pro-plan-review --live      # 完了まで出力を追跡",
    "  oracle session gpt55-pro-plan-review --harvest   # 現在の回答のスナップショットを取得",
  ].join("\n"));
});

test("session IDs and executable command prefixes keep exact bytes, order and spacing", () => {
  for (const id of ["stable-session-123", "会話-review-42", ""]) {
    const lines = formatBrowserReattachGuidance(id).split("\n");
    assert.equal(lines.length, 4);
    assert.deepEqual(lines.slice(1).map((line) => Buffer.from(line.split("#")[0])), [
      Buffer.from(`  oracle session ${id} --render    `),
      Buffer.from(`  oracle session ${id} --live      `),
      Buffer.from(`  oracle session ${id} --harvest   `),
    ]);
  }
});
