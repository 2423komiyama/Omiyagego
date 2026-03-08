/**
 * 楽天APIで商品画像を一括取得するバッチスクリプト
 * 商品名+ブランド名で楽天市場を検索し、最も関連性の高い商品の画像URLをDBに保存する
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID;
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY;
const DELAY_MS = 1200; // 楽天APIは1秒1リクエスト制限

async function searchRakuten(keyword) {
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601?applicationId=${RAKUTEN_APP_ID}&accessKey=${RAKUTEN_ACCESS_KEY}&keyword=${encodedKeyword}&hits=3&sort=standard`;
  
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
  
  // 最初の商品の画像URLを取得（mediumImageUrls → smallImageUrls の順で試す）
  const item = data.Items[0].Item;
  const imageUrl = item.mediumImageUrls?.[0]?.imageUrl || item.smallImageUrls?.[0]?.imageUrl;
  
  if (!imageUrl) return null;
  
  // 128x128 → 400x400 に変換（楽天画像URLのサイズパラメータ変更）
  const largeImageUrl = imageUrl.replace('_ex=128x128', '_ex=400x400');
  
  return {
    imageUrl: largeImageUrl,
    itemName: item.itemName,
    shopName: item.shopName,
    itemUrl: item.itemUrl,
  };
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // 画像未取得の商品を取得（realImageUrlがNULLのもの）
  const [products] = await conn.query(
    `SELECT id, name, brand, category, prefecture 
     FROM products 
     WHERE realImageUrl IS NULL 
     ORDER BY likeCount DESC, id ASC`
  );

  console.log(`画像取得対象: ${products.length}件`);

  let found = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    // 検索キーワード: ブランド名 + 商品名（短縮）
    const keyword = product.brand 
      ? `${product.brand} ${product.name.slice(0, 20)}`
      : product.name.slice(0, 30);
    
    try {
      const result = await searchRakuten(keyword);
      
      if (result) {
        await conn.query(
          'UPDATE products SET realImageUrl = ?, imageSource = ? WHERE id = ?',
          [result.imageUrl, `楽天市場: ${result.shopName}`, product.id]
        );
        found++;
        
        if (i % 50 === 0) {
          console.log(`[${new Date().toISOString()}] ${i+1}/${products.length} | 取得: ${found} | 未発見: ${notFound} | エラー: ${errors}`);
          console.log(`  最新: ${product.name} → ${result.imageUrl.slice(0, 60)}...`);
        }
      } else {
        notFound++;
        // ブランド名のみで再検索
        if (product.brand) {
          await new Promise(r => setTimeout(r, DELAY_MS));
          const result2 = await searchRakuten(product.brand + ' お土産');
          if (result2) {
            await conn.query(
              'UPDATE products SET realImageUrl = ?, imageSource = ? WHERE id = ?',
              [result2.imageUrl, `楽天市場(ブランド検索): ${result2.shopName}`, product.id]
            );
            found++;
            notFound--;
          }
        }
      }
    } catch (err) {
      errors++;
      if (i % 100 === 0) {
        console.error(`エラー [${product.id}] ${product.name}: ${err.message}`);
      }
    }
    
    // レート制限対応
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  const [final] = await conn.query(
    'SELECT COUNT(*) as total, SUM(realImageUrl IS NOT NULL) as withImage FROM products'
  );
  console.log(`\n完了: ${JSON.stringify(final[0])}`);
  console.log(`取得成功: ${found}, 未発見: ${notFound}, エラー: ${errors}`);
  
  await conn.end();
}

main().catch(console.error);
