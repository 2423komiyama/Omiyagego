import "dotenv/config";
import { getDb } from "../server/db";
import { products } from "../drizzle/schema";
import { writeFileSync } from "fs";
import { asc } from "drizzle-orm";

async function exportProducts() {
  const db = await getDb();
  if (!db) throw new Error("DB connection failed");

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      brand: products.brand,
      prefecture: products.prefecture,
      category: products.category,
    })
    .from(products)
    .orderBy(asc(products.prefecture));

  // 都道府県別にグループ化
  const byPrefecture: Record<string, typeof rows> = {};
  for (const row of rows) {
    const pref = row.prefecture ?? "不明";
    if (!byPrefecture[pref]) byPrefecture[pref] = [];
    byPrefecture[pref].push(row);
  }

  writeFileSync(
    "/home/ubuntu/products_by_prefecture.json",
    JSON.stringify(byPrefecture, null, 2),
    "utf-8"
  );

  console.log(`Total: ${rows.length} products across ${Object.keys(byPrefecture).length} prefectures`);
  for (const [pref, items] of Object.entries(byPrefecture)) {
    console.log(`  ${pref}: ${items.length}件`);
  }
}

exportProducts().catch(console.error);
