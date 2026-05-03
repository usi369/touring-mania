このドキュメントは、現在ローカル環境で開発中の Touring Mania プロジェクトを GitHub で管理し、Cloudflare (Pages/Workers/D1/R2) を用いてネット公開するための手順と、その構成をまとめたものです。

---

## 0. 技術スタック (Tech Stack)

このプロジェクトは以下の技術およびサービスを使用して構成されています。

### フロントエンド (Frontend)
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS, Lucide React (Icons), Radix UI (Components)
- **State Management**: TanStack Query (React Query)
- **API Client**: tRPC Client (Type-safe API calls)
- **Deployment**: Cloudflare Pages

### バックエンド (Backend)
- **Runtime**: Cloudflare Workers (V8 Runtime)
  - ※ 移行前: Node.js / Express
- **API Framework**: tRPC Server
- **Authentication**: OAuth (Manus / Google 等)
- **Language**: TypeScript

### データベース & ストレージ (Database & Storage)
- **ORM**: Drizzle ORM
- **Database**: Cloudflare D1 (Serverless SQL Database)
  - ※ 移行前: Local SQLite (better-sqlite3)
- **Object Storage**: Cloudflare R2 (S3-compatible)
  - ※ 移行前: AWS S3

---
## 役割分担 (Roles and Responsibilities)

| カテゴリ | 項目 | Antigravity (AI) | ユーザー (USER) | 備考 |
| :--- | :--- | :---: | :---: | :--- |
| **ソース管理** | GitHub へのプッシュ / 同期 | ✅ 可能 | ✅ 可能 | AI が自動でコミット・プッシュ可能 |
| **データベース** | Cloudflare D1 クエリ実行 / シード | ✅ 可能 | ✅ 可能 | `wrangler d1 execute` で操作可能 |
| **デプロイ** | Cloudflare Pages へのデプロイ | ✅ 可能 | ✅ 可能 | `npm run deploy` で実行可能 |
| **インフラ設定** | Cloudflare ダッシュボード上での設定 | ❌ 不可 | ✅ 可能 | バインディングや秘密鍵の登録はブラウザで実行 |
| **秘密情報** | `.env` ファイル等の管理 | ❌ 不可 | ✅ 可能 | セキュリティ上、ユーザーが手動で管理 |
| **アセット** | Cloudflare R2 (バケット作成・管理) | ⚠️ 未着手 | ⚠️ 未着手 | フェーズ 2.5 で対応予定 |

## 1. タスクリスト

### フェーズ 1: GitHub 管理の開始
- [x] .gitignore の再確認
    - `local.db` や `.env` など、秘匿情報やローカル限定のファイルが含まれていないか確認する。
- [x] GitHub リポジトリの作成
- [x] Git 初期化とリモート追加
    - `git init`
    - `git remote add origin <URL>`
- [x] ソースコードの初コミットとプッシュ

### フェーズ 2: データベースの移行 (SQLite -> Cloudflare D1)
- [x] Cloudflare D1 データベースの作成
- [x] Drizzle ORM のドライバー変更
- [x] マイグレーションファイルの適用
- [x] データのシード (必要に応じて)

### フェーズ 2.5: アセット管理の移行 (AWS S3 -> Cloudflare R2) [一旦スキップ]
- [ ] Cloudflare R2 バケットの作成
- [ ] バケットの公開設定 (Public Access) またはカスタムドメインの設定
- [ ] ストレージ・クライアントの修正
- [ ] 画像データのアップロード

### フェーズ 3: サーバーサイドの改修 (Node.js/Express -> Cloudflare Workers)
- [x] tRPC アダプターの変更
- [x] OAuth 処理の書き換え
- [x] 依存ライブラリのチェック

### フェーズ 4: フロントエンドのデプロイ
- [ ] Cloudflare Pages のセットアップ
- [ ] ビルド設定の構成
    - `npm run build` コマンドと `dist` ディレクトリの指定。
- [ ] 環境変数の設定
    - Cloudflare ダッシュボード上で API エンドポイントや AWS S3 の認証情報を設定。

### フェーズ 5: 公開と検証
- [ ] ドメインの設定 (必要に応じて)
- [ ] 動作確認
    - ログイン処理、データの取得、ゲームの実行、S3 への画像アクセスなどが正常に行えるか確認。

---

## 2. 懸念事項・技術的課題

### データベースの制約 (Cloudflare D1)
- **互換性**: 現在使用している `better-sqlite3` は Node.js のネイティブモジュールであり、Workers 環境では動作しません。Drizzle ORM を使用しているためコードの多くは共通化できますが、接続部分の書き換えが必須です。
- **制限**: D1 には保存容量やクエリ実行時間の制限があるため、将来的にデータ量が増えた場合の考慮が必要です。

### サーバー実行環境の差異 (Runtime)
- **Express の非互換性**: Workers は Node.js そのものではなく、V8 準拠のランタイムであるため、Express がそのままでは動作しません。Workers 向けに軽量なルーティングライブラリ (Hono 等) を導入するか、tRPC の標準アダプターに移行する必要があります。
- **リソース制限**: Workers には 1 リクエストあたりの CPU 時間やメモリ使用量に制限があります。複雑な AI 処理 (`cpuAI.ts`) などが制限に抵触しないか検証が必要です。

### 認証と OAuth
- **コールバック URL**: 公開に伴い、Google 等の OAuth プロバイダー側で許可するリダイレクト URI を Cloudflare のドメインに変更する必要があります。
- **セッション管理**: Cookie や JWT の扱いが Workers のセキュリティモデルに適しているか確認が必要です。

### AWS S3 の利用
- **認証情報**: 現在 `dotenv` で管理している AWS のアクセスキー等を Cloudflare の Secret として安全に管理する必要があります。
- **リージョン制限**: Workers から S3 へのアクセスにおいて、レイテンシや通信制限の問題がないか確認が必要です。

### プロジェクト構造
- **構成の選択**: 現在 `server` と `client` が混在しています。Cloudflare Pages (Full-stack) 構成にするか、Pages (Frontend) + Workers (Backend) に分離するか、開発のしやすさとデプロイの容易さを考慮して決定する必要があります。
