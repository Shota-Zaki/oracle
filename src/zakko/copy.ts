/** Japanese presentation only. Never use these values for DOM/protocol matching. */
export const jaCliErrors = {
  operationFailed: (code: string): string => `操作に失敗しました（${code}）。`,
  unexpected: "予期しないエラーが発生しました。詳細を確認するには --verbose を付けて再試行してください。",
};

export const jaBrowserReattachGuidance = {
  introduction: "この実行は正常に応答を返しませんでしたが、まだ実行中の可能性があります。再接続:",
  render: "完了後の最終Markdownを表示",
  live: "完了まで出力を追跡",
  harvest: "現在の回答のスナップショットを取得",
};

export const jaSessionLifecycle = {
  session: "セッション",
  mode: "モード",
  models: "モデル",
  detach: "切り離し",
  reattach: "再接続",
  execution: {
    foreground: "フォアグラウンド",
    background: "バックグラウンド",
  },
  detachedPolling: "はい（ポーリング中）",
  detached: "はい",
  attached: "いいえ",
  modelCount: (count: number): string => count > 1 ? `${count}（並列）` : String(count || 1),
};

export const jaTitles: Record<string, string> = {
  "Usage:": "使い方:", "Options:": "オプション:", "Commands:": "コマンド:", "Arguments:": "引数:",
};
export const jaOptions: Record<string, string> = {
  "--help": "使い方を表示します。", "--version": "versionを表示します。",
  "--prompt": "相談内容を指定します。機密情報を含める前に送信範囲を確認してください。",
  "--file": "許可root配下の必要最小限のファイルまたはglobを指定します。",
  "--engine": "実行方式を指定します。常駐運用は browser を明示します。",
  "--model": "model IDを指定します。利用可能性と選択結果は実際の画面で確認します。",
  "--models": "APIで使用する複数のmodel IDを指定します。",
  "--files-report": "送信対象ファイルとtoken数のレポートを表示します。",
  "--dry-run": "送信せず、解決済み設定と入力対象を確認します。",
  "--browser-manual-login": "通常閲覧用とは別のOracle専用profileでログインします。",
  "--browser-manual-login-profile-dir": "専用manual-login profileの保存先を指定します。",
  "--browser-keep-browser": "処理後もChromeを保持します。不要なtabの増加に注意してください。",
  "--browser-cookie-sync": "明示的にCookie同期を使用します。標準運用はOFFです。",
  "--browser-model-strategy": "画面上のmodel選択方式を指定します。",
  "--browser-thinking-time": "対応するmodelの思考時間を指定します。",
  "--browser-timeout": "Browser実行の待機時間を指定します。timeout後は既存sessionを確認します。",
  "--host": "serviceの待受先です。127.0.0.1 を明示してください。",
  "--port": "serviceの待受portを指定します。",
  "--remote-host": "認証済みtransportのloopback接続先を指定します。",
  "--max-concurrent-runs": "Browser同時実行数です。標準3、上限3です。",
  "--max-queued-runs": "待機数です。標準8、上限8です。",
  "--verbose": "詳細な診断を表示します。秘密情報の値は共有しないでください。",
  "--slug": "後で確認しやすいsession名を指定します。",
  "--force": "既存の重複検査に影響します。timeoutの復旧にはsessionを再接続してください。",
  "--wait": "既存実行の完了を待ちます。", "--hours": "対象期間を時間で指定します。",
  "--limit": "表示件数の上限を指定します。", "--render": "Markdownを読みやすく表示します。",
};
export const jaCommands: Record<string, string> = {
  serve: "Oracle専用Browser serviceをloopbackで起動します。",
  session: "session IDから状態・回答・復旧情報を確認します。",
  sessions: "保存済みsessionを確認します。", status: "実行状況を確認します。",
  doctor: "実行環境を診断します。", bridge: "認証済みtransportの接続を管理します。",
};
export function recoveryGuidance(id: string): string {
  return `同じpromptを再送せず、oracle session ${id} で状態と回収可能な回答を確認してください。`;
}
export function translateServiceMessage(message: string): string {
  if (/^Access token:/.test(message)) return "接続tokenは設定済みです。値は表示しません。";
  if (message.startsWith("Listening at ")) return message.replace("Listening at ", "待受先: ");
  if (message === "Leave this terminal running; press Ctrl+C to stop oracle serve.") return "oracle serveを実行中です。停止はCtrl+Cです。";
  return message.replace("[serve] Health check /status", "[serve] 稼働確認 /status")
    .replace(/\[serve\] Waiting for a browser slot \(position (\d+); (\d+) active\)\./, "[serve] 待機中（順番 $1、実行中 $2）");
}
