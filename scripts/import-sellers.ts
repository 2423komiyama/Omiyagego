import "dotenv/config";
import { getDb } from "../server/db";
import { sellers } from "../drizzle/schema";
import { readFileSync } from "fs";

// 生成された売り場データファイルのパス
const SELLER_FILES = [
  "/home/ubuntu/sellers_json_file(1)/0_F8m8YHEoXcsEEzatPEKA18_1772587482637_na1fn_L2hvbWUvdWJ1bnR1L3NlbGxlcnM.json",
  "/home/ubuntu/sellers_json_file(1)/1_SZsffvzBCYENTPOd1OErpg_1772587522038_na1fn_L2hvbWUvdWJ1bnR1L3NlbGxlcnNf6Zai5p2x.json",
  "/home/ubuntu/sellers_json_file(1)/2_Q7bPD7Szo6VGVJfXzFbQDF_1772587481269_na1fn_L2hvbWUvdWJ1bnR1L3NlbGxlcnM.json",
  "/home/ubuntu/sellers_json_file(1)/3_at2ISu42am4BcTqeubI2pD_1772587474710_na1fn_L2hvbWUvdWJ1bnR1L3NlbGxlcnNf6Zai6KW_.json",
  "/home/ubuntu/sellers_json_file(1)/4_prnYWpxQDz9WoYlUAj7g8H_1772587461750_na1fn_L2hvbWUvdWJ1bnR1L3NlbGxlcnNf5Lit5Zu9X-Wbm-WbvQ.json",
  "/home/ubuntu/sellers_json_file(1)/5_OGUMYL5Nf6PJ2Td2ixjIPk_1772587539074_na1fn_L2hvbWUvdWJ1bnR1L3NlbGxlcnM.json",
  "/home/ubuntu/sellers_json_file(1)/6_C7zJ8bbgCSn4qmsLdZJMDh_1772587583385_na1fn_L2hvbWUvdWJ1bnR1L29raW5hd2Ffc2VsbGVycw.json",
];

interface SellerData {
  productId: string;
  facilityId: string;
  facilityName: string;
  shopName?: string;
  floorInfo?: string | null;
  isAvailable?: boolean;
  priceNote?: string | null;
}

// 短いユニークIDを生成（32文字以内）
let idCounter = 0;
function genId(): string {
  const ts = Date.now().toString(36); // 8-9文字
  const cnt = (idCounter++).toString(36).padStart(4, '0'); // 4文字
  const rnd = Math.random().toString(36).slice(2, 8); // 6文字
  return `s${ts}${cnt}${rnd}`.slice(0, 32);
}

function parseSellerData(raw: string): SellerData[] {
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        console.error("Failed to parse JSON:", e2);
        return [];
      }
    }
    return [];
  }
}

async function importSellers() {
  const db = await getDb();
  if (!db) throw new Error("DB connection failed");

  // 既存データを削除（重複を避けるため）
  console.log("Clearing existing sellers...");
  await db.delete(sellers);
  console.log("Cleared.");

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const filePath of SELLER_FILES) {
    const fileName = filePath.split("/").pop()?.slice(0, 40) + "...";
    console.log(`\nProcessing: ${fileName}`);
    
    let rawData: string;
    try {
      rawData = readFileSync(filePath, "utf-8");
    } catch {
      console.error(`  File not found: ${filePath}`);
      continue;
    }

    const sellerData = parseSellerData(rawData);
    console.log(`  Parsed ${sellerData.length} sellers`);

    if (sellerData.length === 0) {
      console.warn(`  No valid data found`);
      continue;
    }

    // 1件ずつ挿入（エラーを個別にハンドリング）
    let fileInserted = 0;
    let fileSkipped = 0;
    
    // バッチ挿入（10件ずつ）
    const BATCH_SIZE = 10;
    for (let i = 0; i < sellerData.length; i += BATCH_SIZE) {
      const batch = sellerData.slice(i, i + BATCH_SIZE);
      
      const insertData = batch
        .filter(s => s.productId && s.facilityId && s.facilityName)
        .map(s => ({
          id: genId(),
          productId: s.productId.slice(0, 32),
          facilityId: s.facilityId.slice(0, 32),
          storeName: (s.shopName || s.facilityName).slice(0, 128),
          floor: s.floorInfo ? s.floorInfo.slice(0, 32) : null,
          location: s.facilityName.slice(0, 256),
          insideGate: s.floorInfo?.includes("改札内") ?? false,
          stockStatus: "in_stock" as const,
          businessHours: null,
          congestionLevel: "medium" as const,
        }));

      if (insertData.length === 0) {
        fileSkipped += batch.length;
        continue;
      }

      try {
        await db.insert(sellers).values(insertData);
        fileInserted += insertData.length;
        fileSkipped += batch.length - insertData.length;
      } catch (e) {
        const msg = (e as Error).message?.slice(0, 300);
        console.error(`  Batch error at offset ${i}: ${msg}`);
        fileSkipped += batch.length;
        // 1件ずつ試みる
        for (const item of insertData) {
          try {
            await db.insert(sellers).values([item]);
            fileInserted++;
            fileSkipped--;
          } catch {
            // skip
          }
        }
      }
    }

    totalInserted += fileInserted;
    totalSkipped += fileSkipped;
    console.log(`  Inserted: ${fileInserted}, Skipped: ${fileSkipped}`);
  }

  console.log(`\n=== Import Complete ===`);
  console.log(`Total inserted: ${totalInserted}`);
  console.log(`Total skipped: ${totalSkipped}`);
}

importSellers().catch(console.error);
