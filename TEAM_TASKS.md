# Shared Task List

2026-07-20、6ロール（Dev/Design/Ops/Growth/Content/QA）による初回コードベース分析の結果。各エージェントが実ファイルを読み込み、行番号を含めて具体的に検証済み。優先度順に並べ、着手時は該当タスクにチェックを入れる運用とする。

凡例: 🔴High / 🟡Medium / ⚪Low

---

## 🚀 Week 1 Sprint（〜2026-07-27・情報サイトとして公開するための1週間）

事業計画書（Artifact）DOC04の日別スケジュールを部門別タスク一覧に展開したもの。ここに載っていない項目（下記「今回対象外」参照）は着手しない——1週間は「導線の完動」「エンタメ化戦略の土台」「情報の正しさ」の3点に絞る。各部門、着手時は `[ ]` を `[x]` に変える運用とする。

### Design
- [ ] 🔴 モックデータ導線の修正 — `Favorites.tsx`・`ProductCard.tsx`・`MyPage.tsx`が実DB(tRPC)ではなく`@/lib/mockData`を参照している。実データ版に繋ぎ直すか、当面ナビゲーションから外す（Day1）（`MapPage.tsx`は実DB接続済み・対応済み）
- [x] 🔴 デスクトップ／モバイルのナビ項目統一 — `navConfig.ts`の`NAV_ITEMS`に集約済み。`AppLayout.tsx`サイドバーと`BottomNav.tsx`は共に同一の`NAV_ITEMS`を参照（Day5）
- [ ] 🟡 主要導線（戻る・いいね・シェア・購入CTA）へのaria-label付与（Day5）
- [ ] 🆕 SNSシェアカードのビジュアルデザイン — 商品画像＋価格＋施設名を合成する縦長カードのレイアウト設計（Devと共同、Day2-3）

### Dev
- [ ] 🆕 SNSシェアカード生成機能の実装 — 商品詳細ページのシェアボタンを拡張し、クライアント側(canvas等)でInstagramストーリーズ用の縦長画像を生成（Day2-3、旧事業計画書の最優先施策）
- [ ] 🆕 主要パス（商品詳細）へのOGP bot対応の技術実装 — Growth/Opsと連携（Day3）
- [ ] Designのモックデータ導線修正に伴うtRPCクエリ接続のサポート（Day1、必要に応じて）

### Ops
- [ ] 🔴 アクセス解析（GA4等）の導入有無を確認し、未導入なら追加（Day3）
- [ ] 🟡 本番環境変数の棚卸し（`.env.example` ⇔ Railway Variables突合）（Day6）
- [ ] 🟡 `railway.json`の最小構成を先行整備（起動/ビルド設定だけでもGit管理下に置く）（Day6）

### Growth
- [ ] 🔴 `robots.txt` / `sitemap.xml`の新規作成 — 22駅・空港ページ、用途ページを機械生成（Day3）
- [ ] 🔴 canonicalタグの現行ドメイン修正 — `Home.tsx`・`PurposePage.tsx`・`StationPage.tsx`計4箇所（Day1）
- [ ] 🔴 公式Instagramアカウントの開設・初回投稿素材の準備（1,251件DBから「〇〇駅で買えるお土産ランキング」等を作成）（Day5〜7）
- [ ] 🟡 駅・用途ページへの実`<a href>`内部リンク追加（時間があれば）

### Content
- [ ] 🔴 `purposeTags`/`badges`の不正JSON文字列19件を修正 — `ngy_*`/`shz_*`商品でJSON.parse()が例外になる（Day4）
- [ ] 🟡 カテゴリ表記の主要な重複だけ正規化（36種類→絞り込み。完全対応は週2以降でも可）（Day4）

### QA
- [ ] 🔴 主要フロー（検索→商品詳細→購入CTA→いいね→シェア）を手動で全パターン確認し、見つけたバグをその場でDev/Designに差し戻す（Day6）
- [ ] 🆕 SNSシェアカード機能の生成結果を実際にシェアしてOGP・画像表示を確認（Day6）

### リリースゲート（この5つが揃うまで告知しない）
1. マイページ・お気に入り・マップからの遷移が、すべて実データの商品詳細に着地する
2. 商品詳細ページからSNSシェアカードが生成でき、OGP画像付きで共有できる
3. `sitemap.xml`が実在し、駅・用途ページが登録されている
4. アクセス解析が動作しており、初日から数字が取れる
5. 公式Instagramに初回投稿できる素材が準備できている

### 今回（1週間）は対象外——公開後の安定運用期間に回す
- ポイント/コレクション登録のfarming脆弱性修正（Dev）
- admin権限チェックのadminProcedure一本化（Dev）
- ヘルスチェック・graceful shutdown実装、CI導入（Ops）
- E2Eテスト基盤の新規構築、`vitest.config.ts`のclient/src拡張（QA）
- 売り場店舗名の表記ゆれ正規化、dedupeロジック強化（Content）

---

---

## 🔴 High Priority（信頼性・セキュリティ・収益導線に直結）

### [Dev] ポイント/コレクション登録のfarming脆弱性
`server/db.ts` の `addLike`(494-525)/`processLikeReward`(989-1020)、`server/routers/collector.ts` の `register`/`registerManual` が check-then-act のみでユニーク制約・トランザクションなし。いいね解除→再いいねの繰り返しで無限にポイントを稼げる。
→ `likes`/`collections` テーブルにユニーク制約追加＋`db.transaction()`化。

### [Dev] admin権限チェックの重複實装
`server/_core/trpc.ts` に `adminProcedure` が定義済みなのに、`server/routers.ts` の admin.* 配下17箇所が手書き `ctx.user?.role !== "admin"` を個別実装。チェック漏れリスク。
→ 全て `adminProcedure` に置換。

### [Design] モック版ページが実DBに繋がっていない導線破綻
`Favorites.tsx`(L18) が `@/lib/mockData` を参照。`ProductCard.tsx`(L41)・`MyPage.tsx`(L482、閲覧履歴)も `/product/:id`（モック版）に遷移し、実商品を見ていたユーザーが架空データの詳細ページに着地する。（`MapPage.tsx`は実DB(tRPC)接続・`/db-product/:id`遷移に対応済み、ナビにも復帰済み）
→ 実データ版(tRPC)に繋ぎ直すか、当面ナビゲーションから外す。

### [Design] デスクトップ/モバイルでナビ項目が不一致（対応済み）
`navConfig.ts`の`NAV_ITEMS`にナビ項目定義を集約し、`AppLayout.tsx`のデスクトップサイドバーと`BottomNav.tsx`が共通で参照するよう修正済み。

### [Design] アイコンのみボタンにaria-labelがほぼ皆無
grep実測：aria-label使用は実質1ファイルのみ、focus-visible使用も4ファイルのみ。主要導線（戻る・いいね・シェア・閉じる）約200箇所が未対応。
→ 商品詳細・検索・マイページから優先的に付与。

### [Ops] railway.jsonが存在せずデプロイ設定が属人化
起動/ビルド設定はRailway UIの手動設定のみでリポジトリに記録がない。UI設定が消えると本番が復旧できない。
→ `railway.json`にbuildCommand/startCommand/healthcheckPath/restartPolicyを明記しGit管理。

### [Ops] ヘルスチェック・graceful shutdownが未実装
`server/_core/index.ts`にシグナルハンドラなし。Railway再デプロイ時に処理中リクエストが強制切断される。
→ `/api/health`追加＋`SIGTERM`ハンドラ実装。

### [Ops] CI（build/check/testゲート）が存在しない
`.github/`ディレクトリ自体が無く、型エラー・テスト失敗のまま本番反映されるリスクを防ぐ仕組みがゼロ。
→ `.github/workflows/ci.yml`でpush/PR時に`pnpm check`/`test`/`build`を実行。

### [Growth] SNSシェア用OGPがJS実行しないクローラーに届かない
SPAで静的`client/index.html`にog:imageが無く、SSR/プリレンダリングも未実装。LINE/X/Facebookのシェアが汎用カードになる。
→ bot判定＋対象パス(`/db-product/:id`等)のみ軽量プリレンダリングでmeta注入。

### [Growth] canonicalタグが旧Manusドメインのまま
`Home.tsx`(L314)・`PurposePage.tsx`(L199/209)・`StationPage.tsx`(L264/276)が`https://omiyagego-axrcumbv.manus.space/`をハードコード。
→ `window.location.origin`ベースに修正（`DBProductDetail.tsx`は既に正しい実装なので参考にする）。

### [Growth] robots.txt/sitemap.xmlが存在せずSEOページが未発見
22駅×用途の掛け合わせランディングページ群がクロール発見経路を持たない。
→ 新規作成し`FACILITY_META`から機械的に生成。

### [Content] カテゴリ表記が36種類に分散
`菓子/洋菓子/焼き菓子/和菓子`等、意味重複したカテゴリがDB上ただのvarchar自由記述。
→ マッピング表を作り正規化、`data-export/products.json`を修正して再投入。

### [Content] purposeTags/badgesの不正JSON文字列19件
`scripts/seed-nagoya-shizuoka-products.mjs`由来の19商品（`ngy_*`/`shz_*`）がJSON配列でなく日本語カンマ区切り生文字列でJSON.parse()が例外になる。
→ 該当商品を洗い出し、他商品と同じ英語コード配列のJSON形式に修正。

### [QA] 購入CTAのURL生成ロジックが未テスト
`DBProductDetail.tsx`(356-371)の`rakutenSearchUrl`/`purchaseLink`生成がコンポーネント内直書きでテスト不可能。既存テストは別実装の簡易ブール値をテストする「替え玉カバレッジ」。
→ 関数を切り出し、brandUrl有無×アフィリエイトID有無×brand欠落のパターンでURLを厳密にassert。

### [QA] いいねの楽観的更新にロールバックが無い
`DBProductDetail.tsx`(387-389)の`handleLike`はmutation失敗時にUIとサーバー状態がズレたまま復旧しない。`likes.toggle`への統合テストも皆無。
→ `onError`でロールバック実装＋`appRouter.createCaller`での統合テスト追加。

---

## 🟡 Medium Priority

- **[Dev]** `facilities.getProducts`/`getSellers`のFACILITY_ID_MAP重複定義（`server/routers.ts` 280-337）を共通化
- **[Dev]** `admin.products.bulkImport`の部分失敗時の追跡性強化（成功/失敗ID一覧を返却）
- **[Design]** 主要CTAの緑トーン統一（emerald-600 vs emerald-700が混在、実測23件/18件）
- **[Ops]** 本番環境変数の棚卸しドキュメント化（`.env.example` ⇔ Railway Variablesの突合）
- **[Ops]** TiDB Cloud自動バックアップ確認＋定期エクスポートスクリプト整備
- **[Growth]** 駅/用途SEOページへの実`<a href>`内部リンク追加（現状JS navigate()のみ）
- **[Growth]** ProductDetail/SellerDetail/Map/Niche/Results/SearchページにHelmet実装（現状汎用titleを共有）
- **[Content]** `dedupe-products.mjs`の重複検出ロジック強化（名前+ブランドの緩いキーで24グループの残存重複を確認済み。例:マルセイバターサンドが3ID併存）
- **[Content]** 売り場店舗名の表記ゆれ正規化（例:「ピエール・エルメ・パリ 新宿伊勢丹」表記3種類）
- **[QA]** `products.search`/`products.get`への統合テスト追加
- **[QA]** `vitest.config.ts`のinclude範囲をclient/srcに拡張（現状フロントのテストが物理的に実行不可能）

---

## ⚪ Low Priority

- **[Dev]** `server/db.ts`(1308行)をドメイン別ファイルに分割
- **[Dev]** `server/storage.ts`のアップロード時サイズ/MIME制限を確認
- **[Design]** 楽天検索CTAを視覚的にセカンダリ色へトーンダウン（公式サイトとの確実性の違いを明示）
- **[Ops]** Sentry等のエラー監視導入検討
- **[Growth]** `twitter:card`メタタグ追加
- **[Content]** `data-export/meta.json`の陳腐化解消（自動更新化）
- **[QA]** 主要フローのE2Eテスト基盤（Playwright）導入検討
- **[QA]** `admin.test.ts`のSellerDetail関連テストを実装本体からimportする形に是正

---

## 運用メモ

- タスク着手前に該当ファイルを実際に読み直し、この分析時点から状況が変わっていないか確認すること（特に直近作業でproductsデータや商品ページを触っている場合）。
- 完了したタスクはこのファイルから削除せず、取り消し線または「✅ 完了(日付)」を付記して履歴として残す。
- 新しい課題を発見したら、担当ロールのセクションに追記しPMに報告する。
