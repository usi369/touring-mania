# Touring Mania Deployment & Bug Fix Plan

## 現在のステータス
* Cloudflare Pages & Workers, D1へのデプロイ済み
* 本番環境: `https://touring-mania-vite.pages.dev/`
* マスターデータ: Googleスプレッドシートで管理 → CSV → bikes_data.json → D1 の流れで反映
* バイク画像: Cloudflare R2 に格納済み（パブリックアクセス可）

## 完了済みの実装

### バグ修正
1. ToastProvider の無限ループ修正（useCallback/useMemoメモ化）
2. CardPlayPhase における addToast の ReferenceError 修正
3. ゲーム終了画面の「もう一度プレイ」ボタンが機能しない問題を修正

### ゲームルール実装
1. 宣言プレイヤーはカードを出せず、次のプレイヤーが出すルールの実装
2. 前回と同じ宣言（スペック＋方向）の禁止ルール実装
   - `games` テーブルに `prevDeclaredSpec` / `prevDeclaredDirection` カラムを追加
   - サーバー側バリデーション（declareSpec）
   - CPU宣言ロジックでの除外処理
   - プレイヤー宣言UIでの警告表示・ボタン無効化

### UI/UX改善
1. 宣言フェーズの手札を横スクロール可能なカード一覧に変更（BikeCardコンポーネント）
2. 場の履歴・手札選択エリアのフォーカス時の見切れ修正（padding追加）
3. 対戦相手の手札（カテゴリ内訳）UIの実装

### マスターデータ管理
1. `master/` フォルダを作成し、CSVでバイクカードのマスターデータをGitHub管理
2. R7正式版の32枚を本番データとしてD1に投入完了
3. 各カードにR2画像URL（`photoUrl`）を設定

## マスターデータ（bikes.csv）の運用

### フォルダ構成
```
master/
  README.md      ... CSV列の仕様と運用ルールのドキュメント
  bikes.csv      ... Googleスプレッドシートからエクスポートしたマスターデータ
```

### CSVの取り込みフロー
1. Googleスプレッドシートを CSV形式でダウンロード
2. `master/bikes.csv` として保存・コミット
3. ユーザーが明示的に「反映して」と指示した場合のみ、以下を実行:
   - `node scratch/convert_csv.cjs` でプレビュー確認
   - `node scratch/convert_csv.cjs --apply` で `bikes_data.json` を生成
   - `node scratch/gen_sql.cjs` でD1用SQLを生成（`scratch/d1_insert_bikes.sql`）
   - Cloudflare Dashboard > D1 > Console でSQLを実行

### CSVフィルタ条件
- F列（R7正式版）が `〇` のもののみ取り込み
- 「除外」列に「除外」があるものは対象外
- 管理IDが `-` のテストデータは対象外

### CSVカラムマッピング
| CSV列 | アプリの項目 | 備考 |
|---|---|---|
| 管理id（A列） | photoUrlの生成に使用 | bike_{管理id}.jpg |
| 車種1 + 車種2 | name | スペース区切りで結合 |
| _メーカーAlph | maker | 英語表記を使用 |
| 馬力ps | horsepower | |
| 燃費km/l | fuelEfficiency | |
| シートmm | seatHeight | |
| 全長mm | totalLength | |
| 車重kg | weight | |
| 税込価格yen（AW列） | price | そのまま万円単位 |
| 年式year | year | |
| ミッション | transmission | AT/MT |
| 気筒数 | cylinders | |
| pass_bg_class | category | bg_large/medium/small → large/medium/small に変換 |

### R2画像URL
- ベースURL: `https://pub-4f701e7dd07e451ca0cfc163b0291e5d.r2.dev`
- パターン: `{ベースURL}/bike_{4桁管理ID}.jpg`
- 例: ID 0188 → `https://pub-4f701e7dd07e451ca0cfc163b0291e5d.r2.dev/bike_0188.jpg`

## 次のフェーズのタスク
1. バイクカードのデザイン再調整（R2画像の表示を含む）
2. ゲーム機能の最終テスト
3. OAuthログイン機能の実装

## 引き継ぎ・特記事項

### 環境
- ローカルで `wrangler dev` を実行する際は、WindowsのExecutionPolicy制限に注意
  - `powershell -ExecutionPolicy Bypass -Command "npm run dev"` での起動を推奨
- wranglerがローカルにインストールできない（workerdのビルドエラー）ため、D1のマイグレーションはCloudflare Dashboardから手動実行

### D1マイグレーション履歴
| ファイル | 内容 |
|---|---|
| `drizzle/0000_third_frog_thor.sql` | 初期テーブル作成 |
| `drizzle/0001_add_prev_declaration.sql` | games に prevDeclaredSpec/Direction 追加 |
| `drizzle/0002_add_photo_url.sql` | bikes に photoUrl 追加 |

### 重要ファイル
| ファイル | 役割 |
|---|---|
| `master/bikes.csv` | マスターデータ（CSV） |
| `bikes_data.json` | アプリ用バイクデータ（JSONシード） |
| `scratch/convert_csv.cjs` | CSV → JSON 変換スクリプト |
| `scratch/gen_sql.cjs` | JSON → D1用SQL生成スクリプト |
| `client/src/pages/GameBoard.tsx` | メインのゲームループ |
| `client/src/components/DeclarationPhase.tsx` | 宣言UI |
| `client/src/components/CardPlayPhase.tsx` | カード選択UI |
| `server/routers/game.ts` | API/ゲームロジック |
| `server/db.ts` | DB操作・シード処理 |
| `drizzle/schema.ts` | DB定義 |
