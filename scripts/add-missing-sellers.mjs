/**
 * 売り場なし商品に売り場データを追加するバッチスクリプト
 * LLMを使って各商品の売り場情報を生成してDBに登録する
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DELAY_MS = 800;
const LLM_URL = process.env.BUILT_IN_FORGE_API_URL + '/v1/chat/completions';
const LLM_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// 都道府県→主要施設のマッピング
const PREFECTURE_FACILITY_MAP = {
  '北海道': ['shin_chitose_airport'],
  '東京都': ['tokyo_station', 'shinjuku_station', 'shibuya_station', 'haneda_t1', 'haneda_t2', 'haneda_t3'],
  '神奈川県': ['shibuya_station'],
  '千葉県': ['tokyo_station'],
  '群馬県': ['tokyo_station'],
  '京都府': ['kyoto_station'],
  '大阪府': ['osaka_station'],
  '福岡県': ['fukuoka_airport'],
  '愛知県': ['nagoya_station'],
  '沖縄県': ['naha_airport'],
  '石川県': ['kanazawa_station'],
  '宮城県': ['sendai_station'],
  '長崎県': ['fukuoka_airport'],
  '鹿児島県': ['fukuoka_airport'],
  '栃木県': ['tokyo_station'],
  '長野県': ['tokyo_station'],
  '広島県': ['hiroshima_station'],
  '奈良県': ['kyoto_station'],
  '熊本県': ['fukuoka_airport'],
  '埼玉県': ['tokyo_station'],
  '静岡県': ['tokyo_station'],
};

const SELLER_SCHEMA = {
  type: 'object',
  properties: {
    storeName: { type: 'string' },
    floor: { type: 'string' },
    location: { type: 'string' },
    insideGate: { type: 'boolean' },
    businessHours: { type: 'string' },
    facilityId: { type: 'string' },
  },
  required: ['storeName', 'floor', 'location', 'insideGate', 'businessHours', 'facilityId'],
  additionalProperties: false,
};

async function generateSeller(product, facilityIds) {
  const body = {
    messages: [
      {
        role: 'system',
        content: `あなたは日本のお土産売り場情報の専門家です。
以下の商品が販売されている売り場情報を1件生成してください。
facilityIdは以下から最も適切なものを選んでください:
${facilityIds.join(', ')}

施設IDの意味:
- tokyo_station: 東京駅（グランスタ・エキュート等）
- shinjuku_station: 新宿駅（NEWoMan・京王百貨店等）
- shibuya_station: 渋谷駅（渋谷ヒカリエ等）
- haneda_t1/t2/t3: 羽田空港 第1/2/3ターミナル
- shin_chitose_airport: 新千歳空港
- kyoto_station: 京都駅（伊勢丹・ポルタ等）
- osaka_station: 大阪駅（ルクア等）
- fukuoka_airport: 福岡空港
- nagoya_station: 名古屋駅（タカシマヤ・JR名古屋高島屋等）
- naha_airport: 那覇空港
- kanazawa_station: 金沢駅（もてなしドーム等）
- sendai_station: 仙台駅（S-PAL等）
- hiroshima_station: 広島駅（ekie等）

storeName: 実際にありそうな店舗名（例: グランスタ東京、エキュート東京、空港内土産店等）
floor: フロア（例: B1F、1F、2F）
location: 場所の説明（例: 東京駅構内、改札内）
insideGate: 改札内かどうか
businessHours: 営業時間（例: 8:00-22:00）`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          name: product.name,
          brand: product.brand,
          category: product.category,
          prefecture: product.prefecture,
        }),
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'seller_info',
        strict: true,
        schema: SELLER_SCHEMA,
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

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  const [products] = await conn.query(`
    SELECT p.id, p.name, p.brand, p.category, p.prefecture
    FROM products p 
    WHERE NOT EXISTS (SELECT 1 FROM sellers s WHERE s.productId = p.id)
    ORDER BY p.prefecture, p.id
  `);
  console.log(`売り場追加対象: ${products.length}件`);

  let processed = 0;
  let errors = 0;

  for (const product of products) {
    const facilityIds = PREFECTURE_FACILITY_MAP[product.prefecture] || ['tokyo_station'];

    try {
      const seller = await generateSeller(product, facilityIds);

      await conn.query(
        `INSERT INTO sellers (id, productId, facilityId, storeName, floor, location, insideGate, businessHours, stockStatus, lastUpdated)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_stock', NOW())`,
        [
          generateId(),
          product.id,
          seller.facilityId,
          seller.storeName,
          seller.floor,
          seller.location,
          seller.insideGate ? 1 : 0,
          seller.businessHours,
        ]
      );

      processed++;
      if (processed % 20 === 0) {
        console.log(`[${new Date().toISOString()}] 進捗: ${processed}/${products.length} (${Math.round(processed / products.length * 100)}%) エラー: ${errors}`);
      }
    } catch (err) {
      errors++;
      console.error(`  商品 ${product.id} (${product.name}) エラー: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  const [[final]] = await conn.query('SELECT COUNT(DISTINCT productId) as cnt FROM sellers');
  console.log(`\n完了! 売り場あり商品: ${final.cnt}/1611件 エラー: ${errors}件`);
  await conn.end();
}

main().catch(console.error);
