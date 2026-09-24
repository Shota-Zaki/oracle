/** ZAKKO extension: fail-closed outbound text-file admission. */
import fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { PolicyError, ZAKKO_DEFAULTS } from "./policy.js";

const sensitiveName = /^(?:\.env(?:.*)?|\.npmrc|\.netrc|auth\.json|id_(?:rsa|dsa|ecdsa|ed25519)(?:\..*)?|cookies(?:[-.].*)?|login data(?:-journal)?|web data(?:-journal)?|credentials?(?:[._-].*)?|.*\.(?:key|pem|p12|pfx|keychain(?:-db)?))$/i;
const sensitiveDirectory = /^(?:\.ssh|\.aws|\.gnupg|\.kube|\.git|\.oracle(?:[-_].*)?|browser-profile)$/i;

export function requireContainedFile(filePath: string, root: string): string {
  const absolute = path.resolve(root, filePath);
  const relative = path.relative(path.resolve(root), absolute);
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new PolicyError("ORA_FILE_OUTSIDE_ROOT", "添付対象を許可root配下へ整理してください。");
  }
  const components = relative.split(path.sep);
  if (components.some((part) => sensitiveDirectory.test(part)) || sensitiveName.test(path.basename(absolute))) {
    throw new PolicyError("ORA_SECRET_FILE", "認証情報を含む可能性があるファイルは添付対象から除外してください。");
  }
  return absolute;
}

/** High-confidence detections, not a proof that arbitrary data contains no secrets. */
export function scanSecretText(content: string): void {
  const patterns = [
    /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/,
    /\b(?:sk-(?:proj-|ant-)?[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16})\b/,
    /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{16,}/i,
    /\b[a-z][a-z0-9+.-]*:\/\/[^\s/@]+:[^\s/@]+@/i,
    /(?:^|\n)\s*(?:set-cookie|cookie)\s*:\s*[^\r\n]{8,}/i,
    /(?:api[_-]?key|access[_-]?token|session[_-]?token|remote[_-]?token|password|client[_-]?secret)\s*[=:]\s*["']?[A-Za-z0-9_+/.=-]{20,}/i,
  ];
  if (patterns.some((pattern) => pattern.test(content))) {
    throw new PolicyError("ORA_SECRET_CONTENT", "秘密情報の候補を検出しました。redactした入力を作成し、file reportを再確認してください。");
  }
}

export async function readAdmittedFile(filePath: string, root: string, limit: number = ZAKKO_DEFAULTS.maxFileBytes): Promise<string> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > ZAKKO_DEFAULTS.maxBundleBytes) {
    throw new PolicyError("ORA_FILE_SIZE", "添付ファイルの上限サイズを確認してください。");
  }
  const absolute = requireContainedFile(filePath, root);
  const canonicalRoot = await fs.realpath(root);
  let component = path.resolve(root);
  const components = path.relative(component, absolute).split(path.sep);
  for (const part of components) {
    component = path.join(component, part);
    if ((await fs.lstat(component)).isSymbolicLink()) {
      throw new PolicyError("ORA_FILE_SYMLINK", "添付にはsymlinkではなく許可root内の通常ファイルを使用してください。");
    }
  }
  const canonical = await fs.realpath(absolute);
  requireContainedFile(canonical, canonicalRoot);
  const handle = await fs.open(absolute, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.nlink !== 1 || before.size > limit) {
      throw new PolicyError("ORA_FILE_SIZE_OR_TYPE", "添付には上限サイズ以内の通常ファイルを使用してください。hard linkも対象外です。");
    }
    // A bounded read also covers a file growing after stat; never read it unbounded.
    const buffer = Buffer.alloc(limit + 1);
    let total = 0;
    while (total < buffer.length) {
      const { bytesRead } = await handle.read(buffer, total, buffer.length - total, total);
      if (!bytesRead) break;
      total += bytesRead;
    }
    const after = await handle.stat();
    const current = await fs.stat(absolute);
    if (total > limit || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs || current.ino !== before.ino || current.dev !== before.dev || await fs.realpath(absolute) !== canonical) {
      throw new PolicyError("ORA_FILE_CHANGED", "確認中に添付ファイルが変更されました。変更を止めて再確認してください。");
    }
    const content = buffer.subarray(0, total).toString("utf8");
    scanSecretText(content);
    return content;
  } finally { await handle.close(); }
}

export function assertBundleBounds(files: readonly { content: string }[]): void {
  if (files.length > ZAKKO_DEFAULTS.maxFiles || files.reduce((sum, file) => sum + Buffer.byteLength(file.content), 0) > ZAKKO_DEFAULTS.maxBundleBytes) {
    throw new PolicyError("ORA_BUNDLE_SIZE", "添付は128ファイル・合計8 MiB以内に絞ってください。token数はfile reportでも確認してください。");
  }
}
