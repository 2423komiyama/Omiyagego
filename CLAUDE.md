# CLAUDE.md

Omiyage Go を「開発・デザイン・運用・マーケ・データ・QA」を内包した仮想事業部として自律的に開発していくためのルールブック。Claude Code がこのプロジェクトで作業する際、担当領域ごとにこのファイルの該当セクションを参照する。

---

## このプロジェクトについて

**Omiyage Go** =「外さない手土産を15分で決める」モバイルWebアプリ。
元はManus WebDevで開発、Claude Codeに全面移管済み（2026-07-04〜）。

- リポジトリ: `/Users/fitfounderkomiyamakyousuke/Documents/omiyage-go`（github.com/2423komiyama/Omiyagego, main）
- 技術: React 19 + tRPC 11 + Drizzle ORM(MySQL/TiDB Cloud) + Express, pnpm, vitest
- 本番: Railway (`https://omiyagego-production.up.railway.app`)、DBはTiDB Cloud Serverless
- 移管の経緯・詳細: `HANDOVER.md`、データ運用: `DATA_MANAGEMENT.md`

---

## チーム編成（仮想事業部）

このプロジェクトは以下6ロール＋PM(メインセッション)で運営する。作業を依頼・分担する際は該当ロールの担当ディレクトリと視点に沿うこと。エージェント間で担当が被る変更（例: UIとデータ構造の両方に跨る）は、影響範囲全体を1エージェントが通しで見るか、事前にPMが調整すること。

| ロール | 担当ディレクトリ | 視点 |
|---|---|---|
| **PM/ディレクター**（メインセッション） | 全体 | ゴール管理・タスク分解・各ロールへの割当・成果物の最終確認・git操作 |
| **Dev**（バックエンド） | `server/`, `server/_core/`, `server/routers/`, `server/routes/`, `drizzle/`, `shared/_core/`, `shared/types.ts` | tRPC・DB・認証・型安全性・整合性・パフォーマンス |
| **Design**（UI/UX） | `client/src/pages/*.tsx`（見た目・導線）, `client/src/components/omiyage/*`, `client/src/components/ui/*`, Tailwindトークン | 一貫性・アクセシビリティ・レスポンシブ・導線の分かりやすさ |
| **Ops**（インフラ/運用） | `railway.json`, `.github/`, `.env.example`, `drizzle.config.ts`, `server/_core/index.ts`, `.claude/launch.json`, デプロイ関連ドキュメント | 再現性・可観測性・CI/CD・障害耐性 |
| **Growth**（マーケ/SEO） | `client/index.html`, 各ページのHelmet/OGP/構造化データ, `robots.txt`/`sitemap.xml` | 検索流入・シェア最適化・コピーライティング |
| **Content**（データマネジメント） | `data-export/`, `drizzle/schema.ts`（データ設計面）, `scripts/`（データ整形・投入）, `DATA_MANAGEMENT.md` | データ品質・構造化・カテゴリ/タグ設計・重複排除 |
| **QA**（品質保証） | `vitest.config.ts`, `server/*.test.ts`, `client/src/**/*.test.tsx`, `e2e/`, `.github/workflows/*.yml` | ユーザー視点でのバグ発見・テストカバレッジ・リグレッション防止 |

担当外ディレクトリを触る必要がある変更は、変更理由をコミットメッセージに明記し、影響を受けるロールの観点（例: DBスキーマ変更はDevだけでなくContentのデータ品質にも影響）を一言添える。

---

## 開発ルール（全ロール共通）

- 既存トーン・命名・構造を尊重。大きな構造変更（DBスキーマ変更、ルーティング再設計等）は事前にPMに相談してから着手。
- コミット前に `pnpm check`（tsc）・`pnpm test`（vitest）を通すこと。UI変更は必ずブラウザで実際に動作確認してから完了報告する。
- **データ系の変更は `data-export/*.json` を直接の正とし、そこから本番DBへ反映するスクリプトを `scripts/` に置く**（本番DBを手編集で直接いじらない。反映は `--apply-db` フラグ付きスクリプト経由で行い、実行結果をログで確認する）。
- 本番DBへの書き込み・削除を伴うスクリプトは、実行前に必ずユーザーの承認を得る（ローカルdata-export更新だけなら承認不要、`--apply-db`実行は要承認）。
- meta情報や集計値（`data-export/meta.json`等）を書き換えるスクリプトを追加した場合、実行のたびに自動更新されるようにする（手動で数値だけ書き換えない）。

### 既知の落とし穴（踏み直さないこと）

- **Node実行**: このマシンにはbrew版nodeが無く、`~/.local/node22/bin`をPATHに追加して使う。`.claude/launch.json`の`omiyage-dev`設定を参照。
- **TiDB Cloud接続**: `server/db.ts`の`requiresTls()`がホスト名`.tidbcloud.com`/`.psdb.cloud`を見てTLSを自動判定する。この判定漏れは全クエリのサイレント失敗＝OAuthログイン失敗など全く別の症状として現れるので注意。
- **drizzle-orm + mysql2の一括insertバグ**: autoincrement整数PKに明示的な`id`値を渡すと「Duplicate entry '?'」という意味不明なエラーになる。該当カラムはinsert対象から除外し自動採番に任せる（varchar PKでは問題ない）。
- **GitHub認証**: リポジトリ所有者は`2423komiyama`アカウント。push権限は`2423komiyama`でdevice flow認証すること。
- **Railwayの環境変数**: `VITE_`プレフィックスの変数はビルド時に埋め込まれるため、フロントで使う値（例: 楽天アフィリエイトID）を追加する際は`.env`・`.env.example`・Railway Variablesの3箇所に同じキーを追加し、Railway側もDeployし直す必要がある。
- **Railway UIの操作**: bulk pasteでの変数入力はフィールドの取り違えを起こしやすい。1フィールドずつクリック→入力→スクリーンショット確認する。座標クリックが効かない場合は`read_page`でrefを取得してrefクリックする。
- **楽天商品検索API**: Referer制限があり、登録済みドメイン（`omiyagego-production.up.railway.app`）から実際にクライアントサイドJSで叩く必要がある。Node.jsサーバーサイドの`fetch()`ではReferer headerが送れず失敗する。

---

## 正直さルール

- 実データに基づかない誇張・架空の数値・未検証の主張はしない。特にGrowth/Content領域は「実測した」「grepで確認した」等、根拠を明示する。
- 商品データの補完（画像・リンク等）は、ブランド名など一意性を確認できた場合のみ反映する。推測でのマッチングは行わない。

---

## 参考ドキュメント

- `HANDOVER.md` — Manus移管の完全レポート
- `DATA_MANAGEMENT.md` — データ運用ルール
- `TEAM_TASKS.md` — 各ロールの現状分析と共有タスクリスト（本ファイルの姉妹ドキュメント、定期更新）
