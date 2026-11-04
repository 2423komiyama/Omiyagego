# DEPLOY.md — 環境変数棚卸し

`.env.example` に列挙されている環境変数の一覧と用途。**値そのものは書かない**（キー名と用途のみ）。
「Railway設定状況」列はこのタスクの実行環境からは確認できないため、PMが実際のRailway Variablesと突合して埋める運用とする。

## デプロイ設定

- ビルド/起動コマンドは `railway.json`（リポジトリ直下・新規追加）にNixpacksビルダー前提で明記。
  - `buildCommand`: `pnpm build`（`vite build && esbuild server/_core/index.ts ...`）
  - `startCommand`: `pnpm start`（`node dist/index.js`）
  - `healthcheckPath` は未設定（`/api/health` エンドポイントが未実装のため。実装後に追記する。CLAUDE.md / TEAM_TASKS.md では今週のスコープ外と明記されている）

## 環境変数一覧

| 変数名 | 用途 | Railway設定状況（要確認） |
|---|---|---|
| `DATABASE_URL` | MySQL/TiDB Cloud への接続文字列。アプリの全DBアクセスの起点。 | 要確認 |
| `JWT_SECRET` | セッションCookie署名用シークレット。 | 要確認 |
| `GOOGLE_CLIENT_ID` | Google OAuthログイン用クライアントID。未設定時は開発環境で自動ログインにフォールバック（本番では必須）。 | 要確認 |
| `GOOGLE_CLIENT_SECRET` | Google OAuthログイン用クライアントシークレット。 | 要確認 |
| `ANTHROPIC_API_KEY` | Claude API キー。コレクター機能（写真OCR）で使用。 | 要確認 |
| `ANTHROPIC_MODEL` | 使用するClaudeモデルID（任意・デフォルトあり）。コメントアウトされているが必要に応じて設定。 | 要確認 |
| `S3_ENDPOINT` | S3互換ストレージ（Cloudflare R2推奨）のエンドポイントURL。コレクター写真アップロード用。 | 要確認 |
| `S3_REGION` | S3互換ストレージのリージョン（R2の場合は`auto`）。 | 要確認 |
| `S3_BUCKET` | アップロード先バケット名。 | 要確認 |
| `S3_ACCESS_KEY_ID` | S3互換ストレージのアクセスキーID。 | 要確認 |
| `S3_SECRET_ACCESS_KEY` | S3互換ストレージのシークレットアクセスキー。 | 要確認 |
| `S3_PUBLIC_BASE_URL` | バケットを公開設定している場合の公開URLベース。未設定時は7日間有効な署名付きURLを返す。 | 要確認 |
| `VITE_GOOGLE_MAPS_API_KEY` | 地図表示（フロントエンド）用Google Maps APIキー。ビルド時に埋め込まれる（`VITE_`プレフィックス）。 | 要確認 |
| `VAPID_PUBLIC_KEY` | Web Push通知用VAPID公開鍵（サーバー側）。 | 要確認 |
| `VAPID_PRIVATE_KEY` | Web Push通知用VAPID秘密鍵（サーバー側）。 | 要確認 |
| `VITE_VAPID_PUBLIC_KEY` | Web Push通知用VAPID公開鍵（フロントエンド側・ビルド時埋め込み）。`VAPID_PUBLIC_KEY`と同じ値を設定する必要がある。 | 要確認 |
| `RAKUTEN_APP_ID` | 楽天商品検索APIのアプリID（データ投入スクリプト用）。 | 要確認 |
| `RAKUTEN_ACCESS_KEY` | 楽天商品検索APIのアクセスキー（データ投入スクリプト用）。 | 要確認 |
| `RAKUTEN_AFFILIATE_ID` | 楽天アフィリエイトID（サーバー側・データ投入スクリプト用）。 | 要確認 |
| `VITE_RAKUTEN_AFFILIATE_ID` | 楽天アフィリエイトID（フロントエンド側・購入リンク生成用・ビルド時埋め込み）。`RAKUTEN_AFFILIATE_ID`と同じ値を設定する必要がある。 | 要確認 |
| `OWNER_OPEN_ID` | 管理者権限を付与するユーザーのopenId（`google:xxxxx`形式・任意）。 | 要確認 |
| `VITE_GA_MEASUREMENT_ID` | GA4アクセス解析の測定ID（`G-XXXXXXXXXX`）。未設定なら計測コード自体を読み込まない安全な実装（`client/src/main.tsx`）。ビルド時埋め込み。 | 要確認（今回未導入・PMが後日発行） |

## 参考: コード内で検出されたが `.env.example` に未記載の変数

`grep` で `process.env.*` / `import.meta.env.*` を実測した結果、上記以外に以下のキーがコード内で参照されていた。用途未確認のため `.env.example` への追記は行っていない（本タスクの担当範囲は `.env.example` に既に列挙済みの変数の説明のみのため）。PMが要否を判断のうえ、必要なら別途 `.env.example` に追記されたい。

- `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` — `DATABASE_URL`と役割が重複する可能性（未使用の旧経路の可能性もあり要確認）
- `BUILT_IN_FORGE_API_KEY` / `BUILT_IN_FORGE_API_URL` — 用途不明（旧Manus環境由来の可能性）
- `VITE_APP_ID` — 用途不明
- `PORT` — Railwayが自動注入する起動ポート（Railway側で通常自動設定されるため、通常は手動設定不要）
- `NODE_ENV` — 実行モード（`production`/`development`）。Railwayでは通常自動的に`production`。
