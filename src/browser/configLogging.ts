import { redactDiagnostic } from "../zakko/policy.js";

export function redactBrowserConfigForDebugLog(config: Record<string, unknown>): Record<string, unknown> {
  const redacted = redactDiagnostic(config) as Record<string, unknown>;
  if (Array.isArray(config.inlineCookies)) {
    redacted.inlineCookies = `[redacted:${config.inlineCookies.length} cookies]`;
    redacted.inlineCookieCount = config.inlineCookies.length;
  }
  return redacted;
}
