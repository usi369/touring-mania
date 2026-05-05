# Touring Mania プロジェクト管理・引き継ぎドキュメント

このドキュメントは、Touring Mania プロジェクトのインフラ構成、開発環境のセットアップ、およびこれまでの実装内容をまとめたものです。第三者や別の環境で作業を開始する際のガイドとして使用してください。

---

## 1. インフラ構成と接続情報

本プロジェクトは Cloudflare のサーバーレスアーキテクチャに完全に移行されています。

- **フロントエンド**: Cloudflare Pages (`https://touring-mania-vite.pages.dev/`)
- **バックエンド**: Cloudflare Workers (Pages Functions 構成)
- **データベース**: Cloudflare D1 (Serverless SQL)
- **ソース管理**: GitHub (`usi369/touring-mania`)
- **自動デプロイ**: GitHub の `main` ブランチへプッシュされると、Cloudflare Pages 上で自動ビルド・デプロイが実行されます。

### 主要なリソース情報
- **D1 データベース名**: `touring-mania-db`
- **D1 データベースID**: `ef22a166-d951-41c1-8317-3195dbd37048`
- **Wrangler プロジェクト名**: `touring-mania`

---

## 2. 環境セットアップ

作業を開始する前に、プロジェクトルートに `.env` ファイルを作成し、以下の変数を設定してください。

### 必須の環境変数 (.env)
```bash
# Cloudflare API 操作用 (Wrangler/Drizzle-kit で使用)
CLOUDFLARE_ACCOUNT_ID=xxxx  # Cloudflare ダッシュボードから取得
CLOUDFLARE_API_TOKEN=xxxx   # D1/Pages 操作権限を持つトークン

# アプリケーション設定
JWT_SECRET=xxxx            # セッション署名用の任意の文字列
```

### 依存関係のインストール
```bash
npm install
# または
pnpm install
```

---

## 3. 開発・運用コマンド

### ローカル開発
```bash
# クライアント・サーバー両方の起動
npm run dev
```

### データベース管理 (D1)
```bash
# マイグレーションの作成 (スキーマ変更後)
npx drizzle-kit generate

# ローカル D1 へのマイグレーション適用
npm run db:push

# リモート D1 へのマイグレーション適用
npx wrangler d1 migrations apply touring-mania-db --remote

# データのシード (bikes_data.json を元に投入)
node seed-bikes.mjs  # 必要に応じてパスや環境変数を調整
```

### デプロイ
```bash
# 手動デプロイ (通常は git push で自動実行されます)
npm run deploy
```

---

## 4. 実装済み機能のサマリー

詳細は `todo.md` を参照してください。

- **フェーズ 1-7**: ゲームのコアロジック（サイコロ、カード配布、スペック宣言、勝利判定）および基本UIの完成。
- **フェーズ 8-14**: ゲストモード、バイク図鑑、ルール説明画面、複数ラウンド対応、スコアボードの実装完了。
- **インフラ移行**: Node.js/Express から Cloudflare Workers/Drizzle ORM/D1 への完全移行完了。

---

## 5. 現在のフェーズと今後の課題

### フェーズ 15: OAuth ログインの実装 (進行中)
- Manus SDK を利用した OAuth 連携の統合。
- `/api/oauth/login` エンドポイントの実装とフロントエンドの紐付け。

### 懸念事項・技術的課題
- **アセット管理**: 現在、バイク画像は暫定的な参照になっています。将来的に Cloudflare R2 への移行を検討中です（フェーズ 2.5 相当）。
- **マルチプレイヤー**: 現在は CPU 対戦がメインです。リアルタイム通信が必要なオンライン対戦機能の拡張が課題です。

---
最終更新日: 2026-05-05
更新者: Antigravity
