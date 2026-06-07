# Steam対応: デスクトップ版の実現可能性調査・リリース設計

## 背景

現行のTouring ManiaをSteamで配布できる形へ展開する。

BGA移植とは異なり、Steamでは現行のReactフロントエンド、Cloudflare
バックエンド、D1、R2、ゲームロジックの大部分を再利用できる可能性が高い。

一方、Steamへ登録するにはインストール可能なデスクトップビルド、Steam認証、
保存方式、ストア素材、対応OS、アップデート、権利、プライバシー、障害時の挙動を
整理する必要がある。

このタスクでは実装方式を確定し、最小プロトタイプからSteam公開までの作業範囲を
明確にする。

## BGA移植との違い

- BGAのようなPHPや専用ゲームステートへの全面移植は原則不要
- React、TypeScript、ゲームAPI、D1、R2を再利用できる
- デスクトップ用の実行コンテナとSteamworks連携を追加する
- Valveのストアページと製品ビルドの審査が必要
- Steam版でもCloudflareへ接続する場合、インターネット障害やサービス終了時の
  影響を設計する必要がある

## 最初に決める実装方式

### 案A: デスクトップシェル + Cloudflare継続

ElectronまたはTauriへReactアプリを組み込み、ゲームAPI、D1、R2は現行の
Cloudflare環境を利用する。

利点:

- 現行コードを最も多く再利用できる
- Web版とSteam版のゲームデータや戦績を共有しやすい
- バックエンド修正をSteamビルド更新なしで反映できる
- 初期プロトタイプを短期間で作りやすい

懸念:

- 原則オンライン必須になる
- Cloudflare障害やサービス停止時にSteam版も遊べなくなる
- Steam購入者の認証と現行ユーザーの紐付けが必要
- APIを公開したままにせず、Steam所有権をサーバー側で検証する必要がある
- 外部Webサイトを単に表示するだけの製品に見えない完成度が必要

### 案B: ローカル完結型

ゲームロジック、バイクマスター、セーブデータをデスクトップアプリ内へ移し、
Cloudflareへの依存を減らす。

利点:

- オフライン対CPU戦を実現しやすい
- サーバー維持費や障害の影響を減らせる
- Steam Cloudによる端末間セーブ同期と相性がよい

懸念:

- 現在D1にあるゲーム進行・戦績・マスター管理を再設計する必要がある
- 不正改変を防ぎにくい
- オンライン対戦を追加する場合は別途サーバーが必要
- Web版とのデータ共有が複雑になる

### 案C: ハイブリッド型

- CPU戦、ルール確認、図鑑はローカル
- オンライン対戦、ランキング、共有戦績はCloudflare
- Steam Cloudには設定やローカル進行だけを保存

将来的には柔軟だが、初期実装の範囲が広くなるため、最初のプロトタイプでは
案Aまたは案Bのどちらかに寄せる。

## 主要な懸念事項

### 1. デスクトップ化技術

- ElectronとTauriを比較し、採用技術を決定する
- Windows x64を最初の対象とするか、Windows ARM64、macOS、Linuxも含めるか決める
- Viteのビルド成果物をデスクトップアプリへ組み込む
- アプリ内ルーティング、ディープリンク、ウィンドウサイズ、フルスクリーンを整える
- DevTools、外部リンク、ファイルアクセス、ナビゲーションを安全に制限する
- ネイティブブリッジを最小権限にし、任意コード実行や秘密情報流出を防ぐ

### 2. Steam認証と購入確認

- Steamworks SDKからSteam IDと認証セッションチケットを取得する
- 認証チケットをCloudflareの信頼できるバックエンドへ送る
- Steamworks Web APIを用いてユーザー本人とアプリ所有権を検証する
- Publisher Web APIキーをクライアントへ含めず、サーバー秘密情報として管理する
- 現行メール認証ユーザーとSteam IDを統合するか、Steam版を別アカウントとして扱う
- Steamクライアントを介さず起動された場合の挙動を決める

### 3. オンライン・オフライン方針

- Steamストア上でオンライン必須であることを明示するか決定する
- 起動時にCloudflareへ到達できない場合のエラー画面を用意する
- 対戦途中の切断、再接続、タイムアウト、サーバー障害への対応を設計する
- CPU戦をオフライン対応するか決定する
- Web版とSteam版の同時対戦を許可するか決定する

### 4. 保存データ

- D1に保存するデータと端末ローカルに保存するデータを分類する
- Steam Cloudを使用する対象を決める
- 設定、音量、画面設定、チュートリアル進行などを端末またはSteam Cloudへ保存する
- 戦績やオンラインゲーム状態はサーバーを正とする
- 複数端末での競合、破損、古いセーブの復元方針を決める
- Web版ユーザーの既存戦績・ガレージをSteam版へ引き継ぐか決める

### 5. マルチプレイヤー

- 初期Steam版をCPU戦のみ、オンライン対戦のみ、両対応のどれにするか決定する
- 現行は対CPU中心のため、Steam Remote Play Togetherだけで成立するか検討する
- ネイティブなオンライン対人戦を行う場合、ロビー、招待、マッチング、切断復帰が必要
- Steam LobbyやNetworkingを使うか、Cloudflare側のマッチングを使うか決定する
- Steamのフレンド招待、参加、オーバーレイとの連携範囲を決める
- クロスプレイを許可する場合、Steam ID以外のユーザー識別方式も維持する

### 6. Steamworks機能

必要性を個別に判断する。

- 実績
- リーダーボード
- Steam Cloud
- フレンド招待
- オーバーレイ
- Rich Presence
- コントローラー対応とSteam Input
- Remote Play Together
- デモ版
- DLCまたはタイトル別コンテンツ
- Steam Trading Cards

機能をストアページへ記載する場合、製品審査時点で実装済みである必要がある。

### 7. 操作と画面

- マウス、キーボード、タッチ、コントローラーの対応範囲を決める
- コントローラーだけで全画面を操作できるか検証する
- ウィンドウ、ボーダーレス、フルスクリーン、解像度、UIスケール設定を用意する
- 現行の固定9:16画面をPCモニター向けに調整する
- 16:9スクリーンショットでゲーム内容が伝わるレイアウトを用意する
- 小さい文字、横スクロール、場札の見切れをデスクトップ向けに改善する
- Steam Deckでの表示と入力を対象にするか決定する

### 8. アップデートと環境分離

- SteamPipeのDepot、Build、Branch構成を設計する
- production、beta、internal-testなどのブランチを用意する
- Web版の自動更新とSteamクライアントのビルド更新の差を管理する
- クライアントとAPIの互換バージョンを定義する
- 古いSteamビルドが新しいAPIを呼んだ場合の互換性を確保する
- 強制アップデートが必要な場合の案内を実装する

### 9. セキュリティ

- Steam Web APIキーやCloudflare秘密情報をアプリへ同梱しない
- Steam認証済みユーザーだけが保護APIを利用できるようにする
- 現在の`publicProcedure`をSteam版公開前に見直す
- ゲーム操作のターン、所有カード、ルールをサーバー側で再検証する
- デスクトップアプリから任意URLやローカルファイルへアクセスできないようにする
- チートやAPI直接呼び出しの影響範囲を整理する

### 10. バイクマスターと画像

- 本番D1を正式なバイクマスターとする運用を明文化する
- Steamビルドへマスターと画像を同梱するか、R2から取得するか決定する
- オフライン対応する場合、152枚の画像容量と更新方法を検討する
- CDN画像が取得できない場合の代替表示を用意する
- 4タイトルを本体内オプション、DLC、別Appのどれで扱うか決定する

### 11. 権利・ライセンス・プライバシー

- Touring ManiaをSteamで販売・配布する権利を確認する
- バイク写真、メーカー名、ロゴ、商品画像の商用デジタル配布権を確認する
- 使用しているフォント、音声、効果音、ライブラリの再配布ライセンスを確認する
- Steam Distribution Agreementと公開コンテンツ規則を確認する
- Cloudflareへ送信するSteam ID、メールアドレス、戦績などをプライバシーポリシーへ記載する
- ユーザーデータ削除、問い合わせ、障害時のサポート窓口を用意する

### 12. Steam登録・審査

- Steamworksパートナー登録と税務・銀行情報を準備する
- AppごとにSteam Direct Fee 100米ドル相当を支払う
- ストアページと製品ビルドの両方を審査へ提出する
- Valveの通常審査期間は3～5営業日だが、少なくとも7営業日の余裕を持つ
- Coming Soonページをリリース前に最低2週間公開する
- 対応OSすべてで正常起動するビルドを提出する
- ストアに掲載した機能を審査ビルドへすべて実装する

### 13. ストア素材

公式テンプレートの最新寸法に合わせて制作する。

- Header Capsule: 920 x 430
- Small Capsule: 462 x 174
- Main Capsule: 1232 x 706
- Vertical Capsule: 748 x 896
- Screenshot: 1920 x 1080以上、16:9
- Library Capsule: 600 x 900
- Library Hero: 3840 x 1240
- Library Logo
- Library Header Capsule: 920 x 430
- Shortcut Icon: 256 x 256
- App Icon: 184 x 184

ベースのカプセル画像にはゲーム名・公式サブタイトル以外の販促文、レビュー点数、
受賞ロゴなどを入れない。

### 14. 品質保証

- クリーンインストールとアンインストールを確認する
- Steamクライアントのオンライン・オフライン状態で確認する
- Windowsユーザー名や保存先に日本語が含まれる環境で確認する
- 複数解像度、DPI、複数モニターで確認する
- API障害、R2画像障害、認証失敗、切断復帰を確認する
- Steam Cloudの競合と端末間同期を確認する
- ベータブランチから正式ブランチへの更新を確認する
- 対応する場合はSteam Deckで確認する

## 調査・設計チェックリスト

- [ ] Steamworksパートナー登録の主体と権限を確認する
- [ ] Steamでの販売・画像・商標利用許諾を確認する
- [ ] 案A・B・Cからアーキテクチャを決定する
- [ ] ElectronとTauriを比較して採用技術を決定する
- [ ] 初期対応OSを決定する
- [ ] オンライン必須・オフライン対応の方針を決定する
- [ ] Steam認証と現行アカウント統合方式を設計する
- [ ] Steam版のマルチプレイヤー範囲を決定する
- [ ] Steam Cloudへ保存するデータを決定する
- [ ] Steamworks機能の採用範囲を決定する
- [ ] 4タイトルの販売・提供方法を決定する
- [ ] クライアントとAPIのバージョン互換方針を設計する
- [ ] 最小プロトタイプを作成する
- [ ] SteamPipeのDepot・Branch構成を作成する
- [ ] ストア素材とストア文章を準備する
- [ ] QA対象環境とリリース手順を作成する
- [ ] 工数、運用費、販売価格、リリース時期を見積もる

## 推奨する最小プロトタイプ

初期検証では案Aを採用し、以下に限定する。

- Windows x64
- ElectronまたはTauriで現行Reactアプリを起動
- Cloudflare本番APIとR2を利用
- CPU戦を1ゲーム完了できる
- Steamクライアントから起動できる
- Steam IDを取得できる
- バックエンドで認証チケットと所有権を検証できる
- ウィンドウとフルスクリーンを切り替えられる
- ネットワーク障害時に明確なエラーを表示できる

このプロトタイプでパッケージング、認証、ゲーム完走、API接続が成立した後、
実績、Steam Cloud、コントローラー、オンライン対戦、Steam Deck対応を追加する。

## 完了条件

- Steam版のアーキテクチャと採用技術が決まっている
- 初期対応OS、オンライン要件、認証、保存方式が決まっている
- Steamで販売・配布するための権利条件が確認できている
- 最小プロトタイプがSteamクライアントから起動し、ゲームを完了できる
- 本番APIへ安全にSteamユーザーを認証できる
- Steamworks機能とストア掲載機能の範囲が確定している
- ストア素材、審査、QA、アップデートの計画がある
- 次の実装Issueへ分割できる状態になっている

## 参考資料

- [Steam Direct Fee](https://partner.steamgames.com/doc/gettingstarted/appfee)
- [Release Process](https://partner.steamgames.com/doc/store/releasing)
- [Review Process](https://partner.steamgames.com/doc/store/review_process)
- [User Authentication and Ownership](https://partner.steamgames.com/doc/features/auth)
- [Steamworks Web API](https://partner.steamgames.com/doc/webapi_overview)
- [Steam Cloud](https://partner.steamgames.com/doc/features/cloud)
- [Depots](https://partner.steamgames.com/doc/store/application/depots)
- [Graphical Assets](https://partner.steamgames.com/doc/store/assets)
- [Graphical Asset Rules](https://partner.steamgames.com/doc/store/assets/rules)
