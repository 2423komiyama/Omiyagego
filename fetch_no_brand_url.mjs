import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await conn.execute(
  `SELECT id, name, prefecture, region, category, brand
   FROM products
   WHERE brandUrl IS NULL OR brandUrl = ''
   ORDER BY region, prefecture, id`
);

await conn.end();

// 地方別に分類
const byRegion = {};
for (const row of rows) {
  const r = row.region || '不明';
  if (!byRegion[r]) byRegion[r] = [];
  byRegion[r].push(row);
}

console.log('地方別件数:');
for (const [region, products] of Object.entries(byRegion)) {
  console.log(`  ${region}: ${products.length}件`);
}
console.log(`合計: ${rows.length}件`);

fs.writeFileSync('/tmp/no_brand_url_products.json', JSON.stringify(rows, null, 2));
console.log('保存完了: /tmp/no_brand_url_products.json');
