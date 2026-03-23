/**
 * sellersのmapUrlとwalkMinutesを施設情報から補完
 * - mapUrl: 施設のGoogleマップURL + 店舗名で検索
 * - walkMinutes: フロア情報から推定（B1F=2分、1F=1分、2F=3分、3F=4分等）
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// facilityId → 施設のGoogleマップ検索URL
const FACILITY_MAP_URLS = {
  tokyo_station: 'https://maps.google.com/?q=東京駅+グランスタ',
  haneda_t1: 'https://maps.google.com/?q=羽田空港第1ターミナル',
  haneda_t2: 'https://maps.google.com/?q=羽田空港第2ターミナル',
  haneda_t3: 'https://maps.google.com/?q=羽田空港第3ターミナル',
  shibuya_station: 'https://maps.google.com/?q=渋谷駅',
  shinjuku_station: 'https://maps.google.com/?q=新宿駅',
  shin_chitose_airport: 'https://maps.google.com/?q=新千歳空港',
  sendai_station: 'https://maps.google.com/?q=仙台駅+エスパル',
  aomori_station: 'https://maps.google.com/?q=青森駅+A-FACTORY',
  morioka_station: 'https://maps.google.com/?q=盛岡駅+フェザン',
  akita_station: 'https://maps.google.com/?q=秋田駅+トピコ',
  yamagata_station: 'https://maps.google.com/?q=山形駅+エスパル',
  fukushima_station: 'https://maps.google.com/?q=福島駅+S-PAL',
  narita_airport: 'https://maps.google.com/?q=成田国際空港',
  nagoya_station: 'https://maps.google.com/?q=名古屋駅+エスカ',
  shizuoka_station: 'https://maps.google.com/?q=静岡駅+パルシェ',
  kofu_station: 'https://maps.google.com/?q=甲府駅+セレオ',
  nagano_station: 'https://maps.google.com/?q=長野駅+MIDORI',
  niigata_station: 'https://maps.google.com/?q=新潟駅+CoCoLo',
  kanazawa_station: 'https://maps.google.com/?q=金沢駅+あんと',
  kyoto_station: 'https://maps.google.com/?q=京都駅+ポルタ',
  shin_osaka_station: 'https://maps.google.com/?q=新大阪駅+アルデ',
  osaka_station: 'https://maps.google.com/?q=大阪駅+ルクア',
  kansai_airport: 'https://maps.google.com/?q=関西国際空港',
  hiroshima_station: 'https://maps.google.com/?q=広島駅+ekie',
  okayama_station: 'https://maps.google.com/?q=岡山駅+さんすて',
  hakata_station: 'https://maps.google.com/?q=博多駅+マイング',
  fukuoka_airport: 'https://maps.google.com/?q=福岡空港',
  kumamoto_station: 'https://maps.google.com/?q=熊本駅+アミュプラザ',
  kagoshima_station: 'https://maps.google.com/?q=鹿児島中央駅+アミュプラザ',
  miyazaki_station: 'https://maps.google.com/?q=宮崎駅+アミュプラザ',
  nagasaki_station: 'https://maps.google.com/?q=長崎駅+アミュプラザ',
  saga_station: 'https://maps.google.com/?q=佐賀駅',
  naha_airport: 'https://maps.google.com/?q=那覇空港',
  kokusaidori: 'https://maps.google.com/?q=国際通り+那覇市',
  online: null,
  local_station: 'https://maps.google.com/?q=駅+お土産',
  local_airport: 'https://maps.google.com/?q=空港+お土産',
};

// フロア文字列から徒歩分数を推定
function estimateWalkMinutes(floor, facilityId) {
  if (!floor) return 3;
  const f = floor.toUpperCase();
  // 空港・大型施設は少し遠め
  const isAirport = facilityId && facilityId.includes('airport');
  const base = isAirport ? 5 : 2;
  
  if (f.includes('B2') || f.includes('B3')) return base + 3;
  if (f.includes('B1')) return base + 1;
  if (f === '1F' || f.includes('1F')) return base;
  if (f.includes('2F')) return base + 1;
  if (f.includes('3F')) return base + 2;
  if (f.includes('4F') || f.includes('5F')) return base + 3;
  return base + 1;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // mapUrlが未設定のsellersを全件取得
  const [sellers] = await conn.query(
    'SELECT id, facilityId, storeName, floor FROM sellers WHERE mapUrl IS NULL'
  );
  console.log(`mapUrl未設定: ${sellers.length}件`);

  let updated = 0;
  const BATCH = 500;

  for (let i = 0; i < sellers.length; i += BATCH) {
    const batch = sellers.slice(i, i + BATCH);
    
    for (const seller of batch) {
      const baseMapUrl = FACILITY_MAP_URLS[seller.facilityId];
      let mapUrl = null;
      
      if (baseMapUrl && seller.storeName && seller.storeName !== 'オンラインストア') {
        // 店舗名をURLエンコードして検索URL生成
        const encoded = encodeURIComponent(seller.storeName);
        mapUrl = `https://maps.google.com/?q=${encoded}`;
      } else if (baseMapUrl) {
        mapUrl = baseMapUrl;
      }
      
      const walkMinutes = estimateWalkMinutes(seller.floor, seller.facilityId);
      
      await conn.query(
        'UPDATE sellers SET mapUrl = ?, walkMinutes = ? WHERE id = ?',
        [mapUrl, walkMinutes, seller.id]
      );
      updated++;
    }
    
    console.log(`進捗: ${Math.min(i + BATCH, sellers.length)}/${sellers.length}`);
  }

  console.log(`\n完了: ${updated}件更新`);
  
  // 確認
  const [nullCheck] = await conn.query('SELECT COUNT(*) as cnt FROM sellers WHERE mapUrl IS NULL AND facilityId != "online"');
  console.log('mapUrl未設定（online除く）:', nullCheck[0].cnt, '件');
  
  await conn.end();
}

main().catch(console.error);
