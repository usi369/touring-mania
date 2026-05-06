# Touring Mania プロジェクト引き継ぎドキュメント

このドキュメントは、プロジェクトのこれまでの経緯、現在の開発環境、および今後の課題をまとめたものです。

## 1. プロジェクトの経緯

### 開発環境の変遷
- **Manus からの移行**: 初期は Manus プラットフォーム上で開発を進めていましたが、より柔軟な開発と複数人での協力体制を整えるため、Antigravity へ移行しました。
- **GitHub & Cloudflare の導入**: 移行に伴い、ソースコード管理に GitHub、インフラに Cloudflare を導入しました。これにより、特定のパソコン環境に依存せず、どこからでも最新の状態で開発を再開できる体制を構築しました。

### インフラ構成の変更
- **Workers から Pages への転換**: 当初は Cloudflare Workers でリソースを構築しましたが、静的資産（フロントエンド）と API の統合管理におけるミスマッチを解消するため、**Cloudflare Pages (Advanced Mode)** に作り直しました。現在は `dist/public/_worker.js` を使用したシングル・デプロイ構成になっています。

## 2. 開発上の重要ノウハウ（Tips）

### Antigravity コマンドラインの文字化け対策
Windows 環境（PowerShell）で Antigravity のコマンド実行結果が文字化けする場合、コマンドの先頭にエンコーディング設定を追加することで解消されます。
- **解決策**: コマンド実行時に必ず以下を先頭に付与してください。
  ```powershell
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; (実行したいコマンド)
  ```
  ※ これにより、日本語のエラーメッセージや Git のログが正しく表示されるようになります。

## 3. 現在の構成と主要コンポーネント

- **フロントエンド**: React (Vite) + Tailwind CSS
- **バックエンド**: tRPC (Cloudflare Pages Functions / _worker.js)
- **データベース**: Cloudflare D1 (Drizzle ORM)
- **画像ストレージ**: Cloudflare R2 (公開URL経由で参照)

## 4. 現在の課題と今後のタスク

### 直近の課題
- **画像表示の最適化**: バイク画像の表示は実装済みですが、マスターデータ（CSV）の更新に伴う D1 への画像 URL 反映を定期的に行う必要があります。
- **OAuth ログイン**: 現在はゲストモードが主流ですが、本格的なユーザー管理のために OAuth (Manus OAuth 等) の完全な統合が将来的な課題です。

### 今後のタスク
- `todo.md` に記載されている「Phase 15: Game Experience Polish」の継続。
- UI/UX のさらなるブラッシュアップと、ゲームバランスの微調整。

---
最終更新日: 2026-05-07
更新者: Antigravity
