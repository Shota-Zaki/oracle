/** ZAKKO extension: host policy and safe, Japanese user-facing guidance. */
import { isIP } from "node:net";

export const ZAKKO_DEFAULTS = Object.freeze({
  host: "127.0.0.1",
  maxConcurrentRuns: 3,
  maxQueuedRuns: 8,
  retentionDays: 7,
  maxFileBytes: 1024 * 1024,
  maxBundleBytes: 8 * 1024 * 1024,
  maxFiles: 128,
});

export class PolicyError extends Error {
  constructor(public readonly code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "PolicyError";
  }
}

/** Literal loopback addresses only: no DNS, wildcard, LAN or rebinding ambiguity. */
export function requireLoopback(host: string = ZAKKO_DEFAULTS.host): string {
  const value = host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
  if (value === "::1" || (isIP(value) === 4 && value.split(".")[0] === "127")) return value;
  throw new PolicyError("ORA_LOOPBACK_REQUIRED", "接続先には 127.0.0.1 または ::1 を指定してください。別Hostからは認証済みtransportを使用します。");
}

export function requireLoopbackEndpoint(endpoint: string): void {
  let url: URL;
  try { url = new URL(endpoint); } catch {
    throw new PolicyError("ORA_INVALID_ENDPOINT", "接続先URLの形式を確認してください。");
  }
  if (!["http:", "https:", "ws:", "wss:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new PolicyError("ORA_INVALID_ENDPOINT", "接続先は認証情報・query・fragmentを含まないloopback URLにしてください。");
  }
  requireLoopback(url.hostname);
}

export function requireCapacity(value: number, minimum: number, maximum: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new PolicyError("ORA_CAPACITY_INVALID", `${name} は ${minimum}〜${maximum} の整数で指定してください。`);
  }
  return value;
}

export function redactText(text: string, secrets: readonly string[] = []): string {
  let result = text;
  for (const secret of secrets) if (secret) result = result.split(secret).join("[redacted]");
  return result
    .replace(/\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi, "[redacted authorization]")
    .replace(/\b(?:sk-(?:proj-|ant-)?[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{12,}|github_pat_[A-Za-z0-9_]{12,})\b/g, "[redacted token]")
    .replace(/([a-z][a-z0-9+.-]*:\/\/)[^\s/@]+:[^\s/@]+@/gi, "$1[redacted]@")
    .replace(/((?:[?&]|\b)(?:access_token|api[_-]?key|password|secret|remoteToken|session[_-]?token|token)\s*[=:]\s*)[^\s&;,]+/gi, "$1[redacted]")
    .replace(/((?:set-cookie|cookie)\s*:\s*)[^\r\n]*/gi, "$1[redacted]");
}

/** Diagnostic data only. Never apply this to model answers, DOM labels or protocol IDs. */
export function redactDiagnostic(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[redacted:depth]";
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map((entry) => redactDiagnostic(entry, depth + 1));
  if (!value || typeof value !== "object") return value;
  const result: Record<string, unknown> = Object.create(null);
  for (const [key, entry] of Object.entries(value)) {
    result[key] = /(?:cookie|token|password|secret|authorization|api.?key|credential)/i.test(key)
      ? "[redacted]" : redactDiagnostic(entry, depth + 1);
  }
  return result;
}
