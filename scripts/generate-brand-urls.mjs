/**
 * LLMを使ってbrandUrlが未設定の商品のメーカー公式サイトURLを生成し、DBに一括更新するスクリプト
 * 使い方: node scripts/generate-brand-urls.mjs [地方名]
 * 例: node scripts/generate-brand-urls.mjs 近畿
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_API_URL || !FORGE_API_KEY) {
  console.error('BUILT_IN_FORGE_API_URL または BUILT_IN_FORGE_API_KEY が設定されていません');
  process.exit(1);
}

// llm.tsと同じエンドポイント構築ロジック
const LLM_URL = `${FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`;

console.log('LLM URL:', LLM_URL);

async function invokeLLM(messages) {
  const payload = {
    model: 'gemini-2.5-flash',
    messages,
    max_tokens: 8192,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'brand_urls',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  brandUrl: { type: 'string' },
                },
                required: ['id', 'brandUrl'],
                additionalProperties: false,
              },
            },
          },
          required: ['results'],
          additionalProperties: false,
        },
      },
    },
  };

  const response = await fetch(LLM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM API エラー: ${response.status} ${text}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
}

async function generateBrandUrlsForBatch(products) {
  const productList = products.map(p =>
    `- id: ${p.id}, 商品名: ${p.name}, ブランド: ${p.brand}, 都道府県: ${p.prefecture}, カテゴリ: ${p.category}`
  ).join('\n');

  const messages = [
    {
      role: 'system',
      content: `あなたは日本のお土産・食品メーカーの公式サイトURLを調査する専門家です。
与えられた商品リストについて、各メーカー・ブランドの公式サイトURLを返してください。

ルール:
- 実在する公式サイトのURLのみを返す
- 公式サイトが不明な場合は空文字列 "" を返す
- URLは必ず https:// または http:// で始まる
- URLはトップページまたはブランドページ（例: https://www.example.co.jp/）
- 推測でURLを作らない。確実に存在するURLのみ返す
- 同じブランドの商品が複数ある場合は同じURLを返す
- ECサイト（Amazon、楽天等）のURLは不可。必ずメーカー公式サイトのURL`,
    },
    {
      role: 'user',
      content: `以下の商品リストについて、各メーカーの公式サイトURLを調査してください。
不明な場合は空文字列を返してください。

${productList}`,
    },
  ];

  return await invokeLLM(messages);
}

async function main() {
  const targetRegion = process.argv[2] || null;

  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    // brandUrlが未設定の商品を取得
    let query = `SELECT id, name, prefecture, region, category, brand
                 FROM products
                 WHERE brandUrl IS NULL OR brandUrl = ''`;
    const params = [];
    
    if (targetRegion) {
      query += ` AND region = ?`;
      params.push(targetRegion);
    }
    
    query += ` ORDER BY region, prefecture, id`;

    const [rows] = await conn.execute(query, params);
    console.log(`対象商品数: ${rows.length}件${targetRegion ? ` (地方: ${targetRegion})` : ''}`);

    if (rows.length === 0) {
      console.log('処理対象なし');
      return;
    }

    // 30件ずつバッチ処理
    const BATCH_SIZE = 30;
    let totalUpdated = 0;
    let totalSkipped = 0;

    const timestamp = Date.now();
    const logFile = path.join(__dirname, `../brand_url_log_${(targetRegion || 'all').replace(/[・\/]/g, '_')}_${timestamp}.json`);
    const allResults = [];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
      
      console.log(`\nバッチ ${batchNum}/${totalBatches} 処理中... (${batch[0].prefecture} 等 ${batch.length}件)`);

      try {
        const result = await generateBrandUrlsForBatch(batch);
        
        // DBに更新
        let batchUpdated = 0;
        let batchSkipped = 0;
        
        for (const item of result.results) {
          if (item.brandUrl && item.brandUrl.trim() !== '') {
            await conn.execute(
              `UPDATE products SET brandUrl = ? WHERE id = ?`,
              [item.brandUrl.trim(), item.id]
            );
            batchUpdated++;
            allResults.push({ id: item.id, brandUrl: item.brandUrl });
          } else {
            batchSkipped++;
          }
        }
        
        totalUpdated += batchUpdated;
        totalSkipped += batchSkipped;
        console.log(`  → 更新: ${batchUpdated}件, スキップ: ${batchSkipped}件`);
        
        // レート制限対策（1秒待機）
        if (i + BATCH_SIZE < rows.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err) {
        console.error(`  バッチ ${batchNum} エラー:`, err.message);
        // エラーでも続行
      }
    }

    // ログ保存
    fs.writeFileSync(logFile, JSON.stringify(allResults, null, 2));
    
    console.log(`\n=== 完了 ===`);
    console.log(`更新: ${totalUpdated}件`);
    console.log(`スキップ（URL不明）: ${totalSkipped}件`);
    console.log(`ログ: ${logFile}`);

  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('エラー:', err);
  process.exit(1);
});
