// data-export/products.json 内の完全重複商品（名前・ブランド・価格・都道府県・カテゴリが
// 全て一致するもの）を1件に集約し、sellersのproductId参照を生き残ったIDへ付け替える。
// 使い方:
//   node scripts/dedupe-products.mjs           # data-export/*.json を上書き（ローカルファイルのみ）
//   node scripts/dedupe-products.mjs --apply-db  # さらに本番DB（DATABASE_URL）にも反映
//
// 生き残らせる基準: 同グループ内で作成日(createdAt)が最も古いものを残す
//   （最初に登録されたレコード＝いいね数などの実績が付いている可能性が高いため）。

import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data-export");
const applyDb = process.argv.includes("--apply-db");

const products = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "products.json"), "utf8"));
const sellers = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "sellers.json"), "utf8"));

const dupKey = p => `${p.name}|${p.brand}|${p.price}|${p.prefecture}|${p.category}`;

const groups = new Map();
for (const p of products) {
  const key = dupKey(p);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(p);
}

const idRemap = new Map(); // 削除されるID -> 生き残るID
const keptProducts = [];

for (const group of groups.values()) {
  if (group.length === 1) {
    keptProducts.push(group[0]);
    continue;
  }
  // createdAtが最も古いものを残す
  const sorted = [...group].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const survivor = sorted[0];
  keptProducts.push(survivor);
  for (const dup of sorted.slice(1)) {
    idRemap.set(dup.id, survivor.id);
  }
}

console.log(`products: ${products.length} -> ${keptProducts.length} (removed ${idRemap.size})`);

// sellersのproductId付け替え。付け替え後に同一(productId, facilityId, storeName)の重複が
// 発生する場合は1件に統合する。
const remappedSellers = sellers.map(s => ({
  ...s,
  productId: idRemap.get(s.productId) ?? s.productId,
}));

const sellerKey = s => `${s.productId}|${s.facilityId}|${s.storeName}`;
const sellerGroups = new Map();
for (const s of remappedSellers) {
  const key = sellerKey(s);
  if (!sellerGroups.has(key)) sellerGroups.set(key, s);
}
const dedupedSellers = [...sellerGroups.values()];
console.log(`sellers: ${sellers.length} -> ${dedupedSellers.length} (after productId remap + reseller-dedup)`);

fs.writeFileSync(path.join(DATA_DIR, "products.json"), JSON.stringify(keptProducts, null, 1));
fs.writeFileSync(path.join(DATA_DIR, "sellers.json"), JSON.stringify(dedupedSellers, null, 1));
console.log("data-export/products.json, sellers.json updated.");

// curated_links.jsonのproductId付け替えも忘れず
const curatedLinksPath = path.join(DATA_DIR, "curated_links.json");
if (fs.existsSync(curatedLinksPath)) {
  const links = JSON.parse(fs.readFileSync(curatedLinksPath, "utf8"));
  const remappedLinks = links.map(l => ({
    ...l,
    productId: idRemap.get(l.productId) ?? l.productId,
  }));
  fs.writeFileSync(curatedLinksPath, JSON.stringify(remappedLinks, null, 1));
  console.log(`curated_links.json: productId remapped (${links.length} rows)`);
}

if (applyDb) {
  const { drizzle } = await import("drizzle-orm/mysql2");
  const { products: productsTable, sellers: sellersTable } = await import("../drizzle/schema.ts");
  const { inArray, eq } = await import("drizzle-orm");

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set; skipping DB apply.");
    process.exit(1);
  }

  const db = drizzle({
    connection: {
      uri: process.env.DATABASE_URL,
      ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    },
  });

  const removeIds = [...idRemap.keys()];
  console.log(`Applying to DB: reassigning sellers, then deleting ${removeIds.length} duplicate products...`);

  // 1. sellersのproductIdを本番DB上でも付け替え（削除される商品を参照しているsellerのみ）
  for (const [oldId, newId] of idRemap.entries()) {
    await db.update(sellersTable).set({ productId: newId }).where(eq(sellersTable.productId, oldId));
  }

  // 2. 重複productIdを削除
  for (let i = 0; i < removeIds.length; i += 50) {
    const batch = removeIds.slice(i, i + 50);
    await db.delete(productsTable).where(inArray(productsTable.id, batch));
    console.log(`deleted ${Math.min(i + 50, removeIds.length)}/${removeIds.length}`);
  }

  console.log("DB apply complete.");
}
