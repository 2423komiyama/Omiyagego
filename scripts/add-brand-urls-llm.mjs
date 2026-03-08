/**
 * brandUrlが未設定の商品にLLMでURLを生成するバッチスクリプト
 * LLMで各商品のブランド公式サイトURLや楽天ショップURLを生成する
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DELAY_MS = 500; // LLMのレート制限対策
const BATCH_SIZE = 5; // 5件ずつ処理（JSONパースエラー対策）
const LLM_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const LLM_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

async function generateBrandUrls(products) {
  const productList = products.map(p => 
    `- ID: ${p.id} | 商品名: ${p.name} | ブランド: ${p.brand} | 都道府県: ${p.prefecture}`
  ).join('\n');

  const prompt = `以下の日本のお土産商品について、各商品のブランド/メーカーの公式サイトURLまたは楽天市場のショップURLを生成してください。

商品リスト:
${productList}

以下のルールに従ってください:
1. 実在するブランドの場合は公式サイトURL（例: https://www.brand.co.jp）を返す
2. 公式サイトが不明な場合は楽天市場の検索URL（例: https://search.rakuten.co.jp/search/mall/商品名/）を返す
3. 楽天市場の検索URLは必ず日本語のキーワードをURLエンコードして使用する
4. 必ずJSON形式で返す

JSON形式:
{
  "results": [
    {"id": "商品ID", "brandUrl": "URL"},
    ...
  ]
}`;

  const response = await fetch(`${LLM_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that generates URLs for Japanese souvenir brands. Always respond with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const parsed = JSON.parse(content);
  return parsed.results || [];
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [products] = await conn.query(
    'SELECT id, name, brand, prefecture FROM products WHERE brandUrl IS NULL OR brandUrl = "" ORDER BY id'
  );
  console.log(`brandUrl追加対象: ${products.length}件`);
  
  let processed = 0;
  let found = 0;
  let errors = 0;
  
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    
    try {
      const results = await generateBrandUrls(batch);
      
      for (const result of results) {
        if (result.brandUrl && result.brandUrl.startsWith('http')) {
          await conn.execute(
            'UPDATE products SET brandUrl = ? WHERE id = ?',
            [result.brandUrl, result.id]
          );
          found++;
        }
      }
      
      processed += batch.length;
      const progress = Math.round(processed / products.length * 100);
      console.log(`[${new Date().toISOString()}] 進捗: ${processed}/${products.length} (${progress}%) 設定済み: ${found} エラー: ${errors}`);
      
    } catch (err) {
      errors += batch.length;
      console.error(`バッチエラー (${i}-${i + BATCH_SIZE}):`, err.message);
    }
    
    if (i + BATCH_SIZE < products.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
  
  console.log(`\n完了! 設定済み: ${found}/${products.length}件 エラー: ${errors}件`);
  await conn.end();
}

main().catch(console.error);
