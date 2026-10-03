import { describe, expect, test } from "vitest";
import { formatBrowserReattachGuidance } from "../../src/cli/reattachGuidance.js";

describe("formatBrowserReattachGuidance", () => {
  test("includes the real session slug and all reattach commands", () => {
    const message = formatBrowserReattachGuidance("gpt55-pro-plan-review");

    expect(message).toContain(
      "この実行は正常に応答を返しませんでしたが、まだ実行中の可能性があります。再接続:",
    );
    expect(message).toContain(
      "oracle session gpt55-pro-plan-review --render    # 完了後の最終Markdownを表示",
    );
    expect(message).toContain("oracle session gpt55-pro-plan-review --live      # 完了まで出力を追跡");
    expect(message).toContain(
      "oracle session gpt55-pro-plan-review --harvest   # 現在の回答のスナップショットを取得",
    );
  });
});
