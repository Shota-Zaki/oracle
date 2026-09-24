/** Read-only retention/capacity planning. No implicit removal of recovery data. */
import fs from "node:fs/promises";
import path from "node:path";
import { PolicyError, ZAKKO_DEFAULTS } from "./policy.js";

export async function measureDirectory(root: string, maxEntries = 100_000): Promise<{ bytes: number; entries: number }> {
  const rootStat = await fs.lstat(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new PolicyError("ORA_STORAGE_PATH", "容量確認には通常のdirectoryを指定してください。");
  let bytes = 0;
  let entries = 0;
  async function walk(directory: string): Promise<void> {
    const handle = await fs.opendir(directory);
    for await (const item of handle) {
      if (++entries > maxEntries) throw new PolicyError("ORA_STORAGE_SCAN_LIMIT", "容量確認の上限件数に達しました。運用データを確認してください。");
      const target = path.join(directory, item.name);
      const info = await fs.lstat(target);
      if (info.isSymbolicLink()) continue;
      if (info.isDirectory()) await walk(target);
      else if (info.isFile()) bytes += info.size;
    }
  }
  await walk(root);
  return { bytes, entries };
}

export function classifySession(metadata: Record<string, unknown>, now = Date.now(), retentionDays: number = ZAKKO_DEFAULTS.retentionDays): "keep" | "prune-candidate" | "recovery" {
  if (!Number.isSafeInteger(retentionDays) || retentionDays < 1 || !Number.isFinite(now)) throw new PolicyError("ORA_RETENTION_INVALID", "retention日数と基準時刻を確認してください。");
  if (metadata.status !== "completed") return "recovery";
  if (metadata.pinned === true) return "keep";
  const completed = typeof metadata.completedAt === "string" ? Date.parse(metadata.completedAt) : Number.NaN;
  const browser = metadata.browser as { harvest?: { state?: string } } | undefined;
  if (browser?.harvest?.state && browser.harvest.state !== "completed") return "recovery";
  if (!Number.isFinite(completed) || completed > now) return "keep";
  return now - completed > retentionDays * 86_400_000 ? "prune-candidate" : "keep";
}

export async function retentionReport(home: string, now = Date.now()): Promise<{ id: string; disposition: string }[]> {
  const sessions = path.join(home, "sessions");
  let entries;
  try { entries = await fs.readdir(sessions, { withFileTypes: true }); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  if (entries.length > 10000) throw new PolicyError("ORA_STORAGE_SCAN_LIMIT", "session件数を確認してください。");
  const report = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    const file = path.join(sessions, entry.name, "meta.json");
    try {
      const info = await fs.lstat(file);
      if (!info.isFile() || info.isSymbolicLink() || info.size > 1024 * 1024) throw new Error("invalid metadata");
      const metadata = JSON.parse(await fs.readFile(file, "utf8")) as Record<string, unknown>;
      report.push({ id: entry.name, disposition: classifySession(metadata, now) });
    } catch { report.push({ id: entry.name, disposition: "recovery" }); }
  }
  return report.sort((a, b) => a.id.localeCompare(b.id));
}
