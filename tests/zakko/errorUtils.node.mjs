import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const modules = process.env.ZAKKO_LIFECYCLE_MODULES;
assert.ok(modules, "Run with node scripts/test-session-lifecycle.mjs");
const { formatCliError, isErrorLogged, markErrorLogged } = await import(
  pathToFileURL(path.join(modules, "src/cli/errorUtils.js")).href
);

test("blank or unsupported errors display Japanese fallback with the unchanged diagnostic flag", () => {
  for (const error of [
    new Error(), new Error("   "), "", "\n", undefined, null, 0, false,
    {}, { message: "plain-object message" }, { code: "\t " }, { code: 500 },
  ]) {
    assert.equal(formatCliError(error),
      "予期しないエラーが発生しました。詳細を確認するには --verbose を付けて再試行してください。");
  }
});

test("nonblank original messages retain exact bytes and take precedence over error codes", () => {
  for (const message of ["missing conversation", "  session stable-id failed\t", "回答の取得に失敗\n"]) {
    const error = Object.assign(new Error(message), { code: "ECONNREFUSED" });
    const before = { message: error.message, code: error.code };
    for (const input of [message, error]) {
      assert.deepEqual(Buffer.from(formatCliError(input)), Buffer.from(message));
    }
    assert.deepEqual({ message: error.message, code: error.code }, before);
  }
});

test("code-only failures localize the surrounding copy and retain raw code bytes without mutation", () => {
  for (const code of ["ECONNREFUSED", "  E_STABLE_42\t", "エラー識別子"]) {
    for (const error of [Object.freeze({ code }), Object.freeze(Object.assign(new Error("\n"), { code }))]) {
      const result = formatCliError(error);
      assert.equal(result, `操作に失敗しました（${code}）。`);
      const displayedCode = result.slice("操作に失敗しました（".length, -"）。".length);
      assert.deepEqual(Buffer.from(displayedCode), Buffer.from(code));
      assert.equal(error.code, code);
    }
  }
});

test("formatting retains the original already-logged guard and its Error-only behavior", () => {
  const error = Object.assign(new Error(), { code: "E_STABLE_42" });
  assert.equal(isErrorLogged(error), false);
  formatCliError(error);
  assert.equal(isErrorLogged(error), false);
  markErrorLogged(error);
  assert.equal(isErrorLogged(error), true);
  assert.equal(formatCliError(error), "操作に失敗しました（E_STABLE_42）。");
  assert.equal(isErrorLogged(error), true);
  markErrorLogged(error);
  assert.equal(isErrorLogged(error), true);
  for (const other of ["failure", { code: "E_STABLE_42" }, null, undefined]) {
    markErrorLogged(other);
    assert.equal(isErrorLogged(other), false);
  }
});
