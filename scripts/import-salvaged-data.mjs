// data-export/*.json（旧本番からサルベージした実データ）を新DBへ投入する。
// 使い方: DATABASE_URL=... node scripts/import-salvaged-data.mjs
// スキーマは事前に `pnpm db:push` で作成しておくこと。

import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/mysql2";
import {
  facilities,
  products,
  sellers,
  reviews,
  curatedLinks,
} from "../drizzle/schema.ts";

const DATA_DIR = path.join(process.cwd(), "data-export");
const load = name => JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${name}.json`), "utf8"));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const db = drizzle({
  connection: {
    uri: process.env.DATABASE_URL,
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  },
});

async function insertBatched(table, rows, label, batchSize = 20) {
  if (rows.length === 0) {
    console.log(`${label}: 0 rows, skip`);
    return;
  }
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    try {
      await db.insert(table).values(batch);
    } catch (err) {
      const short = new Error(
        `${label} batch@${i}: ${err.cause?.sqlMessage ?? err.message}`.slice(0, 500)
      );
      throw short;
    }
    process.stdout.write(`\r${label}: ${Math.min(i + batchSize, rows.length)}/${rows.length}`);
  }
  console.log();
}

// timestamp文字列をDateへ、undefinedフィールドを除去
function normalizeDates(row, dateFields) {
  const out = { ...row };
  for (const f of dateFields) {
    if (out[f]) out[f] = new Date(out[f]);
  }
  return out;
}

// 旧本番エクスポートに残っていた重複ID（マージ時の取りこぼし）を除去。後勝ちで採用。
function dedupeById(rows, label) {
  const map = new Map();
  for (const r of rows) map.set(r.id, r);
  const deduped = [...map.values()];
  if (deduped.length !== rows.length) {
    console.log(`${label}: deduped ${rows.length} -> ${deduped.length}`);
  }
  return deduped;
}

async function main() {
  const facilityRows = load("facilities").map(f =>
    normalizeDates(f, ["createdAt", "updatedAt"])
  );
  await insertBatched(facilities, facilityRows, "facilities");

  const productRows = dedupeById(
    load("products").map(p => normalizeDates(p, ["createdAt", "updatedAt"])),
    "products"
  );
  await insertBatched(products, productRows, "products");

  const sellerRows = dedupeById(
    load("sellers").map(s => normalizeDates(s, ["lastUpdated", "createdAt", "updatedAt"])),
    "sellers"
  );
  await insertBatched(sellers, sellerRows, "sellers");

  const reviewRows = load("reviews");
  if (reviewRows.length > 0) {
    const normalized = reviewRows.map(r => normalizeDates(r, ["createdAt", "updatedAt"]));
    await insertBatched(reviews, normalized, "reviews");
  }

  const linkRows = dedupeById(
    load("curated_links").map(l => normalizeDates(l, ["createdAt", "updatedAt"])),
    "curated_links"
  );
  await insertBatched(curatedLinks, linkRows, "curated_links");

  console.log("Import complete.");
  process.exit(0);
}

main().catch(err => {
  console.error("IMPORT_FAILED:", err.message);
  if (err.cause) console.error("CAUSE:", err.cause.message ?? err.cause);
  process.exit(1);
});
