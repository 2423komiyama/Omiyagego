import "dotenv/config";
import { getDb } from "../server/db";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { readFileSync } from "fs";

interface BrandUrlEntry {
  id: string;
  brandUrl: string | null;
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DB connection failed");

  // 生成結果JSONを読み込む
  const raw = JSON.parse(readFileSync("/home/ubuntu/generate_brand_urls.json", "utf-8"));

  // 全地方のデータを結合（URLがあるものだけ）
  const allEntries: BrandUrlEntry[] = [];
  for (const result of raw.results) {
    if (result.error) {
      console.log(`⏭ Skipping ${result.input}: error`);
      continue;
    }
    try {
      const items: BrandUrlEntry[] = JSON.parse(result.output.brand_url_json);
      const withUrl = items.filter((x) => x.brandUrl);
      allEntries.push(...withUrl);
      console.log(`✅ ${result.input}: ${withUrl.length}件のURLを追加`);
    } catch (e) {
      console.log(`⚠️  ${result.input}: JSON解析エラー、スキップ`);
    }
  }

  console.log(`\n合計 ${allEntries.length} 件のURLをDBに登録します...`);

  let success = 0;
  let failed = 0;

  for (const entry of allEntries) {
    try {
      await db
        .update(products)
        .set({ brandUrl: entry.brandUrl })
        .where(eq(products.id, entry.id));
      success++;
      if (success % 50 === 0) {
        console.log(`  ${success}/${allEntries.length} 件完了...`);
      }
    } catch (e) {
      console.error(`  ❌ ${entry.id}: ${e}`);
      failed++;
    }
  }

  console.log(`\n完了: 成功 ${success} 件 / 失敗 ${failed} 件`);
  process.exit(0);
}

main().catch(console.error);
