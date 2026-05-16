# Touring Mania (ツーリング・マニア)

バイクのスペックを競い合うマルチプレイヤー・カードゲームです。

## 概要とインフラ構成

本アプリケーションは、フロントエンドに React (Vite)、バックエンドに tRPC、データベースに Cloudflare D1 を使用したシングル・デプロイ構成のモダンなWebアプリケーションです。

- フロントエンド: React (Vite) + Tailwind CSS
- バックエンド: tRPC (Cloudflare Pages Functions / _worker.js)
- データベース: Cloudflare D1 (Drizzle ORM)
- 画像ストレージ: Cloudflare R2 (パブリック公開URL経由で参照)
- 本番環境URL: https://touring-mania-vite.pages.dev/

---

## 開発環境のセットアップとTips

### 1. 依存関係のインストール
Windows ARM64 環境などで Cloudflare wrangler の内部依存（workerd）のビルドエラーが発生する場合があります。その場合は、以下のコマンドでポストインストールスクリプトを無視してインストールしてください。
```cmd
npm install --ignore-scripts
```

### 2. ローカル開発サーバーの起動
ローカルで起動する場合は以下のコマンドを実行します。
```cmd
npm run dev
```
※ 内部的には `wrangler dev` と `vite` を concurrently で並行起動しています。

### 3. WindowsでのPowerShell実行ポリシー制限の回避
Windows環境においてExecutionPolicy制限によりスクリプトの実行がブロックされる場合は、以下のコマンドで起動するか、バッチファイル（.cmd）を直接使用してください。
```powershell
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```

### 4. コマンド出力の文字化け対策（恒久対応）
WindowsのPowerShell環境やGitでコマンドの実行結果が文字化けする場合、以下の設定を行うことで恒久的に解決できます。

#### PowerShellのUTF-8常時有効化
PowerShellのプロフィールファイル（$PROFILE）を作成し、常にUTF-8環境で実行されるように設定します。

1. プロフィールファイル（Microsoft.PowerShell_profile.ps1）を開きます（存在しない場合は新規作成します）。
   ※ファイルの格納パスは `echo $PROFILE` コマンドで確認できます。
2. 以下の内容を追記します：
   ```powershell
   # PowerShell UTF-8 エンコーディング設定
   $OutputEncoding = [System.Text.Encoding]::UTF8
   [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
   [Console]::InputEncoding = [System.Text.Encoding]::UTF8

   # GitやNode.js等の文字化けを防ぐための環境変数設定
   $env:LANG = "ja_JP.UTF-8"
   $env:LC_ALL = "ja_JP.UTF-8"
   ```
3. セキュリティエラー等でプロフィールが読み込まれない場合は、PowerShellで以下を実行し、現在のユーザーのスクリプト実行ポリシーを緩和します：
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
   ```

#### Gitの日本語文字化け・表示対策
Gitのコミットログや、日本語のファイル名がエスケープ（\346\225...等）されて文字化けするのを防ぐため、コマンドプロンプトやPowerShell等で以下のグローバル設定を実行します：
```cmd
git config --global core.quotepath false
git config --global i18n.logoutputencoding utf-8
git config --global i18n.commitencoding utf-8
```

---

## データベース設計とマイグレーション

Drizzle ORM を使用してスキーマ管理を行っています。D1へのマイグレーション履歴は以下の通りです。

### マイグレーション履歴
- drizzle/0000_third_frog_thor.sql: 初期テーブル（users, games, game_players など）の作成
- drizzle/0001_add_prev_declaration.sql: games テーブルに prevDeclaredSpec / prevDeclaredDirection カラムを追加（二連続の同一スペック宣言禁止ルールのため）
- drizzle/0002_add_photo_url.sql: bikes テーブルに photoUrl カラムを追加（画像表示対応のため）

---

## マスターデータ（bikes.csv）の運用フロー

バイクのマスターデータは Google スプレッドシートで管理され、以下のフローでアプリに反映されます。

### 反映フロー
1. スプレッドシートからCSVをエクスポートし、`master/bikes.csv` に上書き保存してコミットします。
2. CSVをJSONに変換しプレビュー確認を行います。
   ```cmd
   node scratch/convert_csv.cjs
   ```
3. 問題がなければ、実際に JSON データを生成します。
   ```cmd
   node scratch/convert_csv.cjs --apply
   ```
   ※ これにより `bikes_data.json` が更新されます。
4. シード用のSQLファイルを生成します。
   ```cmd
   node scratch/gen_sql.cjs
   ```
5. 生成された `scratch/d1_insert_bikes.sql` の内容を Cloudflare Dashboard の D1 コンソールで実行し、本番データベースに反映します。

### CSVのフィルタ条件
- F列（R7正式版）が「〇」のもののみ取り込み対象とします。
- 「除外」列に「除外」と入力されている行は除外します。
- 管理IDが「-」のテストデータは除外します。

### カラムマッピング
- 管理id (A列): photoUrl の生成用ID（bike_{管理id}.jpg）
- 車種1 + 車種2: name（スペース区切りで結合）
- _メーカーAlph: maker（英語表記のメーカー名）
- 馬力ps: horsepower
- 燃費km/l: fuelEfficiency
- シートmm: seatHeight
- 全長mm: totalLength
- 車重kg: weight
- 税込価格yen (AW列): price (万円単位)
- 年式year: year
- ミッション: transmission (AT/MT)
- 気筒数: cylinders
- pass_bg_class: category (bg_large/medium/small を large/medium/small に変換)

### バイク画像（R2ストレージ）
- ベースURL: https://pub-4f701e7dd07e451ca0cfc163b0291e5d.r2.dev
- 保存名パターン: {ベースURL}/bike_{4桁管理ID}.jpg
- 例: ID 0188 -> https://pub-4f701e7dd07e451ca0cfc163b0291e5d.r2.dev/bike_0188.jpg
