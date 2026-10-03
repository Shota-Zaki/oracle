import { describe, expect, test } from "vitest";
import { isErrorLogged, markErrorLogged, formatCliError } from "../../src/cli/errorUtils.ts";

describe("errorUtils", () => {
  test("marks errors as logged", () => {
    const err = new Error("boom");
    expect(isErrorLogged(err)).toBe(false);
    markErrorLogged(err);
    expect(isErrorLogged(err)).toBe(true);
  });

  test("ignores non-error values", () => {
    expect(isErrorLogged("oops")).toBe(false);
    markErrorLogged("oops");
    expect(isErrorLogged("oops")).toBe(false);
  });
});

describe("formatCliError", () => {
  test.each([new Error(), new Error("   "), "", "\n", undefined, null])(
    "never renders a blank failure for %s",
    (error) => {
      expect(formatCliError(error)).toBe(
        "予期しないエラーが発生しました。詳細を確認するには --verbose を付けて再試行してください。",
      );
    },
  );
  test("preserves useful error messages and codes", () => {
    expect(formatCliError(new Error("missing conversation"))).toBe("missing conversation");
    expect(formatCliError(Object.assign(new Error(), { code: "ECONNREFUSED" }))).toBe(
      "操作に失敗しました（ECONNREFUSED）。",
    );
  });
});
