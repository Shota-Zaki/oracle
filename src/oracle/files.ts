/** ZAKKO admission boundary; the upstream collector is retained byte-for-byte. */
import fs from "node:fs/promises";
import { readFiles as collectFiles, DEFAULT_MAX_FILE_SIZE_BYTES } from "./files.upstream.js";
import { readAdmittedFile, requireContainedFile, scanSecretText, assertBundleBounds } from "../zakko/fileAdmission.js";
import { PolicyError, ZAKKO_DEFAULTS } from "../zakko/policy.js";
export * from "./files.upstream.js";

export async function readFiles(...args: Parameters<typeof collectFiles>): ReturnType<typeof collectFiles> {
  const [filePaths, options = {}] = args;
  if (!filePaths || filePaths.length === 0) return [];
  const cwd = options.cwd ?? process.cwd();
  if (filePaths.length > ZAKKO_DEFAULTS.maxFiles) throw new PolicyError("ORA_BUNDLE_SIZE", "入力パターンを128件以内に絞ってください。");
  const adapter = options.fsModule;
  const native = !adapter || (adapter as unknown as Record<string, unknown>).__nativeFs === true || (adapter.readFile === fs.readFile && adapter.stat === fs.stat && adapter.readdir === fs.readdir);
  // Custom filesystem adapters are retained for isolated tests; validate their bytes as well.
  const files = await collectFiles(filePaths, { ...options, readContents: !native });
  if (files.length > ZAKKO_DEFAULTS.maxFiles) throw new PolicyError("ORA_BUNDLE_SIZE", "添付対象を128ファイル以内に絞ってください。");
  const admitted = [];
  for (const file of files) {
    requireContainedFile(file.path, cwd);
    const content = !native ? file.content : await readAdmittedFile(file.path, cwd, options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES);
    scanSecretText(content);
    admitted.push({ path: file.path, content });
    assertBundleBounds(admitted);
  }
  assertBundleBounds(admitted);
  return options.readContents === false ? admitted.map((file) => ({ ...file, content: "" })) : admitted;
}
