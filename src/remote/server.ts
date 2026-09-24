/** ZAKKO service entry boundary. The original implementation is retained unchanged. */
import path from "node:path";
import { isMainThread } from "node:worker_threads";
import { randomBytes } from "node:crypto";
import { createRemoteServer as createUpstream, serveRemote as serveUpstream, type RemoteServerOptions } from "./server.upstream.js";
import { getOracleHomeDir } from "../oracleHome.js";
import { PolicyError, requireCapacity, requireLoopback, redactText, ZAKKO_DEFAULTS } from "../zakko/policy.js";
import { ensurePrivateDirectory } from "../zakko/privateStorage.js";
import { resolveServiceToken } from "../zakko/token.js";
import { translateServiceMessage } from "../zakko/copy.js";
export * from "./server.upstream.js";

async function resolvePolicy(options: RemoteServerOptions): Promise<RemoteServerOptions> {
  const host = requireLoopback(options.host ?? ZAKKO_DEFAULTS.host);
  if (options.browserConfig?.remoteChrome) requireLoopback(options.browserConfig.remoteChrome.host);
  const home = getOracleHomeDir();
  await ensurePrivateDirectory(home);
  const profile = options.manualLoginProfileDir ?? path.join(home, "browser-profile");
  await ensurePrivateDirectory(profile);
  // Only tightens the process mask. Existing unrelated files/credentials are untouched.
  if (process.platform !== "win32" && isMainThread) process.umask(process.umask() | 0o077);
  const token = await resolveServiceToken(
    options.token ?? process.env.ORACLE_REMOTE_TOKEN ?? (process.env.ORACLE_REMOTE_TOKEN_FILE ? undefined : randomBytes(32).toString("hex")),
    process.env.ORACLE_REMOTE_TOKEN_FILE,
  );
  const output = options.logger ?? console.log;
  return {
    ...options,
    host,
    token,
    maxConcurrentRuns: requireCapacity(options.maxConcurrentRuns ?? ZAKKO_DEFAULTS.maxConcurrentRuns, 1, 3, "maxConcurrentRuns"),
    maxQueuedRuns: requireCapacity(options.maxQueuedRuns ?? ZAKKO_DEFAULTS.maxQueuedRuns, 0, 8, "maxQueuedRuns"),
    manualLoginDefault: options.manualLoginDefault ?? true,
    manualLoginProfileDir: profile,
    cookieSyncDefault: options.cookieSyncDefault ?? false,
    logger: (message) => output(translateServiceMessage(redactText(message, [token]))),
  };
}

export async function createRemoteServer(...args: Parameters<typeof createUpstream>): ReturnType<typeof createUpstream> {
  return createUpstream(await resolvePolicy(args[0] ?? {}), args[1]);
}

export async function serveRemote(options: RemoteServerOptions = {}): Promise<void> {
  if (!options.token && !process.env.ORACLE_REMOTE_TOKEN && !process.env.ORACLE_REMOTE_TOKEN_FILE) {
    throw new PolicyError("ORA_TOKEN_REQUIRED", "ORACLE_REMOTE_TOKEN または owner-only の ORACLE_REMOTE_TOKEN_FILE を設定してください。token値は表示しません。");
  }
  await serveUpstream(await resolvePolicy(options));
}
