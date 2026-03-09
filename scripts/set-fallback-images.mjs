/**
 * 楽天で画像が取得できなかった商品にカテゴリ別高品質フォールバック画像を設定するバッチ
 * Unsplash の安定した画像URLを使用（商用利用可）
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// カテゴリ別の高品質Unsplash画像URL（複数用意してランダム選択）
const CATEGORY_IMAGES = {
  '和菓子': [
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop',
  ],
  '洋菓子': [
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=400&h=400&fit=crop',
  ],
  '焼き菓子': [
    'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&h=400&fit=crop',
  ],
  '菓子': [
    'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=400&fit=crop',
  ],
  '煎餅・おかき': [
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop',
  ],
  '飴・キャンディ': [
    'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&h=400&fit=crop',
  ],
  'スイーツ': [
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=400&h=400&fit=crop',
  ],
  '海産物': [
    'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=400&fit=crop',
  ],
  '肉製品': [
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop',
  ],
  '肉類': [
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop',
  ],
  '農産物・果物': [
    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop',
  ],
  '果物': [
    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop',
  ],
  '麺類': [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400&h=400&fit=crop',
  ],
  '弁当・惣菜': [
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop',
  ],
  '惣菜': [
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop',
  ],
  '調味料・ソース': [
    'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=400&fit=crop',
  ],
  '調味料': [
    'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400&h=400&fit=crop',
  ],
  '飲料・お茶': [
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=400&h=400&fit=crop',
  ],
  '飲料': [
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=400&h=400&fit=crop',
  ],
  '酒類': [
    'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop',
  ],
  '地酒・ビール': [
    'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop',
  ],
  '工芸品・雑貨': [
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
  ],
  '工芸品': [
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=400&fit=crop',
  ],
  '伝統工芸': [
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=400&fit=crop',
  ],
  '雑貨': [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=400&fit=crop',
  ],
  '食品': [
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop',
  ],
  '温泉関連': [
    'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
  ],
  '文具': [
    'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&h=400&fit=crop',
  ],
  'スナック': [
    'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop',
  ],
  '珍味': [
    'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&h=400&fit=crop',
  ],
  '卵': [
    'https://images.unsplash.com/photo-1582169505937-b9992bd01ed9?w=400&h=400&fit=crop',
  ],
  'その他': [
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop',
  ],
};

// デフォルトフォールバック
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop',
];

function getImageForCategory(category, productId) {
  const images = CATEGORY_IMAGES[category] || DEFAULT_IMAGES;
  // 商品IDのハッシュでランダムだが一貫した画像を選択
  const hash = productId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return images[hash % images.length];
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // realImageUrlが空の商品を取得
  const [products] = await conn.query(
    `SELECT id, name, category FROM products 
     WHERE realImageUrl IS NULL OR realImageUrl = ''
     ORDER BY likeCount DESC, id ASC`
  );

  console.log(`フォールバック画像設定対象: ${products.length}件`);

  let updated = 0;
  for (const product of products) {
    const imageUrl = getImageForCategory(product.category, product.id);
    await conn.query(
      'UPDATE products SET realImageUrl = ?, imageSource = ? WHERE id = ?',
      [imageUrl, 'unsplash_fallback', product.id]
    );
    updated++;
    if (updated % 50 === 0) {
      console.log(`進捗: ${updated}/${products.length}件`);
    }
  }

  console.log(`完了! ${updated}件にフォールバック画像を設定しました`);
  await conn.end();
}

main().catch(console.error);
