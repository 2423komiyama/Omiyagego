/**
 * 名古屋・静岡エリア 施設マスターデータ投入スクリプト
 * 実行: node scripts/seed-nagoya-shizuoka-facilities.mjs
 */
import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ============================================================
// 施設マスターデータ（facilities）
// ============================================================
const facilities = [
  // ── 名古屋エリア ──────────────────────────────────────────
  {
    id: 'nagoya_station',
    name: '名古屋駅',
    shortLabel: '名古屋駅',
    region: '中部',
    prefecture: '愛知県',
    latitude: 35.17060,
    longitude: 136.88160,
    insideGate: 0,
  },
  {
    id: 'chubu_airport',
    name: '中部国際空港（セントレア）',
    shortLabel: 'セントレア',
    region: '中部',
    prefecture: '愛知県',
    latitude: 34.85830,
    longitude: 136.80530,
    insideGate: 1,
  },
  {
    id: 'nagoya_sakae',
    name: '栄（名古屋市営地下鉄栄駅）',
    shortLabel: '栄',
    region: '中部',
    prefecture: '愛知県',
    latitude: 35.16940,
    longitude: 136.90820,
    insideGate: 0,
  },
  {
    id: 'kanayama_station',
    name: '金山駅',
    shortLabel: '金山駅',
    region: '中部',
    prefecture: '愛知県',
    latitude: 35.14390,
    longitude: 136.89780,
    insideGate: 0,
  },
  {
    id: 'meitetsu_nagoya',
    name: '名鉄名古屋駅',
    shortLabel: '名鉄名古屋',
    region: '中部',
    prefecture: '愛知県',
    latitude: 35.17000,
    longitude: 136.88200,
    insideGate: 0,
  },
  // ── 静岡エリア ────────────────────────────────────────────
  {
    id: 'shizuoka_station',
    name: '静岡駅',
    shortLabel: '静岡駅',
    region: '中部',
    prefecture: '静岡県',
    latitude: 34.97140,
    longitude: 138.38890,
    insideGate: 0,
  },
  {
    id: 'hamamatsu_station',
    name: '浜松駅',
    shortLabel: '浜松駅',
    region: '中部',
    prefecture: '静岡県',
    latitude: 34.70390,
    longitude: 137.73460,
    insideGate: 0,
  },
  {
    id: 'shin_fuji_station',
    name: '新富士駅',
    shortLabel: '新富士駅',
    region: '中部',
    prefecture: '静岡県',
    latitude: 35.14950,
    longitude: 138.64550,
    insideGate: 0,
  },
  {
    id: 'mishima_station',
    name: '三島駅',
    shortLabel: '三島駅',
    region: '中部',
    prefecture: '静岡県',
    latitude: 35.11620,
    longitude: 138.91810,
    insideGate: 0,
  },
];

console.log('=== 施設マスターデータ投入開始 ===');
let insertedFacilities = 0;
let updatedFacilities = 0;

for (const f of facilities) {
  const [existing] = await conn.execute('SELECT id FROM facilities WHERE id = ?', [f.id]);
  if (existing.length > 0) {
    await conn.execute(
      'UPDATE facilities SET name=?, shortLabel=?, region=?, prefecture=?, latitude=?, longitude=?, insideGate=?, updatedAt=NOW() WHERE id=?',
      [f.name, f.shortLabel, f.region, f.prefecture, f.latitude, f.longitude, f.insideGate, f.id]
    );
    console.log(`  更新: ${f.id} (${f.name})`);
    updatedFacilities++;
  } else {
    await conn.execute(
      'INSERT INTO facilities (id, name, shortLabel, region, prefecture, latitude, longitude, insideGate) VALUES (?,?,?,?,?,?,?,?)',
      [f.id, f.name, f.shortLabel, f.region, f.prefecture, f.latitude, f.longitude, f.insideGate]
    );
    console.log(`  追加: ${f.id} (${f.name})`);
    insertedFacilities++;
  }
}

console.log(`\n施設マスター: 追加${insertedFacilities}件 / 更新${updatedFacilities}件`);

await conn.end();
console.log('\n=== 完了 ===');
