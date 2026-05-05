# Touring Mania Deployment & Bug Fix Plan

## 現在のステータス
* Cloudflare Pages & Workers, D1へのデプロイを構築中
* 本番環境 (`https://touring-mania-vite.pages.dev/`) にて、カードプレイ時に React Error #185 (Maximum update depth exceeded) が発生する致命的なバグが存在した。

## 今回の実装内容とバグ修正 (Error 185)
1. **ToastProvider の無限ループ（再レンダリング）の修正**
   * **原因**: `ToastContext.tsx` 内で提供されている関数 (`addToast`, `removeToast`, `clearToasts`) がメモ化されておらず、`ToastProvider` が再レンダリングされる度に新しい参照が生成されていた。これが、`useToast` を依存配列に含む各コンポーネント（例: `GameBoard.tsx` の `useEffect`）で意図しない無限再レンダリングや状態更新ループのトリガーになっていた可能性が高い。
   * **対策**: 全てのContext提供関数を `React.useCallback` でラップし、`value` オブジェクトを `React.useMemo` でメモ化した。
2. **CardPlayPhase における addToast の ReferenceError 修正**
   * **原因**: バリデーションエラー発生時に `addToast('error', ...)` を呼び出していたが、コンポーネント内で `useToast` フックがインポート・宣言されておらず、JavaScriptの実行時エラー (`ReferenceError`) が裏で発生していた。
   * **対策**: `import { useToast } from "@/components/Toast";` を追加し、コンポーネント内で `const { addToast } = useToast();` を宣言して正しく呼び出せるように修正した。
3. **対戦相手の手札（カテゴリ内訳）UIの実装**
   * `GameBoard.tsx` に、大型・中型・小型バイクの所持枚数を表示するUIを追加した。

## 次のフェーズのタスク (フェーズ15以降)
ユーザーの指示の通り、ゲーム体験の完成を最優先としています。
以下の順序で進める予定です。
1. **ゲーム機能のテストとUIの洗練**
   * エラーが完全に解消されたかを確認するため、本番環境で実際にゲームを数ラウンドプレイする。
   * 勝敗判定（`gamePhase === 'finished'`）時の `GameResultScreen` が正しく表示されるか確認する。
2. **OAuthログイン機能の実装（フェーズ15）**
   * 上記のゲーム体験の安定が確認でき次第、認証システムの統合に入る。
3. **R2連携設定**
   * メディアや画像の保存のためのCloudflare R2との連携。

## 引き継ぎ・第三者向けの特記事項
* `CardPlayPhase.tsx` 内での状態管理（特に `selectedCards` や `showBindDialog`）は安定していますが、UI操作が早い場合のRace Conditionを防ぐため、`isLoading` プロパティを上位から正しく渡す（現状はデフォルト `false`）ことが将来的な課題です。
* ローカル環境で `wrangler dev` を実行する際は、WindowsのExecutionPolicy制限に引っかかる場合があるため、`powershell -ExecutionPolicy Bypass -Command "npm run dev"` での起動を推奨します。
