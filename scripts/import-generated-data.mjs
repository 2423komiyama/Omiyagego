/**
 * 並列生成されたお土産データをPostgreSQLに一括登録するスクリプト
 * 使用方法: node scripts/import-generated-data.mjs
 */

import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

// MySQL接続設定をURLからパース
function parseDatabaseUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || 3306,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.slice(1),
    ssl: { rejectUnauthorized: false }
  };
}

// JSONデータをクリーニング（コメント・末尾カンマを除去）
function cleanJson(str) {
  // コードブロックを除去
  str = str.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  // 行コメントを除去
  str = str.replace(/\/\/[^\n]*/g, '');
  // ブロックコメントを除去
  str = str.replace(/\/\*[\s\S]*?\*\//g, '');
  // 末尾カンマを除去（オブジェクト・配列の閉じ括弧の前）
  str = str.replace(/,(\s*[}\]])/g, '$1');
  // 前後の空白を除去
  str = str.trim();
  return str;
}

async function main() {
  console.log('データベースに接続中...');
  const config = parseDatabaseUrl(DATABASE_URL);
  const connection = await mysql.createConnection(config);
  
  console.log('接続成功！');

  // 生成データを読み込む
  const rawData = readFileSync('/home/ubuntu/generate_omiyage_data.json', 'utf-8');
  const data = JSON.parse(rawData);
  const results = data.results;

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const result of results) {
    if (result.error || !result.output?.success) {
      console.log(`⏭️  スキップ: ${result.input.split('（')[0]} (生成失敗)`);
      totalSkipped++;
      continue;
    }

    const prefecture = result.output.prefecture;
    const jsonData = result.output.json_data;

    let parsedData;
    try {
      const cleaned = cleanJson(jsonData);
      parsedData = JSON.parse(cleaned);
    } catch (e) {
      console.error(`❌ JSONパースエラー (${prefecture}): ${e.message}`);
      totalErrors++;
      continue;
    }

    const products = parsedData.products || [];
    if (products.length === 0) {
      console.log(`⚠️  商品なし: ${prefecture}`);
      continue;
    }

    let insertedCount = 0;
    for (const product of products) {
      try {
        // 既存チェック
        const [existing] = await connection.execute(
          'SELECT id FROM products WHERE id = ?',
          [product.id]
        );
        
        if (existing.length > 0) {
          // 既存の場合はスキップ
          continue;
        }

        // 新規挿入
        await connection.execute(
          `INSERT INTO products (
            id, name, brand, description, price, imageUrl,
            prefecture, region, category, shelfLife,
            isIndividualPackaged, servingSize,
            guaranteeReason, makerStory, badges,
            createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            product.id,
            product.name,
            product.brand || '',
            product.description || '',
            product.price || 0,
            product.imageUrl || null,
            product.prefecture || prefecture,
            product.region || '',
            product.category || 'その他',
            product.shelfLife || 30,
            product.isIndividualPackaged ? 1 : 0,
            product.servingSize || 1,
            JSON.stringify(product.guaranteeReason || []),
            product.makerStory || '',
            JSON.stringify(product.badges || [])
          ]
        );
        insertedCount++;
        totalInserted++;
      } catch (err) {
        console.error(`  ❌ 挿入エラー (${product.id}): ${err.message}`);
        totalErrors++;
      }
    }

    console.log(`✅ ${prefecture}: ${insertedCount}件登録`);
  }

  await connection.end();

  console.log('\n=== 登録完了 ===');
  console.log(`✅ 登録成功: ${totalInserted}件`);
  console.log(`⏭️  スキップ: ${totalSkipped}件`);
  console.log(`❌ エラー: ${totalErrors}件`);
}

main().catch(err => {
  console.error('致命的エラー:', err);
  process.exit(1);
});
