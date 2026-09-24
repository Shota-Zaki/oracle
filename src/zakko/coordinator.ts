import { readIntent, reserveIntent, linkIntentSession, type Intent } from "./intentStore.js";
import { PolicyError } from "./policy.js";

export interface AdvisoryJob {
  createSession(): Promise<string>;
  run(sessionId: string): Promise<void>;
  failed(sessionId: string, error: unknown): Promise<void>;
}

/** One MCP process has at most 11 outstanding jobs; the shared service owns the 3/8 queue. */
export class AdvisoryCoordinator {
  private pending = 0;
  get pendingCount(): number { return this.pending; }

  async submit(home: string, requestId: string, job: AdvisoryJob): Promise<{ reused: boolean; intent: Intent }> {
    try { return { reused: true, intent: await readIntent(home, requestId) }; } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    if (this.pending >= 11) throw new PolicyError("ORA_QUEUE_FULL", "処理中・待機中の依頼が上限に達しています。既存sessionを確認してください。");
    this.pending++;
    let handedOff = false;
    try {
      const reservation = await reserveIntent(home, requestId);
      if (!reservation.created) return { reused: true, intent: reservation.intent };
      const sessionId = await job.createSession();
      const intent = await linkIntentSession(home, requestId, sessionId);
      // Persist the session binding BEFORE dispatch, even if the response transport disappears.
      handedOff = true;
      void Promise.resolve().then(() => job.run(sessionId)).catch((error) => job.failed(sessionId, error)).catch(() => {}).finally(() => { this.pending--; });
      return { reused: false, intent };
    } finally {
      if (!handedOff) this.pending--;
    }
  }
}
