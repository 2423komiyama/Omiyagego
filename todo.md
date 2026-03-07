# Omiyage Go - Project TODO

## Core Features (Completed)
- [x] Core UI/UX implementation (5 main screens: Home, Search Conditions, Results, Product Detail, Store Detail)
- [x] Reusable components (badges, chips, guarantee cards, facility tags)
- [x] Google Maps integration with clustering, route guidance, and traffic layers
- [x] Favorites functionality with LocalStorage persistence and comparison modal
- [x] Search history and browsing history with re-search feature
- [x] Share functionality (LINE, X/Twitter, URL copy, Web Share API)
- [x] Free-text search page with real-time filtering
- [x] Nationwide souvenir database (98 products from 15 major tourist regions)
- [x] Geolocation integration with user location detection
- [x] Regional filtering with prefecture-level search
- [x] Database schema migration (5 tables created)
- [x] Project upgraded to full-stack (web-db-user template)

## Admin Panel Implementation (Complete)
- [x] Database query helpers in server/db.ts
- [x] Admin dashboard scaffolding with DashboardLayout
- [x] Admin routing setup (/admin, /admin/products, etc.)
- [x] Admin authentication check (role-based access control)
- [x] Product management page UI (list view with CRUD buttons)
- [x] Product form page (add/edit form with all required fields)
- [x] tRPC API endpoints for admin operations (list, get, create, update, delete)
- [x] Connect frontend forms to tRPC mutations
- [x] Implement database persistence for product CRUD (createProduct, updateProduct, deleteProduct)
- [x] Add facility management page
- [x] Add seller/location management page (placeholder)
- [x] Add data migration page (mockData.ts → PostgreSQL)

## Frontend Integration
- [x] Update AdminProducts.tsx to use trpc.admin.products.list query
- [x] Update AdminProductForm.tsx to use trpc.admin.products.create/update mutations
- [x] Add loading states and error handling in admin pages
- [x] Add toast notifications for success/error feedback
- [x] Add form validation with better error messages
- [x] Add auto-refresh functionality after mutations (invalidate on mutation success)
- [x] Add JSON file upload functionality to AdminDataMigration

## Database & Backend
- [x] Implement actual database INSERT/UPDATE/DELETE in tRPC procedures
- [ ] Add transaction support for related data (product + sellers + giftMessages)
- [x] Create data migration page (AdminDataMigration.tsx) for mockData.ts and JSON import
- [ ] Add database indexes for performance
- [ ] Add audit logging for admin changes
- [x] Support JSON file upload from Gemini-generated data

## Testing
- [x] Write vitest tests for database query helpers (admin.test.ts)
- [ ] Write vitest tests for admin API endpoints (routers)
- [ ] Test admin authentication and authorization
- [ ] Test form validation and error handling
- [ ] Test product CRUD operations end-to-end

## Remaining Prefectures
- [ ] Add souvenirs from remaining 32 prefectures (currently only 15 covered)
- [ ] Update facility data for new regions
- [ ] Add regional seller information

## Deployment & Publishing
- [ ] Create checkpoint before publishing
- [ ] Verify all features work in production
- [ ] Set up admin user account
- [ ] Document admin panel usage

## 大規模データ収集（47都道府県 × 30件 = 1,410件）
- [x] Gemini向け都道府県別プロンプト（最終版）を作成（GEMINI_PROMPT_1410.md）
- [x] データベーススキーマを拡張（prefecture, imageUrl, region フィールド追加）
- [x] 一括インポートAPIエンドポイントを整備（JSON形式対応）
- [x] LLMで47都道府県のデータを並列生成（1,221件登録成功）
- [x] フロントエンド検索機能をデータベースに接続（DBSearchPage.tsx）
- [x] BottomNavの「探す」をDB検索ページに変更
- [x] ホーム画面の検索バーをDB検索ページに接続
- [x] 残り7県（沖縄・愛知・秋田・山形・岩手・宮崎・佐賀）のデータをLLMで生成しDBに登録（328件追加、合計1,549件）
- [x] 商品詳細ページをDBデータに対応（DBProductDetail.tsx新規作成、/db-product/:idルート追加）
- [x] チェックポイント保存・公開準備

## 追加作業（2026-03-04）
- [x] DB検索で新規登録商品が表示されないバグを修正（公開サイトで正常表示されていたことを確認）
- [x] 商品画像：Unsplashカテゴリ別フォールバック画像をDBProductDetail・NichePageに設定
- [x] 売り場データの充実（getSellersByProductIdをrouters.tsのproducts.getに結合、DBProductDetailに「今買える場所」セクション追加）
- [x] ニッチ土産特集ページ（/niche）の新規作成（NichePage.tsx、ホームバナー、地方タブ、グリッド表示）

## 追加作業（2026-03-04 #2）
- [x] ホームの「全国のお土産」セクションをDB連携に置き換え（bestseller/editorial商品をtRPCで取得、地方ショートカットを/db-searchに変更、HomeDBProductCardコンポーネント新規作成）

## 追加作業（2026-03-04 #3）
- [x] 主要売り場の実際の店舗情報をリサーチ
- [x] LLMで商品と売り場の紐づけデータを生成（第7地方並列実行）
- [x] 生成した売り場データをsellersテーブルに一括登録（2,735件登録完了）
- [x] 登録結果の検証・チェックポイント保存

## 追加作業（2026-03-04 #4）
- [x] DBにbrandUrlフィールドを追加（スキーマ変更・マイグレーション）
- [x] LLMで全商品のメーカー公式サイトURLを生成して一括登録（464件→1,221件、カバレッジ30%→79%）
- [x] DBProductDetailの「今買える場所」カードを売り場詳細ページへリンク
- [x] DBProductDetailの「メーカーについて」に公式サイトリンクボタンを追加
- [x] テスト・チェックポイント保存

## 追加作業（2026-03-07）
- [x] 残り1,089件のbrandUrlをLLMで生成・DB更新（合計1,221件、カバレッジ79%）

## 大規模改修（SEO流入最大化・お土産版食べログ化）

### Phase 2: DBスキーマ拡張
- [x] productsテーブルにpurposeTags, minPeople, maxPeople, editorialPick, editorialNote, externalLinksを追加
- [x] sellersテーブルにmapUrl, walkMinutes, topProductIdsを追加
- [x] likesテーブル新規作成（商品いいね、匿名対応）
- [x] reviewsテーブル新規作成（Step2用、テーブルのみ）
- [x] featuresテーブル新規作成（カルーセル特集カード）
- [x] pnpm db:pushでマイグレーション実行

### Phase 3: トップページ改修
- [x] React Helmet導入（SEOメタタグ管理）
- [x] カルーセル（特集カード）コンポーネント作成
- [x] 導線Ａ「今すぐ近くで買える」（駅/空港検索窓＋クイックボタン）
- [x] 導線Ｂ「どんなお土産を探す？」（用途＋制約プリセット）
- [x] ToC用途追加（家族、子供、恋人、友人、自分用）
- [x] PC/スマホレスポンシブ最適化

### Phase 4: 検索一覧（/db-search）強化
- [x] 制約フィルター追加（日持ち3/7/14日以上、個包装、予算帯、人数）
- [x] 並び替え追加（人気、編集部推記、日持ち長い、価格安い、新着）
- [x] 商品カード統一（商品名、店舗/ブランド、カテゴリ、都道府県、価格、日持ち、個包装、用途タグ）
- [x] ♡お気に入りボタン追加
- [x] 共有ボタン（URLコピー）追加
- [x] フィルター状態URLパラメータ化（noindex付与）
- [x] モバイル用ボトムシートフィルターUI

### Phase 5: 商品詳細ページ強化
- [x] 店舗カード強化（住所、地図リンク、改札内外、営業時間、徒歩分数）
- [x] 「この駅/空港のお土産一覧へ」導線追加
- [x] キュレーション枠（外部リンク：SNS/YouTube/記事）
- [x] いいねボタン実装（Step1、匿名対応）
- [x] OGP/構造化データ（Product Schema）設定
- [x] 将来機能（受け取り/配送）は非表示フラグで管理

### Phase 6: SEO入口ページ群
- [x] 駅/空港ページ（/station/:facilityId）作成（14施設対応）
- [ ] 駅/空港xd7用途ページ（/station/:facilityId/purpose/:purposeId）作成
- [ ] 店舗ページ（/store/:sellerId）作成
- [x] 用途ページ（/purpose/:purposeId）作成（8用途対応）
- [x] 各ページにOGP・構造化データ・FAQ・選び方ガイド設置
- [x] 相互内部リンク整備
- [x] ProductCardクラッシュ修正（sellers?.[]オプショナルアクセス）
- [x] テスト全件パス（38テスト）

## バグ修正（2026-03-07）
- [x] 「現在地近くのお土産」セクションが位置情報取得後も表示されなくなった問題を修正（DBから最寄り施設の商品を取得して表示するセクションを復元）
