/** ZAKKO defaults and CDP boundary. DOM/model selector code stays upstream-owned. */
import path from "node:path";
import { DEFAULT_BROWSER_CONFIG as upstreamDefaults, resolveBrowserConfig as resolveUpstream } from "./config.upstream.js";
import { getOracleHomeDir } from "../oracleHome.js";
import { requireLoopback, requireLoopbackEndpoint, ZAKKO_DEFAULTS } from "../zakko/policy.js";
export * from "./config.upstream.js";

export const DEFAULT_BROWSER_CONFIG = {
  ...upstreamDefaults,
  cookieSync: false,
  manualLogin: true,
  manualLoginCookieSync: false,
  maxConcurrentTabs: ZAKKO_DEFAULTS.maxConcurrentRuns,
};

export function resolveBrowserConfig(config: Parameters<typeof resolveUpstream>[0] = {}): ReturnType<typeof resolveUpstream> {
  if (config?.remoteChrome) requireLoopback(config.remoteChrome.host);
  if (config?.remoteChromeBrowserWSEndpoint) requireLoopbackEndpoint(config.remoteChromeBrowserWSEndpoint);
  const attached = config?.attachRunning === true || Boolean(config?.remoteChrome) || Boolean(config?.remoteChromeBrowserWSEndpoint);
  return resolveUpstream({
    ...config,
    manualLogin: config?.manualLogin ?? !attached,
    manualLoginProfileDir: config?.manualLoginProfileDir ?? process.env.ORACLE_BROWSER_PROFILE_DIR ?? path.join(getOracleHomeDir(), "browser-profile"),
    cookieSync: config?.cookieSync ?? false,
    manualLoginCookieSync: config?.manualLoginCookieSync ?? false,
    maxConcurrentTabs: config?.maxConcurrentTabs ?? (process.env.ORACLE_BROWSER_MAX_CONCURRENT_TABS ? undefined : ZAKKO_DEFAULTS.maxConcurrentRuns),
  });
}
