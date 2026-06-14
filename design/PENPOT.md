# Penpot 連携セットアップ

Touring Mania のデザイン（Penpot）とソースコード（Cursor）を双方向で連携する手順です。

## 概要

| 方向 | できること |
|------|-----------|
| デザイン → コード | Penpot の画面・コンポーネントから React/Tailwind 実装を生成・更新 |
| コード → デザイン | 既存コードの構造・スタイルを Penpot ファイルに反映 |

連携は公式の **Penpot MCP Server** 経由で行います。

---

## 方式の選び方

| | Remote（推奨） | Local |
|---|----------------|-------|
| セットアップ | 簡単 | ターミナルでサーバー起動が必要 |
| 認証 | MCP キー | ブラウザの Penpot セッション |
| ローカルファイル | 不可 | アセットの読み書き可 |
| 設定 | `.cursor/mcp.json`（済） | URL を `http://localhost:4401/mcp` に変更 |

本リポジトリは **Remote 方式** をデフォルト設定済みです。

---

## Remote 方式（推奨）

### 1. Penpot で MCP を有効化

1. [design.penpot.app](https://design.penpot.app) にログイン
2. **Your account → Integrations → MCP Server** を開く
3. Status を **Enabled** にする
4. **MCP key** を生成（一度だけ表示されるので安全な場所に保存）
5. 表示された JSON 設定の URL を確認（`userToken=` 付き）

### 2. MCP キーを環境変数に設定（Windows）

PowerShell（ユーザー環境変数として永続化）:

```powershell
[System.Environment]::SetEnvironmentVariable('PENPOT_MCP_KEY', 'ここにMCPキーを貼り付け', 'User')
```

設定後、**Cursor を再起動**してください。

### 3. Cursor で MCP を確認

1. **Cursor Settings → Tools & MCP** を開く
2. `penpot` サーバーが表示され、ツールが読み込まれていることを確認
3. 接続エラー時は `PENPOT_MCP_KEY` が正しく設定されているか確認

プロジェクトの MCP 設定: `.cursor/mcp.json`

### 4. Penpot でファイルを接続

1. Penpot で Touring Mania 用のデザインファイルを開く
2. **File → MCP Server → Connect** をクリック
3. プラグインウィンドウを開いたままにする（接続中は閉じない）

> MCP は **1 つのブラウザタブ** でのみアクティブです。作業中のタブで Connect してください。

### 5. 動作確認

Cursor の Agent に以下のようなプロンプトを送ります:

```
Penpot の現在のページの構造を一覧して、コンポーネントとカラーストイルを要約してください。
```

---

## Local 方式（上級者向け）

ローカルファイルへのアセット書き出しなど、追加機能が必要な場合:

### 1. MCP サーバーを起動

```bash
npm run dev:penpot-mcp
```

ターミナルは起動したままにしてください。

### 2. Penpot プラグインを読み込み

1. [design.penpot.app](https://design.penpot.app) でファイルを開く
2. **Plugins → Load from URL**
3. URL: `http://localhost:4400/manifest.json`
4. プラグインを実行し **Connect to MCP server** をクリック

### 3. Cursor の MCP URL を変更

`.cursor/mcp.json` の `url` を以下に差し替え:

```json
"url": "http://localhost:4401/mcp"
```

（`userToken` は不要）

---

## 日常的なワークフロー

### デザインから実装

1. Penpot で対象ページにフォーカス
2. MCP 接続を確認
3. Cursor Agent へ例:
   - 「このページの BikeCard を `client/src/components/BikeCard.tsx` に実装して」
   - 「Penpot のカラートークンを `client/src/index.css` の CSS 変数に同期して」

### 実装からデザイン

1. 対象コンポーネントのコードを開く
2. Cursor Agent へ例:
   - 「`GameBoard.tsx` のレイアウトを Penpot の GameBoard ページに反映して」
   - 「コードのスタイルガイドに合わせて Penpot のカラートークンを整理して」

### 参照ドキュメント

- スタイル: [style_guide.md](style_guide.md)
- 画面構成: [pages_structure.md](pages_structure.md)
- 作業方針: [WORK_DIRECTION.md](WORK_DIRECTION.md)
- Cursor ルール: `.cursor/rules/penpot-design-code.mdc`

---

## トラブルシューティング

| 症状 | 対処 |
|------|------|
| MCP ツールが表示されない | Cursor 再起動、`PENPOT_MCP_KEY` 確認 |
| 接続タイムアウト | Penpot プラグインが Connect 済みか確認。大きな一括操作は分割する |
| 別ページが操作される | Penpot で正しいページにフォーカスしてから再実行 |
| Local で接続失敗 | Chromium 系ブラウザは localhost 制限あり。Firefox を試す |
| キー期限切れ | Penpot Integrations で MCP key を再生成し、環境変数を更新 |

公式ドキュメント: https://help.penpot.app/mcp/
