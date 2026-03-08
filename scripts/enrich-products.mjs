/**
 * 商品データ一括補完バッチスクリプト
 * LLMを使って以下を生成:
 * - reasonsToChoose: このお土産が選ばれる理由（3つ）
 * - guaranteeDetail: 保証書詳細（受賞歴・メディア掲載等）
 * - makerName/makerFoundedYear/makerAddress: メーカー情報
 * - productSpecs: 商品スペック（重量・サイズ・原材料・アレルゲン・保存方法・カロリー）
 * - buzzTopics: この商品の話題（SNS・メディア等）
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const BATCH_SIZE = 5;
const DELAY_MS = 1500;

const LLM_URL = process.env.BUILT_IN_FORGE_API_URL + '/v1/chat/completions';
const LLM_KEY = process.env.BUILT_IN_FORGE_API_KEY;

async function invokeLLM(messages, schema) {
  const body = {
    messages,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'product_enrichment',
        strict: true,
        schema,
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
  return JSON.parse(data.choices[0].message.content);
}

const ENRICHMENT_SCHEMA = {
  type: 'object',
  properties: {
    products: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          reasonsToChoose: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: '理由のタイトル（10文字以内）' },
                body: { type: 'string', description: '理由の詳細説明（50-80文字）' },
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
                type: { type: 'string', description: '種別: award/media/certification/popular のいずれか' },
                title: { type: 'string', description: '受賞名・掲載媒体名等' },
                year: { type: 'string', description: '年（例: 2023年）または空文字' },
                detail: { type: 'string', description: '詳細説明（30-50文字）' },
              },
              required: ['type', 'title', 'year', 'detail'],
              additionalProperties: false,
            },
          },
          makerName: { type: 'string', description: 'メーカー・製造元の正式名称' },
          makerFoundedYear: { type: 'number', description: '創業年（西暦）。不明な場合は0' },
          makerAddress: { type: 'string', description: 'メーカー所在地（都道府県+市区町村レベル）' },
          productSpecs: {
            type: 'object',
            properties: {
              weight: { type: 'string', description: '重量（例: 150g、6個入り等）' },
              size: { type: 'string', description: 'サイズ（例: 縦15cm×横10cm×高さ3cm）または空文字' },
              ingredients: { type: 'string', description: '主な原材料（3-5種）' },
              allergens: { type: 'string', description: 'アレルゲン（例: 小麦・卵・乳）または「なし」' },
              storage: { type: 'string', description: '保存方法（例: 直射日光を避け常温保存）' },
              calories: { type: 'string', description: 'カロリー（例: 1個あたり約120kcal）または空文字' },
            },
            required: ['weight', 'size', 'ingredients', 'allergens', 'storage', 'calories'],
            additionalProperties: false,
          },
          buzzTopics: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                source: { type: 'string', description: '情報源（例: Instagram、テレビ東京、食べログ等）' },
                title: { type: 'string', description: '話題のタイトル（30文字以内）' },
                detail: { type: 'string', description: '話題の詳細（40-60文字）' },
              },
              required: ['source', 'title', 'detail'],
              additionalProperties: false,
            },
          },
        },
        required: ['id', 'reasonsToChoose', 'guaranteeDetail', 'makerName', 'makerFoundedYear', 'makerAddress', 'productSpecs', 'buzzTopics'],
        additionalProperties: false,
      },
    },
  },
  required: ['products'],
  additionalProperties: false,
};

async function enrichBatch(conn, products) {
  const productList = products.map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    prefecture: p.prefecture,
    description: p.description || '',
    price: p.price,
    shelfLife: p.shelfLife,
    guaranteeReason: p.guaranteeReason ? JSON.parse(p.guaranteeReason) : [],
    makerStory: p.makerStory || '',
  }));

  const result = await invokeLLM(
    [
      {
        role: 'system',
        content: `あなたは日本のお土産専門家です。以下の商品リストについて、各商品の詳細情報を日本語で生成してください。
実際に存在する商品の情報に基づいて、リアルで具体的な内容を生成してください。
- reasonsToChoose: その商品が選ばれる具体的な理由を3つ（贈り物として選ばれる理由、味・品質の特徴、利便性等）
- guaranteeDetail: 受賞歴・メディア掲載・認証等（実在しそうな内容で2-3件）
- makerName: 正式なメーカー名（brandと同じか、より正式な名称）
- makerFoundedYear: 創業年（老舗なら具体的に、新しいブランドは推定）
- makerAddress: 都道府県の商品なら該当都道府県の主要都市
- productSpecs: 商品の具体的なスペック
- buzzTopics: SNS・メディアでの話題（2-3件）`,
      },
      {
        role: 'user',
        content: JSON.stringify(productList),
      },
    ],
    ENRICHMENT_SCHEMA
  );

  for (const enriched of result.products) {
    await conn.query(
      `UPDATE products SET
        reasonsToChoose = ?,
        guaranteeDetail = ?,
        makerName = ?,
        makerFoundedYear = ?,
        makerAddress = ?,
        productSpecs = ?,
        buzzTopics = ?
      WHERE id = ?`,
      [
        JSON.stringify(enriched.reasonsToChoose),
        JSON.stringify(enriched.guaranteeDetail),
        enriched.makerName,
        enriched.makerFoundedYear > 0 ? enriched.makerFoundedYear : null,
        enriched.makerAddress,
        JSON.stringify(enriched.productSpecs),
        JSON.stringify(enriched.buzzTopics),
        enriched.id,
      ]
    );
  }
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // 未補完の商品を取得（reasonsToChooseがNULLのもの）
  const [products] = await conn.query(
    'SELECT id, name, brand, category, prefecture, description, price, shelfLife, guaranteeReason, makerStory FROM products WHERE reasonsToChoose IS NULL ORDER BY id'
  );

  console.log(`補完対象: ${products.length}件`);

  let processed = 0;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    try {
      await enrichBatch(conn, batch);
      processed += batch.length;
      console.log(`[${new Date().toISOString()}] 進捗: ${processed}/${products.length} (${Math.round(processed/products.length*100)}%)`);
    } catch (err) {
      console.error(`バッチ ${i}-${i+BATCH_SIZE} エラー:`, err.message);
      // エラーが起きたバッチは1件ずつ再試行
      for (const product of batch) {
        try {
          await enrichBatch(conn, [product]);
          processed++;
        } catch (e2) {
          console.error(`  商品 ${product.id} スキップ:`, e2.message);
        }
        await new Promise(r => setTimeout(r, 500));
      }
    }
    if (i + BATCH_SIZE < products.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  const [final] = await conn.query(
    'SELECT COUNT(*) as total, SUM(reasonsToChoose IS NOT NULL) as enriched FROM products'
  );
  console.log(`完了: ${JSON.stringify(final[0])}`);
  await conn.end();
}

main().catch(console.error);
