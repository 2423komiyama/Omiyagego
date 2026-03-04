/**
 * 7県のお土産データをDBに直接登録するスクリプト
 * Usage: node scripts/import-7prefectures.mjs
 */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: resolve(__dirname, '../.env') });

// Load the products data
const rawData = readFileSync('/home/ubuntu/all_7prefectures.json', 'utf-8');
const products = JSON.parse(rawData);

console.log(`読み込み完了: ${products.length}件`);

// Import database connection
const { drizzle } = await import('drizzle-orm/mysql2');
const mysql2 = await import('mysql2/promise');

const connection = await mysql2.default.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Import schema
const { products: productsTable } = await import('../drizzle/schema.js');

let successCount = 0;
let errorCount = 0;
const errors = [];

// Process in batches of 50
const BATCH_SIZE = 50;
for (let i = 0; i < products.length; i += BATCH_SIZE) {
  const batch = products.slice(i, i + BATCH_SIZE);
  
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
      errors.push(`"${product.name}": ${error.message}`);
    }
  }
  
  console.log(`進捗: ${Math.min(i + BATCH_SIZE, products.length)}/${products.length}件処理済み (成功: ${successCount}, エラー: ${errorCount})`);
}

console.log(`\n完了!`);
console.log(`成功: ${successCount}件`);
console.log(`エラー: ${errorCount}件`);
if (errors.length > 0) {
  console.log('エラー詳細:');
  errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
}

await connection.end();
