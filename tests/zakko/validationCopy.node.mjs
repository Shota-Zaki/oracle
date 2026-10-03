import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pathToFileURL } from "node:url";

const modules = process.env.ZAKKO_LIFECYCLE_MODULES;
assert.ok(modules, "Run with node scripts/test-session-lifecycle.mjs");
const load = (name) => import(pathToFileURL(path.join(modules, `src/cli/${name}.js`)).href);
const { readStdin, resolveDashPrompt } = await load("stdin");
const { checkDocsFlags, printDocsCheckResult, collectCommanderFlags, extractMarkdownFlags } =
  await load("docsCheck");

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "oracle-validation-copy-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

// Data-only Commander metadata shape; no parser or CLI dependency is substituted.
const command = (name, flags = [], commands = []) => ({
  name: () => name,
  options: flags.map((flags) => ({ flags })),
  commands,
});

test("stdin payloads, normal prompts and dash-prompt trimming keep original behavior", async () => {
  assert.equal(await readStdin(Readable.from(["Hello", " ", "会話\n"])), "Hello 会話\n");
  const tty = Object.assign(Readable.from([]), { isTTY: true });
  assert.equal(await resolveDashPrompt("  original prompt\t", tty), "  original prompt\t");
  assert.equal(await resolveDashPrompt(undefined, tty), undefined);
  assert.equal(await resolveDashPrompt("-", Readable.from([" \n相談本文\t"])), "相談本文");
});

test("TTY and empty pipe failures use Japanese diagnostics and preserve command examples", async () => {
  const tty = Object.assign(Readable.from([]), { isTTY: true });
  await assert.rejects(resolveDashPrompt("-", tty), {
    message: '"-p -" にはパイプ経由の入力が必要です。例: echo "prompt" | oracle -p -.',
  });
  for (const input of [[], [""], [" \n\t"]]) {
    await assert.rejects(resolveDashPrompt("-", Readable.from(input)), {
      message: '"-p -" の標準入力が空です。',
    });
  }
});

test("underlying stdin read failures propagate unchanged", async () => {
  const failure = new Error("original stream error");
  async function* broken() { throw failure; }
  await assert.rejects(resolveDashPrompt("-", Readable.from(broken())), (error) => error === failure);
});

test("real docs scanning returns unchanged results and a localized success summary", async (t) => {
  const root = await fixture(t);
  const body = "Documented: `--known`, `--help` and `--version`.\n";
  await fs.writeFile(path.join(root, "flags.md"), body);
  const result = await checkDocsFlags({ command: command("oracle", ["--known"]), cwd: root, paths: ["flags.md"] });
  assert.deepEqual(result, {
    checkedFiles: ["flags.md"], checkedFlags: ["--help", "--known", "--version"], issues: [],
  });
  const before = structuredClone(result);
  const lines = [];
  printDocsCheckResult(result, (line) => lines.push(line));
  assert.deepEqual(lines, ["ドキュメント・ヘルプ検証: 問題なし（フラグ 3 件、ファイル 1 件）"]);
  assert.deepEqual(result, before);
  assert.equal(await fs.readFile(path.join(root, "flags.md"), "utf8"), body);
});

test("drift output preserves paths, flags, ordering and English command/section matching data", async (t) => {
  const root = await fixture(t);
  await fs.writeFile(path.join(root, "a.md"), "Documented: `--known` and `--stale-flag`.\n");
  await fs.writeFile(path.join(root, "b.md"), "## Core consult flags\n`--json`\n## Examples\noracle status --json\n");
  const metadata = command("oracle", ["--known"], [
    command("doctor", ["--json"]), command("status", ["--hours <hours>"]),
  ]);
  const result = await checkDocsFlags({ command: metadata, cwd: root, paths: ["b.md", "a.md"] });
  assert.deepEqual(result, {
    checkedFiles: ["b.md", "a.md"], checkedFlags: ["--json", "--known", "--stale-flag"],
    issues: [
      { file: "a.md", flag: "--stale-flag", section: undefined, command: undefined },
      { file: "b.md", flag: "--json", section: "Core consult flags", command: undefined },
      { file: "b.md", flag: "--json", section: "Examples", command: "oracle status" },
    ],
  });
  const before = structuredClone(result);
  const lines = [];
  printDocsCheckResult(result, (line) => lines.push(line));
  assert.deepEqual(lines, [
    "ドキュメント・ヘルプの不一致:",
    "- a.md に --stale-flag の記載がありますが、CLI ヘルプには --stale-flag がありません",
    "- b.md (Core consult flags) に --json の記載がありますが、CLI ヘルプには --json がありません",
    "- b.md (Examples, oracle status) に --json の記載がありますが、CLI ヘルプには --json がありません",
  ]);
  assert.deepEqual(result, before);
});

test("missing explicit paths and empty default docs retain their failure conditions and raw arguments", async (t) => {
  const root = await fixture(t);
  const metadata = command("oracle");
  const missing = "資料 missing.md";
  await assert.rejects(checkDocsFlags({ command: metadata, cwd: root, paths: [missing] }), {
    message: `ドキュメント検証のパスが見つかりません: ${missing}`,
  });
  await assert.rejects(checkDocsFlags({ command: metadata, cwd: root }), {
    message: "検証対象のドキュメントがありません。リポジトリのルートから実行するか、--docs-path <file> を指定してください。",
  });
  await fs.writeFile(path.join(root, "README.md"), "Use `--help`.\n");
  assert.deepEqual(await checkDocsFlags({ command: metadata, cwd: root }), {
    checkedFiles: ["README.md"], checkedFlags: ["--help"], issues: [],
  });
});

test("flag extraction and negation/slash expansion remain stable", () => {
  const metadata = command("oracle", ["--[no-]background"], [command("session", ["--render"])]);
  assert.deepEqual(collectCommanderFlags(metadata), new Set([
    "--help", "--version", "--background", "--no-background", "--render",
  ]));
  assert.deepEqual(extractMarkdownFlags(
    "Use --remote-host/--remote-token and --browser-auto-reattach-delay/-interval/-timeout.",
  ), [
    "--browser-auto-reattach-delay", "--browser-auto-reattach-interval",
    "--browser-auto-reattach-timeout", "--remote-host", "--remote-token",
  ]);
});
