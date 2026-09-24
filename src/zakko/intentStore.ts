/** Persistent fail-closed request IDs. A crash never grants permission to resend. */
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { PolicyError } from "./policy.js";
import { ensurePrivateDirectory, requirePrivateFile, writePrivateJson } from "./privateStorage.js";

export interface Intent { version: 1; requestId: string; sessionId?: string; state: "reserved" | "submitted" | "completed" | "recovery-required"; updatedAt: string; }

function intentDirectory(home: string, requestId: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{7,127}$/.test(requestId)) throw new PolicyError("ORA_REQUEST_ID", "requestIdは8〜128文字の英数字・._-で指定してください。");
  return path.join(home, "zakko", "intents", createHash("sha256").update(requestId).digest("hex"));
}

export async function reserveIntent(home: string, requestId: string): Promise<{ created: boolean; intent: Intent }> {
  const directory = intentDirectory(home, requestId);
  await ensurePrivateDirectory(path.dirname(directory));
  try { await fs.mkdir(directory, { mode: 0o700 }); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    return { created: false, intent: await readIntent(home, requestId) };
  }
  const intent: Intent = { version: 1, requestId, state: "reserved", updatedAt: new Date().toISOString() };
  await writePrivateJson(path.join(directory, "intent.json"), intent);
  return { created: true, intent };
}

export async function readIntent(home: string, requestId: string): Promise<Intent> {
  const directory = intentDirectory(home, requestId);
  const info = await fs.lstat(directory);
  if (info.isSymbolicLink() || !info.isDirectory()) throw new PolicyError("ORA_INTENT_STORAGE", "request記録を安全に読み取れません。");
  try {
    const file = path.join(directory, "intent.json");
    await requirePrivateFile(file);
    const value = JSON.parse(await fs.readFile(file, "utf8")) as Intent;
    if (value.version !== 1 || value.requestId !== requestId || !["reserved", "submitted", "completed", "recovery-required"].includes(value.state) || (value.sessionId !== undefined && !/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(value.sessionId))) throw new Error("invalid intent");
    const bindingFile = path.join(directory, "session.json");
    try {
      await requirePrivateFile(bindingFile);
      const binding = JSON.parse(await fs.readFile(bindingFile, "utf8")) as { sessionId: string };
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(binding.sessionId)) throw new Error("invalid binding");
      return { ...value, sessionId: binding.sessionId, state: "submitted" };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    return value;
  } catch {
    // mkdir won but the writer may have crashed, or may still be writing.
    return { version: 1, requestId, state: "recovery-required", updatedAt: new Date().toISOString() };
  }
}

export async function linkIntentSession(home: string, requestId: string, sessionId: string): Promise<Intent> {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(sessionId)) throw new PolicyError("ORA_SESSION_ID", "session IDの形式を確認してください。");
  await readIntent(home, requestId);
  const file = path.join(intentDirectory(home, requestId), "session.json");
  let handle;
  try { handle = await fs.open(file, "wx", 0o600); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const existing = await readIntent(home, requestId);
    if (existing.sessionId !== sessionId) throw new PolicyError("ORA_SESSION_CONFLICT", "同じrequestIdには既存session IDを使用してください。書き込み途中も再送せず確認します。");
    return existing;
  }
  try { await handle.writeFile(JSON.stringify({ sessionId }), "utf8"); await handle.sync(); }
  finally { await handle.close(); }
  if (process.platform !== "win32") {
    const directory = await fs.open(path.dirname(file), "r");
    try { await directory.sync(); } finally { await directory.close(); }
  }
  return readIntent(home, requestId);
}
