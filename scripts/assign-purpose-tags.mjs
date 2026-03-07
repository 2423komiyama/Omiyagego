/**
 * purposeTagsをLLMで一括付与するバッチスクリプト
 * 商品名・カテゴリ・説明から適切な用途タグを推定してDBに保存
 *
 * 用途タグ一覧:
 * - greeting: 挨拶・手土産
 * - thanks: 御礼・感謝
 * - apology: お詫び・謝罪
 * - office: 社内配布・職場
 * - snack: 差し入れ・気軽なギフト
 * - self: 自分用・ご褒美
 * - family: 家族・親族
 * - kids: 子供向け
 */

import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_API_URL || !FORGE_API_KEY) {
  console.error('BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY is not set');
  process.exit(1);
}

async function invokeLLM(messages) {
  const res = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({
      messages,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'purpose_tags',
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
                    tags: {
                      type: 'array',
                      items: { type: 'string', enum: ['greeting', 'thanks', 'apology', 'office', 'snack', 'self', 'family', 'kids'] }
                    }
                  },
                  required: ['id', 'tags'],
                  additionalProperties: false,
                }
              }
            },
            required: ['results'],
            additionalProperties: false,
          }
        }
      }
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API error: ${res.status} ${text}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

const BATCH_SIZE = 30;

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // purposeTagsが未設定の商品を取得
  const [products] = await conn.execute(
    'SELECT id, name, category, description, badges FROM products WHERE purposeTags IS NULL OR purposeTags = "[]" OR purposeTags = "" ORDER BY id LIMIT 1549'
  );
  
  console.log(`処理対象: ${products.length}件`);
  
  let processed = 0;
  let updated = 0;
  
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    
    const productList = batch.map(p => {
      const badges = (() => { try { return JSON.parse(p.badges || '[]'); } catch { return []; } })();
      return `ID:${p.id} 商品名:${p.name} カテゴリ:${p.category} バッジ:${badges.join(',')}`;
    }).join('\n');
    
    const prompt = `以下のお土産商品それぞれに、最も適切な用途タグを1〜3個付けてください。

用途タグの定義:
- greeting: 挨拶・手土産（初対面・訪問・ビジネス）
- thanks: 御礼・感謝（お世話になった方へ）
- apology: お詫び・謝罪（誠意を示す場面）
- office: 社内配布・職場（個包装・大容量・職場配布）
- snack: 差し入れ・気軽なギフト（友人・カジュアル）
- self: 自分用・ご褒美（旅行記念・限定品）
- family: 家族・親族（帰省・家族向け）
- kids: 子供向け（子供が喜ぶ・キャラクター）

判断基準:
- 高級感のある和菓子・洋菓子 → greeting, thanks
- 個包装・大容量 → office, greeting
- キャラクター・カラフル → kids, family
- 地域限定・珍しいもの → self, family
- 安価・気軽 → snack, self
- 全年齢向け定番品 → greeting, office, family

商品リスト:
${productList}

各商品のIDとタグの配列をJSONで返してください。`;
    
    try {
      const result = await invokeLLM([
        { role: 'system', content: 'あなたはお土産の用途分類の専門家です。与えられた商品情報から最適な用途タグを付けてください。' },
        { role: 'user', content: prompt },
      ]);
      
      for (const item of result.results) {
        if (item.tags && item.tags.length > 0) {
          await conn.execute(
            'UPDATE products SET purposeTags = ? WHERE id = ?',
            [JSON.stringify(item.tags), item.id]
          );
          updated++;
        }
      }
      
      processed += batch.length;
      console.log(`進捗: ${processed}/${products.length} (更新: ${updated}件)`);
      
      // レート制限対策
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`バッチ ${i}〜${i + BATCH_SIZE} エラー:`, err.message);
      // エラーでも続行
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.log(`\n完了! 処理: ${processed}件, 更新: ${updated}件`);
  
  // 結果確認
  const [stats] = await conn.execute(
    'SELECT COUNT(*) as total, SUM(CASE WHEN purposeTags IS NOT NULL AND purposeTags != "[]" AND purposeTags != "" THEN 1 ELSE 0 END) as withTags FROM products'
  );
  console.log('DB統計:', JSON.stringify(stats[0]));
  
  await conn.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
