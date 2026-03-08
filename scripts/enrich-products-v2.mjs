/**
 * 商品データ一括補完バッチスクリプト v2
 * 1件ずつLLMに送ってJSONパースエラーを防ぐ
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DELAY_MS = 800;
const LLM_URL = process.env.BUILT_IN_FORGE_API_URL + '/v1/chat/completions';
const LLM_KEY = process.env.BUILT_IN_FORGE_API_KEY;

const ENRICHMENT_SCHEMA = {
  type: 'object',
  properties: {
    reasonsToChoose: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['title', 'body'],
        additionalProperties: false,
      },
    },
    guaranteeDetail: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          title: { type: 'string' },
          year: { type: 'string' },
          detail: { type: 'string' },
        },
        required: ['type', 'title', 'year', 'detail'],
        additionalProperties: false,
      },
    },
    makerName: { type: 'string' },
    makerFoundedYear: { type: 'number' },
    makerAddress: { type: 'string' },
    makerStory: { type: 'string' },
    productSpecs: {
      type: 'object',
      properties: {
        weight: { type: 'string' },
        size: { type: 'string' },
        ingredients: { type: 'string' },
        allergens: { type: 'string' },
        storageMethod: { type: 'string' },
        calories: { type: 'string' },
        servings: { type: 'string' },
        packaging: { type: 'string' },
      },
      required: ['weight', 'size', 'ingredients', 'allergens', 'storageMethod', 'calories', 'servings', 'packaging'],
      additionalProperties: false,
    },
    buzzTopics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          platform: { type: 'string' },
          topic: { type: 'string' },
          detail: { type: 'string' },
        },
        required: ['platform', 'topic', 'detail'],
        additionalProperties: false,
      },
    },
  },
  required: ['reasonsToChoose', 'guaranteeDetail', 'makerName', 'makerFoundedYear', 'makerAddress', 'makerStory', 'productSpecs', 'buzzTopics'],
  additionalProperties: false,
};

async function enrichProduct(product) {
  const body = {
    messages: [
      {
        role: 'system',
        content: `あなたは日本のお土産専門家です。以下の商品について詳細情報を日本語で生成してください。
実際に存在する商品の情報に基づいて、リアルで具体的な内容を生成してください。
- reasonsToChoose: 3つの選ばれる理由（title: 10文字以内、body: 50-80文字）
- guaranteeDetail: 受賞歴・メディア掲載・認証等（2-3件）
- makerName: 正式なメーカー名
- makerFoundedYear: 創業年（推定可）
- makerAddress: 所在地（都市名まで）
- makerStory: メーカーの紹介文（60-100文字）
- productSpecs: 具体的なスペック（重量・サイズ・原材料・アレルゲン・保存方法・カロリー・内容量・個包装）
- buzzTopics: SNS・メディアでの話題（2-3件、platform: Instagram/Twitter/YouTube/テレビ番組/雑誌/記事 のいずれか）`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          name: product.name,
          brand: product.brand,
          category: product.category,
          prefecture: product.prefecture,
          description: product.description || '',
          price: product.price,
          shelfLife: product.shelfLife,
        }),
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'product_enrichment',
        strict: true,
        schema: ENRICHMENT_SCHEMA,
      },
    },
  };

  const res = await fetch(LLM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LLM_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  const [products] = await conn.query(
    'SELECT id, name, brand, category, prefecture, description, price, shelfLife FROM products WHERE makerName IS NULL OR makerName = "" ORDER BY id'
  );
  console.log(`補完対象: ${products.length}件`);

  let processed = 0;
  let errors = 0;

  for (const product of products) {
    try {
      const enriched = await enrichProduct(product);

      await conn.query(
        `UPDATE products SET
          reasonsToChoose = ?,
          guaranteeDetail = ?,
          makerName = ?,
          makerFoundedYear = ?,
          makerAddress = ?,
          makerStory = ?,
          productSpecs = ?,
          buzzTopics = ?
        WHERE id = ?`,
        [
          JSON.stringify(enriched.reasonsToChoose),
          JSON.stringify(enriched.guaranteeDetail),
          enriched.makerName,
          enriched.makerFoundedYear > 0 ? enriched.makerFoundedYear : null,
          enriched.makerAddress,
          enriched.makerStory,
          JSON.stringify(enriched.productSpecs),
          JSON.stringify(enriched.buzzTopics),
          product.id,
        ]
      );

      processed++;
      if (processed % 10 === 0) {
        console.log(`[${new Date().toISOString()}] 進捗: ${processed}/${products.length} (${Math.round(processed / products.length * 100)}%) エラー: ${errors}`);
      }
    } catch (err) {
      errors++;
      console.error(`  商品 ${product.id} (${product.name}) エラー: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  const [[final]] = await conn.query('SELECT COUNT(*) as total FROM products WHERE makerName IS NOT NULL AND makerName != ""');
  console.log(`\n完了! 補完済み: ${final.total}/1611件 エラー: ${errors}件`);
  await conn.end();
}

main().catch(console.error);
