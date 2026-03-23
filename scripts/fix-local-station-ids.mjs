/**
 * local_stationのsellersをlocation情報から具体的なfacilityIdに変換
 * 例: location='秋田駅' → facilityId='akita_station'
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// location文字列 → facilityId のマッピング
const LOCATION_TO_FACILITY = {
  // 東北
  '青森駅': 'aomori_station',
  '盛岡駅': 'morioka_station',
  '秋田駅': 'akita_station',
  '山形駅': 'yamagata_station',
  '仙台駅': 'sendai_station',
  '福島駅': 'fukushima_station',
  // 関東
  '東京駅': 'tokyo_station',
  '渋谷駅': 'shibuya_station',
  '新宿駅': 'shinjuku_station',
  // 中部
  '甲府駅': 'kofu_station',
  '長野駅': 'nagano_station',
  '新潟駅': 'niigata_station',
  '静岡駅': 'shizuoka_station',
  '名古屋駅': 'nagoya_station',
  // 北陸
  '金沢駅': 'kanazawa_station',
  // 関西
  '京都駅': 'kyoto_station',
  '新大阪駅': 'shin_osaka_station',
  '大阪駅': 'osaka_station',
  // 中国
  '広島駅': 'hiroshima_station',
  '岡山駅': 'okayama_station',
  // 九州
  '博多駅': 'hakata_station',
  '熊本駅': 'kumamoto_station',
  '鹿児島中央駅': 'kagoshima_station',
  '宮崎駅': 'miyazaki_station',
  '長崎駅': 'nagasaki_station',
  '佐賀駅': 'saga_station',
  // 沖縄
  '国際通り みやげ店各店': 'kokusaidori',
  '国際通り': 'kokusaidori',
  '那覇空港': 'naha_airport',
  // 地方（汎用）
  '主要駅': 'local_station',
  '愛媛県の主要駅': 'local_station',
  '島根県の主要駅': 'local_station',
  '鳥取県の主要駅': 'local_station',
  '山口県の主要駅': 'local_station',
  '香川県の主要駅': 'local_station',
};

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // local_stationのsellersを全件取得
  const [sellers] = await conn.query(
    "SELECT id, location, facilityId FROM sellers WHERE facilityId = 'local_station'"
  );
  console.log(`local_station sellers: ${sellers.length}件`);

  let updated = 0;
  let skipped = 0;

  for (const seller of sellers) {
    const newFacilityId = LOCATION_TO_FACILITY[seller.location];
    if (newFacilityId && newFacilityId !== 'local_station') {
      await conn.query(
        'UPDATE sellers SET facilityId = ? WHERE id = ?',
        [newFacilityId, seller.id]
      );
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`更新: ${updated}件 / スキップ（local_stationのまま）: ${skipped}件`);

  // 結果確認
  const [result] = await conn.query(
    "SELECT facilityId, COUNT(*) as cnt FROM sellers GROUP BY facilityId ORDER BY cnt DESC LIMIT 25"
  );
  console.log('\n=== 更新後のfacilityId別件数 ===');
  result.forEach(r => console.log(' ', r.facilityId, ':', r.cnt));

  await conn.end();
}

main().catch(console.error);
