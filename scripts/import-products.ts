/**
 * Gemini生成データをデータベースにインポートするスクリプト
 * 使用方法: pnpm exec tsx scripts/import-products.ts <jsonファイルパス>
 *
 * 対応形式:
 * 1. { "products": [...] } 形式
 * 2. [ {...}, {...} ] 形式（配列のみ）
 * 3. 都道府県ごとに分割された複数ファイル
 */

import * as fs from "fs";
import * as path from "path";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import * as dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

// ── JSON クリーニング関数 ─────────────────────────────────────
function cleanJsonText(text: string): string {
  // コメントを除去（// から行末まで）
  let cleaned = text.replace(/\s*\/\/[^\n]*/g, "");
  // /* */ コメントを除去
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
  // 末尾カンマを除去（, の後に } または ] が続く場合）
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");
  // Windows改行を統一
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return cleaned.trim();
}

// ── JSONパース（エラー回復付き） ──────────────────────────────
function parseJsonSafe(text: string): unknown[] {
  const cleaned = cleanJsonText(text);

  // 形式1: { "products": [...] }
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj.products)) return obj.products;
      // 最初の配列フィールドを返す
      for (const val of Object.values(obj)) {
        if (Array.isArray(val)) return val;
      }
    }
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // 形式2: 配列のみ（[ {...}, ... ]）
    try {
      const parsed = JSON.parse("[" + cleaned + "]");
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // 形式3: 複数オブジェクトが並んでいる
      const objects: unknown[] = [];
      const regex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
      let match;
      while ((match = regex.exec(cleaned)) !== null) {
        try {
          objects.push(JSON.parse(match[0]));
        } catch {
          // スキップ
        }
      }
      if (objects.length > 0) return objects;
    }
  }

  throw new Error("JSONのパースに失敗しました。形式を確認してください。");
}

// ── 商品データのバリデーション ────────────────────────────────
interface RawProduct {
  id?: string;
  name?: string;
  brand?: string;
  description?: string;
  price?: number | string;
  imageUrl?: string | null;
  prefecture?: string;
  region?: string;
  category?: string;
  shelfLife?: number | string;
  isIndividualPackaged?: boolean;
  servingSize?: number | string;
  guaranteeReason?: string[] | string;
  makerStory?: string;
  badges?: string[] | string;
}

function validateAndNormalize(raw: RawProduct, index: number): schema.InsertProduct | null {
  // 必須フィールドチェック
  if (!raw.name || typeof raw.name !== "string") {
    console.warn(`  ⚠️  [${index}] name が不正: ${JSON.stringify(raw.name)}`);
    return null;
  }
  if (!raw.brand || typeof raw.brand !== "string") {
    console.warn(`  ⚠️  [${index}] brand が不正: ${JSON.stringify(raw.brand)}`);
    return null;
  }
  if (!raw.prefecture || typeof raw.prefecture !== "string") {
    console.warn(`  ⚠️  [${index}] prefecture が不正: ${JSON.stringify(raw.prefecture)}`);
    return null;
  }

  const price = typeof raw.price === "string" ? parseInt(raw.price, 10) : (raw.price ?? 0);
  if (isNaN(price) || price < 0) {
    console.warn(`  ⚠️  [${index}] price が不正: ${JSON.stringify(raw.price)}`);
    return null;
  }

  // IDを生成（なければインデックスから）
  const id = raw.id ?? `p-import-${String(index).padStart(4, "0")}`;

  // 配列フィールドの正規化
  const guaranteeReason = Array.isArray(raw.guaranteeReason)
    ? JSON.stringify(raw.guaranteeReason)
    : typeof raw.guaranteeReason === "string"
    ? raw.guaranteeReason
    : "[]";

  const badges = Array.isArray(raw.badges)
    ? JSON.stringify(raw.badges)
    : typeof raw.badges === "string"
    ? raw.badges
    : "[]";

  return {
    id,
    name: raw.name,
    brand: raw.brand,
    description: raw.description ?? null,
    price,
    imageUrl: raw.imageUrl ?? null,
    prefecture: raw.prefecture,
    region: raw.region ?? "その他",
    category: raw.category ?? "その他",
    shelfLife: raw.shelfLife ? Number(raw.shelfLife) : null,
    isIndividualPackaged: raw.isIndividualPackaged ?? false,
    servingSize: raw.servingSize ? Number(raw.servingSize) : null,
    guaranteeReason,
    makerStory: raw.makerStory ?? null,
    badges,
  };
}

// ── メイン処理 ────────────────────────────────────────────────
async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("使用方法: pnpm exec tsx scripts/import-products.ts <jsonファイルパス>");
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ ファイルが見つかりません: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`📂 ファイル読み込み: ${absolutePath}`);
  const fileContent = fs.readFileSync(absolutePath, "utf-8");

  console.log("🔍 JSONパース中...");
  let rawProducts: unknown[];
  try {
    rawProducts = parseJsonSafe(fileContent);
  } catch (err) {
    console.error(`❌ JSONパースエラー: ${(err as Error).message}`);
    process.exit(1);
  }

  console.log(`📊 パース完了: ${rawProducts.length} 件`);

  // バリデーション
  console.log("✅ バリデーション中...");
  const validProducts: schema.InsertProduct[] = [];
  const skipped: number[] = [];

  for (let i = 0; i < rawProducts.length; i++) {
    const normalized = validateAndNormalize(rawProducts[i] as RawProduct, i + 1);
    if (normalized) {
      validProducts.push(normalized);
    } else {
      skipped.push(i + 1);
    }
  }

  console.log(`✅ 有効: ${validProducts.length} 件 / スキップ: ${skipped.length} 件`);

  if (validProducts.length === 0) {
    console.error("❌ 有効な商品データがありません");
    process.exit(1);
  }

  // データベース接続
  console.log("🔌 データベース接続中...");
  const connection = await mysql.createConnection(DATABASE_URL!);
  const db = drizzle(connection, { schema, mode: "default" });

  // バッチインサート（50件ずつ）
  const BATCH_SIZE = 50;
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  console.log(`💾 データベースへの登録開始（${validProducts.length} 件）...`);

  for (let i = 0; i < validProducts.length; i += BATCH_SIZE) {
    const batch = validProducts.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(validProducts.length / BATCH_SIZE);

    process.stdout.write(`  バッチ ${batchNum}/${totalBatches} (${batch.length} 件)... `);

    for (const product of batch) {
      try {
        // UPSERT: 同じIDが存在する場合は更新
        await db
          .insert(schema.products)
          .values(product)
          .onDuplicateKeyUpdate({
            set: {
              name: product.name,
              brand: product.brand,
              description: product.description,
              price: product.price,
              imageUrl: product.imageUrl,
              prefecture: product.prefecture,
              region: product.region,
              category: product.category,
              shelfLife: product.shelfLife,
              isIndividualPackaged: product.isIndividualPackaged,
              servingSize: product.servingSize,
              guaranteeReason: product.guaranteeReason,
              makerStory: product.makerStory,
              badges: product.badges,
            },
          });
        inserted++;
      } catch (err) {
        console.error(`\n  ❌ エラー (${product.id}): ${(err as Error).message}`);
        errors++;
      }
    }

    console.log("✓");
  }

  await connection.end();

  console.log("\n📈 インポート完了:");
  console.log(`  ✅ 成功: ${inserted} 件`);
  console.log(`  ⚠️  スキップ: ${skipped.length} 件`);
  console.log(`  ❌ エラー: ${errors} 件`);
  console.log(`  合計: ${rawProducts.length} 件`);
}

main().catch((err) => {
  console.error("❌ 予期しないエラー:", err);
  process.exit(1);
});
