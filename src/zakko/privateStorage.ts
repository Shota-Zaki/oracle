/** ZAKKO extension: owner-only storage. No recursive chmod of unrelated data. */
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { PolicyError } from "./policy.js";

export async function ensurePrivateDirectory(directory: string): Promise<void> {
  const absolute = path.resolve(directory);
  let cursor = path.parse(absolute).root;
  for (const component of absolute.slice(cursor.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    try { await fs.mkdir(cursor, { mode: 0o700 }); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    const info = await fs.lstat(cursor);
    if (info.isSymbolicLink() || !info.isDirectory()) {
      throw new PolicyError("ORA_STORAGE_PATH", "保存先にはsymlinkを経由しない専用directoryを指定してください。");
    }
  }
  const info = await fs.lstat(absolute);
  if (process.getuid && info.uid !== process.getuid()) throw new PolicyError("ORA_STORAGE_OWNER", "保存先の所有者を確認してください。");
  if (process.platform !== "win32") await fs.chmod(absolute, 0o700);
}

/** Atomic same-directory write, private temporary file, data fsync before rename. */
export async function writePrivateJson(file: string, value: unknown): Promise<void> {
  await ensurePrivateDirectory(path.dirname(file));
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    const handle = await fs.open(temporary, "wx", 0o600);
    try {
      await handle.writeFile(`${JSON.stringify(value)}\n`, "utf8");
      await handle.sync();
    } finally { await handle.close(); }
    await fs.rename(temporary, file);
    if (process.platform !== "win32") {
      const directory = await fs.open(path.dirname(file), "r");
      try { await directory.sync(); } finally { await directory.close(); }
    }
  } finally { await fs.rm(temporary, { force: true }); }
}

export async function requirePrivateFile(file: string): Promise<void> {
  const info = await fs.lstat(file);
  if (info.isSymbolicLink() || !info.isFile() || info.nlink !== 1 || (process.getuid && info.uid !== process.getuid()) || (process.platform !== "win32" && (info.mode & 0o077) !== 0)) {
    throw new PolicyError("ORA_STORAGE_FILE", "保存ファイルの所有者・permission・形式を確認してください。");
  }
}
