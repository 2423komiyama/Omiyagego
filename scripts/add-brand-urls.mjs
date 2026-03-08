/**
 * brandUrlが未設定の商品に楽天検索URLを追加するバッチスクリプト
 * 楽天APIで商品を検索して、最初の商品の商品URLをbrandUrlとして設定する
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DELAY_MS = 2500; // 楽天APIレート制限対策（429エラー防止）
const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID;
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY;

async function searchRakuten(keyword) {
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601?applicationId=${RAKUTEN_APP_ID}&accessKey=${RAKUTEN_ACCESS_KEY}&keyword=${encodedKeyword}&hits=1&sort=standard`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  
  if (data.errors) {
    throw new Error(data.errors.errorMessage || 'API error');
  }
  
  if (!data.Items || data.Items.length === 0) {
    return null;
  }
  
  const item = data.Items[0].Item;
  return {
    itemUrl: item.itemUrl,
    shopUrl: item.shopUrl,
    itemName: item.itemName,
  };
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [products] = await conn.query(
    'SELECT id, name, brand, prefecture FROM products WHERE brandUrl IS NULL OR brandUrl = "" ORDER BY id'
  );
  console.log(`brandUrl追加対象: ${products.length}件`);
  
  let processed = 0;
  let found = 0;
  let notFound = 0;
  
  for (const product of products) {
    try {
      // 商品名+ブランド名で検索
      const keyword = `${product.name} ${product.brand}`.trim();
      const result = await searchRakuten(keyword);
      
      if (result) {
        await conn.query(
          'UPDATE products SET brandUrl = ? WHERE id = ?',
          [result.itemUrl, product.id]
        );
        found++;
      } else {
        // 商品名のみで再検索
        const result2 = await searchRakuten(product.name);
        if (result2) {
          await conn.query(
            'UPDATE products SET brandUrl = ? WHERE id = ?',
            [result2.itemUrl, product.id]
          );
          found++;
        } else {
          notFound++;
        }
      }
      
      processed++;
      if (processed % 50 === 0) {
        console.log(`[${new Date().toISOString()}] 進捗: ${processed}/${products.length} (${Math.round(processed / products.length * 100)}%) 発見: ${found} 未発見: ${notFound}`);
      }
    } catch (err) {
      console.error(`  商品 ${product.id} (${product.name}) エラー: ${err.message}`);
      notFound++;
    }
    
    await new Promise(r => setTimeout(r, DELAY_MS));
  }
  
  console.log(`\n完了! 発見: ${found}件 未発見: ${notFound}件`);
  await conn.end();
}

main().catch(console.error);
