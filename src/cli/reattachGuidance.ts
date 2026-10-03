import { jaBrowserReattachGuidance } from "../zakko/copy.js";

export function formatBrowserReattachGuidance(sessionId: string): string {
  return [
    jaBrowserReattachGuidance.introduction,
    `  oracle session ${sessionId} --render    # ${jaBrowserReattachGuidance.render}`,
    `  oracle session ${sessionId} --live      # ${jaBrowserReattachGuidance.live}`,
    `  oracle session ${sessionId} --harvest   # ${jaBrowserReattachGuidance.harvest}`,
  ].join("\n");
}
