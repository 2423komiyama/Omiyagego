/**
 * 7県のお土産データをDBに直接登録するスクリプト
 * Usage: npx tsx scripts/import-7prefectures.ts
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { products as productsTable } from '../drizzle/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

// Load the products data
const rawData = readFileSync('/home/ubuntu/all_7prefectures.json', 'utf-8');
const allProducts = JSON.parse(rawData);

console.log(`読み込み完了: ${allProducts.length}件`);

const connection = await mysql.createConnection(process.env.DATABASE_URL!);
const db = drizzle(connection);

let successCount = 0;
let errorCount = 0;
const errors: string[] = [];

// Process in batches of 50
const BATCH_SIZE = 50;
for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
  const batch = allProducts.slice(i, i + BATCH_SIZE);
  
  for (const product of batch) {
    try {
      const id = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const guaranteeReasonStr = Array.isArray(product.guaranteeReason)
        ? JSON.stringify(product.guaranteeReason)
        : JSON.stringify([]);
      
      const badgesStr = Array.isArray(product.badges)
        ? JSON.stringify(product.badges)
        : JSON.stringify([]);
      
      await db.insert(productsTable).values({
        id,
        name: product.name || '不明',
        brand: product.brand || product.name || '不明',
        price: product.price || 0,
        prefecture: product.prefecture || '',
        region: product.region || '',
        description: product.description || null,
        shelfLife: product.shelfLife || null,
        imageUrl: product.imageUrl || null,
        category: product.category || 'その他',
        isIndividualPackaged: product.isIndividuallyWrapped ?? false,
        servingSize: null,
        guaranteeReason: guaranteeReasonStr,
        makerStory: null,
        badges: badgesStr,
      });
      
      successCount++;
    } catch (error) {
      errorCount++;
      errors.push(`"${product.name}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  console.log(`進捗: ${Math.min(i + BATCH_SIZE, allProducts.length)}/${allProducts.length}件処理済み (成功: ${successCount}, エラー: ${errorCount})`);
}

console.log(`\n完了!`);
console.log(`成功: ${successCount}件`);
console.log(`エラー: ${errorCount}件`);
if (errors.length > 0) {
  console.log('エラー詳細 (最初の10件):');
  errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
}

await connection.end();
