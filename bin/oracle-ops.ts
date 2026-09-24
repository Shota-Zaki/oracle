#!/usr/bin/env node
/** Read-only operations entry; no login, secret creation, deletion or OS reconfiguration. */
import { getOracleHomeDir } from "../src/oracleHome.js";
import { measureDirectory, retentionReport } from "../src/zakko/maintenance.js";
import { PolicyError } from "../src/zakko/policy.js";

const command = process.argv[2] ?? "help";
if (command === "help" || command === "--help") {
  console.log("🧿 Oracle運用確認\n\nnode dist/bin/oracle-ops.js report\n\n容量・7日retention候補・復旧対象を確認します。削除は行いません。接続tokenやpromptは表示しません。");
} else if (command === "report") {
  try {
    const home = getOracleHomeDir();
    const usage = await measureDirectory(home);
    const sessions = await retentionReport(home);
    console.log(JSON.stringify({ usage, retentionDays: 7, sessions, deletionPerformed: false }, null, 2));
  } catch (error) {
    console.error(error instanceof PolicyError ? error.message : "保存先を確認できませんでした。専用ORACLE_HOME_DIRの状態を確認してください。");
    process.exitCode = 1;
  }
} else {
  console.error("利用可能なコマンドは help / report です。");
  process.exitCode = 2;
}
