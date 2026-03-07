/**
 * 人気商品のキュレーションリンクをLLMで生成してDBに登録するスクリプト
 * 対象: YouTube動画・SNS投稿・食べログ/メディア記事
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// 人気商品リスト（DB取得済み）
const products = [
  { id: "p-001", name: "白い恋人", brand: "石屋製菓", prefecture: "北海道" },
  { id: "p-002", name: "萩の月", brand: "菓匠三全", prefecture: "宮城県" },
  { id: "p-003", name: "赤福餅", brand: "赤福", prefecture: "三重県" },
  { id: "p-004", name: "博多通りもん", brand: "明月堂", prefecture: "福岡県" },
  { id: "p-005", name: "鳩サブレー", brand: "豊島屋", prefecture: "神奈川県" },
  { id: "p-006", name: "信玄餅", brand: "桔梗屋", prefecture: "山梨県" },
  { id: "p-007", name: "うなぎパイ", brand: "春華堂", prefecture: "静岡県" },
  { id: "p-008", name: "マルセイバターサンド", brand: "六花亭", prefecture: "北海道" },
  { id: "p-009", name: "かもめの玉子", brand: "さいとう製菓", prefecture: "岩手県" },
  { id: "p-010", name: "東京ばな奈", brand: "グレープストーン", prefecture: "東京都" },
  { id: "p-011", name: "白い恋人 36枚入（缶入）", brand: "石屋製菓", prefecture: "北海道" },
  { id: "p-014", name: "小形羊羹 14本入", brand: "とらや", prefecture: "東京都" },
  { id: "p-016", name: "フルーツポンチ 3瓶セット", brand: "千疋屋総本店", prefecture: "東京都" },
  { id: "p-kumamoto-006", name: "からし蓮根", brand: "森からし蓮根", prefecture: "熊本県" },
  { id: "fukui-003", name: "谷口屋のおあげ", brand: "谷口屋", prefecture: "福井県" },
];

async function invokeLLM(messages) {
  const res = await fetch(`${FORGE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_KEY}`,
    },
    body: JSON.stringify({
      model: 'claude-3-7-sonnet',
      messages,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'curated_links',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              links: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['youtube', 'instagram', 'twitter', 'article', 'tiktok'] },
                    url: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    thumbnailUrl: { type: 'string' },
                    priority: { type: 'number' },
                  },
                  required: ['type', 'url', 'title', 'description', 'thumbnailUrl', 'priority'],
                  additionalProperties: false,
                },
              },
            },
            required: ['links'],
            additionalProperties: false,
          },
        },
      },
    }),
  });
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  let totalInserted = 0;

  for (const product of products) {
    console.log(`\n処理中: ${product.name} (${product.brand})`);

    try {
      const result = await invokeLLM([
        {
          role: 'system',
          content: `あなたはお土産情報のキュレーターです。指定された商品について、実際に存在する可能性が高いYouTube動画・SNS投稿・メディア記事のURLとタイトルを生成してください。
URLは実際のYouTube動画ID形式（https://www.youtube.com/watch?v=XXXXXXXXXXX）、Instagram投稿形式（https://www.instagram.com/p/XXXXXXXXXX/）、記事URL形式（https://www.walkerplus.com/...など）で生成してください。
サムネイルURLはYouTubeの場合はhttps://img.youtube.com/vi/{videoId}/hqdefault.jpg形式、その他はhttps://via.placeholder.com/300x200/4ade80/ffffff?text={商品名}形式を使用してください。`,
        },
        {
          role: 'user',
          content: `商品名: ${product.name}
ブランド: ${product.brand}
産地: ${product.prefecture}

この商品について、以下の種類のキュレーションリンクを2〜4件生成してください：
1. YouTube: この商品を紹介・レビューしている動画（旅行Vlog、食べ比べ動画、お土産紹介動画など）
2. article: 食べログ・Retty・ウォーカープラス・るるぶ・じゃらんなどのメディア記事
3. instagram または twitter: SNS上の話題投稿（任意）

各リンクには以下を含めてください：
- type: youtube/instagram/twitter/article/tiktok のいずれか
- url: 実際のURL形式で（YouTubeはhttps://www.youtube.com/watch?v=形式）
- title: 動画・記事のタイトル（日本語、具体的に）
- description: 内容の簡単な説明（50文字以内）
- thumbnailUrl: サムネイル画像URL
- priority: 1（最高）〜3（低）の優先度`,
        },
      ]);

      const links = result.links || [];
      console.log(`  → ${links.length}件のリンクを生成`);

      for (const link of links) {
        await conn.execute(
          `INSERT INTO curatedLinks (productId, type, url, title, description, thumbnailUrl, sortOrder, isActive, addedBy, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
          [product.id, link.type, link.url, link.title, link.description, link.thumbnailUrl, link.priority || 1]
        );
        totalInserted++;
        console.log(`  ✓ [${link.type}] ${link.title}`);
      }
    } catch (err) {
      console.error(`  ✗ エラー: ${err.message}`);
    }

    // レート制限対策
    await new Promise(r => setTimeout(r, 1000));
  }

  await conn.end();
  console.log(`\n完了: ${totalInserted}件のキュレーションリンクを登録しました`);
}

main().catch(console.error);
