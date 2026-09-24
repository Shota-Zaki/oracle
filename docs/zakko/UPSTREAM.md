# upstream追従

## 固定基点

upstream/main / fork main / fork work開始: 74fe3ac8f896dfac17e7ba904e05f5df5adafa78。version0.21.2。root tree: 5c43fcf93396ec937b6f0b0068ea0ee9e02d2deb。

元実装を以下へ内容変更なしで保持する。

| path | 元blob SHA |
|---|---|
| src/remote/server.upstream.ts | 79d4e6651157180c4f4fa030fd72772a41fdecfd |
| src/browser/config.upstream.ts | 1055fae8a3c42b5494d8afcab3ca886485caca77 |
| src/oracle/files.upstream.ts | e129654831cec7a1802066bb636b6afc441a80cd |

公開import pathは薄いadapterとして残す。同一directoryに移すことで既存relative importを保つ。原実装の内部self-callは原実装内に留まるため、serveRemoteにもoptions policyを渡す。adapterのexport overrideと内部callはintegration testの対象にする。

## 更新手順

作業treeとbranchを確認し、upstream/mainを取得する。incoming差分と移動先*.upstream.tsの対応を確認してrename-aware mergeを行う。元pathにadapterがあるため、機械的な全ファイル上書きでは取り込まない。

upstream側で修正済みの項目は重複実装せず、policy layerの責務を見直す。lockfile更新は意図した依存差分として監査する。full test/build/packed/MCPが通った後にworkのEvidenceを更新する。main公開は別の明示指示と受入に基づく。

初回のGitHub Git data API反映では移動先のblob SHA一致をreadbackする。単なるcopy layer追加を全互換性検証済みとは扱わない。
