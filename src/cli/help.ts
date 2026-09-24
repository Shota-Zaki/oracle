import type { Command } from "commander";
import kleur from "kleur";
import { jaTitles, jaOptions, jaCommands } from "../zakko/copy.js";

/** Presentation adapter: option flags, arguments, model IDs and DOM text are untouched. */
export function applyHelpStyling(program: Command, version: string, isTty: boolean): void {
  const title = (value: string) => isTty ? kleur.bold().cyan(value) : value;
  program.configureHelp({
    styleTitle(value) { return title(jaTitles[value] ?? value); },
    optionDescription(option) { return jaOptions[option.long ?? option.short ?? ""] ?? option.description; },
    subcommandDescription(command) { return jaCommands[command.name()] ?? command.description(); },
  });
  program.addHelpText("beforeAll", () => `${title(`🧿 Oracle CLI v${version}`)} — コードと資料を添えて第二モデルへ相談します。\n`);
  program.addHelpText("after", () => `
${title("送信前の確認")}
必要最小限の --file を選び、--dry-run summary --files-report で対象とtoken数を確認します。
秘密情報候補・許可root外・symlink・過大な入力は検査対象です。検査は秘密情報がないことの完全な証明ではありません。
通常閲覧用とは別のmanual-login profileを使用し、Cookie同期はOFFを標準とします。

${title("継続運用と復旧")}
oracle serve --host 127.0.0.1 --max-concurrent-runs 3 --max-queued-runs 8
接続tokenは環境設定またはowner-onlyのORACLE_REMOTE_TOKEN_FILEから渡します。
timeout後は同じpromptを再送せず、oracle status と oracle session <sessionId> で確認します。
MCPの consult_safe はrequestIdを保存し、既存依頼の再受付を抑止します。回答は助言として通常のtest/buildで検証します。

${title("例")}
  ${program.name()} --engine browser --dry-run summary --files-report --prompt "設計をレビューしてください" --file src/example.ts
  ${program.name()} status --hours 72 --limit 50
  ${program.name()} session <sessionId>

日本語の運用手順: README.ja.md / docs/zakko/OPERATIONS.md
`);
}
