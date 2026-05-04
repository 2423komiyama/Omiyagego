# Omiyage Go — プロジェクト完全移管レポート

**作成日**: 2026年5月4日  
**対象リポジトリ**: [https://github.com/2423komiyama/Omiyagego](https://github.com/2423komiyama/Omiyagego)  
**本番URL**: [https://omiyagego-axrcumbv.manus.space](https://omiyagego-axrcumbv.manus.space)

---

## 1. GitHubへのソースコードエクスポート

### 実施済み内容

最新チェックポイント（`6aef53d2`）のソースコードを以下のリポジトリに正常プッシュ済みです。

```
Repository: https://github.com/2423komiyama/Omiyagego.git
Branch:     main
Commit:     6aef53d2
```

### リポジトリ構成

| ディレクトリ / ファイル | 役割 |
|---|---|
| `client/src/pages/` | 全27ページコンポーネント（Home・DBSearchPage・StationPage等） |
| `client/src/components/omiyage/` | アプリ固有コンポーネント（AppLayout・ProductCard・BottomNav等） |
| `client/src/lib/mockData.ts` | 施設マスター定義（FacilityId型・FACILITIES配列・PURPOSE_LIST等） |
| `client/src/contexts/` | SearchContext・HistoryContext・FavoritesContext・ThemeContext |
| `server/routers.ts` | tRPCルーター（products・facilities・sellers・admin等） |
| `server/routers/notifications.ts` | プッシュ通知ルーター（位置情報ベース近接通知） |
| `server/routers/collector.ts` | コレクター機能ルーター |
| `server/push.ts` | Web Push送信ロジック（VAPID認証） |
| `server/db.ts` | Drizzle ORMクエリヘルパー |
| `drizzle/schema.ts` | DBスキーマ（18テーブル定義） |
| `scripts/` | データ投入・エンリッチメント用スクリプト群（30本） |
| `package.json` | 依存関係（React 19・tRPC 11・Drizzle ORM等） |

### 環境変数（`.env.example` として管理すべき変数）

新環境でのセットアップ時に必要な環境変数は以下の通りです。Manus WebDevプラットフォームでは自動注入されますが、外部環境では手動設定が必要です。

| 変数名 | 用途 |
|---|---|
| `DATABASE_URL` | MySQL/TiDB接続文字列 |
| `JWT_SECRET` | セッションCookie署名 |
| `VITE_APP_ID` | Manus OAuth アプリケーションID |
| `OAUTH_SERVER_URL` | Manus OAuth バックエンドURL |
| `VITE_OAUTH_PORTAL_URL` | Manus ログインポータルURL |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push VAPID認証キー |
| `VITE_VAPID_PUBLIC_KEY` | フロントエンド用VAPIDパブリックキー |
| `RAKUTEN_APP_ID` / `RAKUTEN_ACCESS_KEY` | 楽天商品検索API認証情報 |
| `BUILT_IN_FORGE_API_KEY` / `BUILT_IN_FORGE_API_URL` | Manus内蔵LLM・画像生成API |
| `VITE_FRONTEND_FORGE_API_KEY` / `VITE_FRONTEND_FORGE_API_URL` | フロントエンド用Manus API |

---

## 2. プロジェクトの棚卸しと進捗状況

### 最終目標

**「外さない手土産を15分で決められる」モバイルファーストWebアプリ**。駅・空港などの施設でリアルタイムに購入できるお土産を、用途・予算・人数などの条件から絞り込み、売り場の場所まで案内する。

### 完了した主要タスク

| フェーズ | 内容 | 状態 |
|---|---|---|
| **データ基盤構築** | 1,611件の商品データ（楽天API画像65%取得・LLM詳細補完100%） | 完了 |
| **施設・売り場データ** | 全商品への売り場紐づけ（2,984件のmapUrl・walkMinutes補完） | 完了 |
| **画像補完** | 楽天API 1,049件 + Unsplash 562件 = 全商品画像カバー | 完了 |
| **Web Push通知** | VAPID設定・Service Worker・位置情報ベース近接通知 | 完了 |
| **お気に入り機能** | DB保存・お気に入り一覧ページ・近接通知との連携 | 完了 |
| **StationPage** | 施設ページ（売り場一覧・Googleマップリンク・徒歩分数） | 完了 |
| **DBProductDetail** | 商品詳細ページ（今買える場所・mapUrl・walkMinutes表示） | 完了 |
| **バグ修正** | facilityIdマッピング修正（shinjuku→shinjuku_station等） | 完了 |
| **名古屋・静岡PoC対応** | 名古屋駅67商品・セントレア8商品・静岡駅45商品・浜松駅3商品 | 完了 |
| **Admin画面** | 商品・施設・売り場・キュレーションリンク管理画面 | 完了 |
| **コレクター機能** | バッジ・ポイント・コレクションシステム | 完了 |

### 現在のDBデータ状況

| テーブル | 件数 | 備考 |
|---|---|---|
| `facilities` | 約20施設 | 東京・名古屋・大阪・静岡エリア |
| `products` | 1,611件 | 全国47都道府県対応 |
| `sellers` | 約2,984件 | 全商品に売り場紐づけ済み |
| `push_subscriptions` | 実環境依存 | PoC時に蓄積 |
| `favorites` | 実環境依存 | ユーザーごとに蓄積 |
| `area_trends` | 複数件 | エリアトレンドデータ |

### 主要施設カバレッジ

| エリア | 施設 | 商品数 |
|---|---|---|
| 東京 | 東京駅（グランスタ等） | 約300件 |
| 東京 | 羽田空港T1/T2/T3 | 各約100件 |
| 東京 | 新宿駅・渋谷駅・品川駅 | 各17〜40件 |
| 東京 | 新千歳空港 | 約100件 |
| 名古屋 | 名古屋駅・セントレア・栄・金山 | 67+8件 |
| 静岡 | 静岡駅・浜松駅・新富士駅・三島駅 | 45+3件 |
| 大阪 | 大阪駅・関西空港 | 約100件 |

### 現在の正確なステータス

テスト38/38パス。本番URL（`omiyagego-axrcumbv.manus.space`）にデプロイ済み。3月30日の名古屋PoCに向けた準備が完了した状態。

### 次に着手すべきこと（優先順位順）

1. **名古屋PoCの実施と結果フィードバック反映**（3月30日）
   - プッシュ通知が名古屋市内で正常に届くか確認
   - 「ぴよりん」「ういろう」等のキーワード検索が機能するか確認
   - 浜松駅・新富士駅の商品データを追加（現在各3件と少ない）

2. **口コミ・レビュー機能の活性化**
   - 現在レビュー数がゼロの商品が多い
   - LLMでサンプルレビューを生成してDBに登録し、商品詳細ページを充実化

3. **検索精度の向上**
   - `/db-search` の全文検索に「売り場名」「メーカー名」を追加
   - 「グランスタ お土産」「名古屋駅 手土産」のような複合クエリ対応

4. **品川駅・新宿駅・渋谷駅の商品データ充実**
   - 現在17〜40件と少ないため、エキュート品川・ルミネ・渋谷ヒカリエの商品を追加

5. **ユーザー認証フローの最終確認**
   - Manus OAuthを使ったログイン・ログアウトの動作確認
   - マイページ・お気に入りのセッション維持確認

---

## 3. 再現用マスター・プロンプト

新しい環境のAI（Manus）がこのプロジェクトを即座に理解し、開発を続行するための初期指示プロンプトです。

---

```
# Omiyage Go — プロジェクト継続指示

## プロジェクト概要
「Omiyage Go」は「外さない手土産を15分で決める」をコンセプトにしたモバイルファーストWebアプリです。
駅・空港などの施設でリアルタイムに購入できるお土産を、用途・予算・人数などの条件から絞り込み、
売り場の場所（フロア・徒歩分数・Googleマップリンク）まで案内します。

## 技術スタック
- フロントエンド: React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui + Wouter（ルーティング）
- バックエンド: Express 4 + tRPC 11 + Drizzle ORM（MySQL/TiDB）
- 認証: Manus OAuth（セッションCookie）
- プッシュ通知: Web Push API（VAPID）+ Service Worker
- 画像: 楽天API + Unsplash（S3にキャッシュ）
- デプロイ: Manus WebDev（https://omiyagego-axrcumbv.manus.space）

## GitHubリポジトリ
https://github.com/2423komiyama/Omiyagego.git

## プロジェクトパス（Manus WebDev環境）
/home/ubuntu/omiyage-go

## デザイン哲学
- 駅案内板スタイル：最短で用途を選ばせる
- カラー: エメラルドグリーン（#059669）をプライマリカラーに使用
- モバイルファースト（スマートフォン縦持ちを基準）
- BottomNavigation + サイドバー（デスクトップ）の二重ナビゲーション

## DBスキーマ（主要テーブル）
- facilities: 施設マスター（id・name・address・latitude・longitude・openHours等）
- products: 商品（id・name・price・prefecture・category・realImageUrl・makerName等）
- sellers: 売り場（facilityId・productId・floor・mapUrl・walkMinutes・openHours等）
- users: ユーザー（id・openId・name・role）
- favorites: お気に入り（userId・productId）
- push_subscriptions: プッシュ通知購読（userId・endpoint・keys）
- reviews: レビュー（productId・userId・rating・comment）
- badges/collections: コレクター機能

## 主要ページ（ルーティング）
- /: ホーム（用途選択・施設フィルタ・位置情報連携）
- /db-search: 商品検索（全文検索・フィルタ）
- /db-product/:id: 商品詳細（今買える場所・売り場情報・レビュー）
- /station/:facilityId: 施設ページ（売り場一覧・Googleマップリンク）
- /station/:facilityId/purpose/:purposeId: 施設×用途絞り込みページ
- /db-favorites: お気に入り一覧
- /admin: 管理画面（商品・施設・売り場・キュレーションリンク管理）
- /collector: コレクター機能（バッジ・ポイント）

## facilityIdのマッピングルール
mockData.tsのFACILITIES配列とrouters.tsのFACILITY_ID_MAPの両方を更新すること。
DBのfacilityId（例: shinjuku_station）とフロントエンドのfacilityId（例: shinjuku）が
異なる場合があるため、FACILITY_ID_MAP_FRONT（StationPage.tsx）でマッピングしている。

## 現在のデータ状況
- 商品: 1,611件（全国47都道府県）
- 売り場: 約2,984件（全商品カバー済み）
- 施設: 約20施設（東京・名古屋・大阪・静岡エリア）

## 直近の課題（優先順位順）
1. 名古屋PoCフィードバック反映（プッシュ通知・検索の動作確認）
2. 口コミ・レビュー機能の活性化（LLMでサンプルレビュー生成）
3. 検索精度向上（売り場名・メーカー名を全文検索に追加）
4. 品川駅・新宿駅・渋谷駅の商品データ充実（現在17〜40件）
5. ユーザー認証フローの最終確認

## 開発時の注意事項
- tRPCルーターはserver/routers.tsに集約（150行超えたらserver/routers/に分割）
- DBスキーマ変更後は必ずpnpm db:pushを実行
- テストはpnpm testで実行（vitest、現在38テスト全パス）
- 環境変数はwebdev_request_secretsツールで管理（.envを直接編集しない）
- 静的アセットはS3経由（manus-upload-file --webdevで取得したURLを使用）
- facilityIdのマッピングを変更する場合は以下3箇所を同時に更新すること:
  1. client/src/lib/mockData.ts（FacilityId型・FACILITIES配列）
  2. client/src/pages/StationPage.tsx（FACILITY_META・FACILITY_ID_MAP_FRONT）
  3. server/routers.ts（FACILITY_ID_MAP × 2箇所）
```

---

## 4. 保存すべき成果物（Artifacts）リスト

### コードファイル（GitHubリポジトリに含まれる）

| ファイル | 役割 |
|---|---|
| `client/src/pages/Home.tsx` | ホーム画面（位置情報連携・施設フィルタ・用途選択・ヒーローバナー） |
| `client/src/pages/DBSearchPage.tsx` | 全文検索ページ（フィルタ・ソート・無限スクロール） |
| `client/src/pages/DBProductDetail.tsx` | 商品詳細ページ（今買える場所・売り場情報・レビュー・お気に入り） |
| `client/src/pages/StationPage.tsx` | 施設ページ（FACILITY_META・売り場一覧・Googleマップリンク） |
| `client/src/pages/AdminDashboard.tsx` | 管理ダッシュボード |
| `client/src/pages/AdminProducts.tsx` | 商品管理画面（CRUD） |
| `client/src/pages/AdminFacilities.tsx` | 施設管理画面（CRUD） |
| `client/src/pages/AdminSellers.tsx` | 売り場管理画面（CRUD） |
| `client/src/lib/mockData.ts` | 施設マスター定義（FacilityId型・FACILITIES・PURPOSE_LIST・NATIONAL_PRODUCTS） |
| `server/routers.ts` | tRPCルーター全体（products・facilities・sellers・admin・user等） |
| `server/routers/notifications.ts` | プッシュ通知ルーター（位置情報ベース近接通知・VAPID） |
| `server/push.ts` | Web Push送信ロジック |
| `drizzle/schema.ts` | DBスキーマ（18テーブル） |
| `client/public/sw.js` | Service Worker（プッシュ通知受信・バックグラウンド処理） |

### データ投入スクリプト（`scripts/`ディレクトリ）

| スクリプト | 役割 |
|---|---|
| `seed-facilities.mjs` | 施設マスターデータ初期投入 |
| `seed-nagoya-shizuoka-facilities.mjs` | 名古屋・静岡エリア施設データ投入 |
| `seed-nagoya-shizuoka-products.mjs` | 名古屋・静岡エリア商品・売り場データ投入 |
| `import-7prefectures.mjs` | 7都道府県商品データ一括投入 |
| `enrich-products-v2.mjs` | LLMによる商品詳細データ補完（makerName・reasonsToChoose等） |
| `fetch-product-images.mjs` | 楽天API商品画像取得 |
| `fill-seller-mapurl.mjs` | 売り場のmapUrl・walkMinutes一括補完 |
| `add-missing-sellers.mjs` | 売り場未登録商品への売り場追加 |
| `generate-curated-links.mjs` | キュレーションリンク自動生成 |
| `migrate-mockdata.mjs` | モックデータからDBへのマイグレーション |

### 設計ドキュメント（このレポート）

| ドキュメント | 内容 |
|---|---|
| `omiyage-go-handover.md`（本ファイル） | プロジェクト移管レポート（GitHub出力・進捗・マスタープロンプト・成果物リスト） |
| `todo.md`（リポジトリ内） | 全タスクの完了状況（263行、全フェーズの作業履歴） |

---

## 5. 補足情報

### Manus WebDev固有の制約事項

新しい環境（Manus以外）でホスティングする場合、以下の点に注意が必要です。

**認証**: 現在Manus OAuth（`/api/oauth/callback`）を使用しています。外部環境では独自の認証システム（NextAuth.js・Auth0等）への置き換えが必要です。

**LLM・画像生成API**: `server/_core/llm.ts`・`server/_core/imageGeneration.ts` はManus内蔵APIを使用しています。外部環境ではOpenAI APIキー等への置き換えが必要です。

**ファイルストレージ**: `server/storage.ts` はManus内蔵S3を使用しています。外部環境ではAWS S3等への設定変更が必要です。

**Googleマップ**: `client/src/components/Map.tsx` はManusプロキシ経由でGoogle Maps APIを使用しています。外部環境ではGoogle Maps APIキーが必要です。

### 開発コマンド

```bash
# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# テスト実行
pnpm test

# DBスキーマ反映
pnpm db:push

# コードフォーマット
pnpm format
```

### チェックポイント履歴（直近5件）

| チェックポイントID | 内容 |
|---|---|
| `6aef53d2` | 名古屋・静岡PoC対応データ充実化完了（**最新・現在のmain**） |
| `2a4ab6c9` | StationPageのfacilityIdマッピングバグ修正 |
| `ef949fe4` | 売り場情報充実化UIの完成 |
| `e3ddc3a` | Web Push通知基盤・お気に入り機能実装 |
| `3d51be6` | 全1,611件商品データ充実化完了 |
