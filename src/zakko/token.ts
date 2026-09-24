import fs from "node:fs/promises";
import { constants } from "node:fs";
import { PolicyError } from "./policy.js";

/** Read an existing secret, never create/rotate or print credentials. */
export async function resolveServiceToken(value?: string, file?: string): Promise<string> {
  let token = value;
  if (!token && file) {
    const handle = await fs.open(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    try {
      const info = await handle.stat();
      if (!info.isFile() || info.nlink !== 1 || info.size > 4096 || (process.getuid && info.uid !== process.getuid()) || (process.platform !== "win32" && (info.mode & 0o077) !== 0)) {
        throw new PolicyError("ORA_TOKEN_FILE", "tokenファイルの所有者・permission・サイズを確認してください。");
      }
      const buffer = Buffer.alloc(4097);
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
      if (bytesRead > 4096) throw new PolicyError("ORA_TOKEN_FILE", "tokenファイルのサイズを確認してください。");
      token = buffer.subarray(0, bytesRead).toString("utf8").trim();
    } finally { await handle.close(); }
  }
  if (!token || token.length < 32 || token.length > 4096 || /\s/.test(token)) {
    throw new PolicyError("ORA_TOKEN_REQUIRED", "ORACLE_REMOTE_TOKEN または owner-only の ORACLE_REMOTE_TOKEN_FILE に32文字以上のtokenを設定してください。値は表示しません。");
  }
  return token;
}
