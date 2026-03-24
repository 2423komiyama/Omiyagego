/**
 * 名古屋・静岡エリア 商品・売り場データ投入スクリプト
 * 実行: node scripts/seed-nagoya-shizuoka-products.mjs
 */
import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { randomBytes } from 'crypto';
config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

function genId(prefix = '') {
  return prefix + randomBytes(6).toString('hex');
}

// ============================================================
// 商品データ（products）
// ============================================================
const products = [
  // ── 名古屋エリア 追加商品 ──────────────────────────────────
  {
    id: genId('ngy_'),
    name: 'なごやん',
    brand: '不二家',
    description: '名古屋限定の白あん入りまんじゅう。ふんわりした皮と上品な甘さが特徴で、名古屋土産の定番中の定番。',
    price: 756,
    prefecture: '愛知県',
    region: '中部',
    category: '和菓子',
    shelfLife: 14,
    isIndividualPackaged: 1,
    servingSize: 6,
    badges: 'bestseller,long_shelf_life',
    purposeTags: '挨拶,御礼,社内配布',
    minPeople: 4,
    maxPeople: 8,
    editorialPick: 1,
    editorialNote: '名古屋土産の代名詞。配りやすい個包装で職場へのお土産に最適。',
    makerName: '不二家',
    guaranteeReason: '名古屋限定品として長年愛されるブランド力と安定した品質',
  },
  {
    id: genId('ngy_'),
    name: '青柳ういろう 詰合せ',
    brand: '青柳総本家',
    description: '名古屋を代表する和菓子「ういろう」の老舗・青柳総本家の詰合せ。白・黒・抹茶・桜など多彩な味が楽しめる。',
    price: 1080,
    prefecture: '愛知県',
    region: '中部',
    category: '和菓子',
    shelfLife: 10,
    isIndividualPackaged: 1,
    servingSize: 8,
    badges: 'traditional,bestseller',
    purposeTags: '挨拶,御礼,差し入れ',
    minPeople: 5,
    maxPeople: 10,
    editorialPick: 1,
    editorialNote: '名古屋の伝統菓子の代表格。多彩な味のセットで贈り先を選ばない。',
    makerName: '青柳総本家',
    makerFoundedYear: 1879,
    guaranteeReason: '創業140年以上の老舗が作る本格ういろう',
  },
  {
    id: genId('ngy_'),
    name: 'ぴよりんケーキ',
    brand: 'シャトレーゼ',
    description: '名古屋コーチンの卵を使ったひよこ型のプリンケーキ。SNSで大人気の名古屋限定スイーツ。要冷蔵。',
    price: 648,
    prefecture: '愛知県',
    region: '中部',
    category: '洋菓子',
    shelfLife: 3,
    isIndividualPackaged: 1,
    servingSize: 1,
    badges: 'instagrammable,limited',
    purposeTags: '自分用,差し入れ,子供向け',
    minPeople: 1,
    maxPeople: 2,
    editorialPick: 1,
    editorialNote: 'SNS映え抜群の名古屋限定スイーツ。購入できる店舗が限られるため希少価値も高い。',
    makerName: 'シャトレーゼ名古屋',
    guaranteeReason: '名古屋コーチン卵使用の本格スイーツ、SNS映えする独自デザイン',
  },
  {
    id: genId('ngy_'),
    name: '坂角総本家 ゆかり 大缶',
    brand: '坂角総本家',
    description: '海老の風味豊かな薄焼きせんべい「ゆかり」の大缶。明治26年創業の老舗が作る名古屋を代表する海老せんべい。',
    price: 2160,
    prefecture: '愛知県',
    region: '中部',
    category: '煎餅・おかき',
    shelfLife: 60,
    isIndividualPackaged: 1,
    servingSize: 20,
    badges: 'traditional,long_shelf_life,bestseller',
    purposeTags: '挨拶,御礼,社内配布,接待',
    minPeople: 10,
    maxPeople: 25,
    editorialPick: 1,
    editorialNote: '名古屋みやげの王道。日持ちが良く大人数への配り土産に最適。',
    makerName: '坂角総本家',
    makerFoundedYear: 1893,
    guaranteeReason: '創業130年以上の老舗、愛知県産の海老を使用した本格品',
  },
  {
    id: genId('ngy_'),
    name: '矢場とん みそかつ棒',
    brand: '矢場とん',
    description: '名古屋名物みそかつの老舗「矢場とん」のお土産用みそかつ棒。本場の八丁味噌ソースの味が楽しめる。',
    price: 1080,
    prefecture: '愛知県',
    region: '中部',
    category: '食品',
    shelfLife: 30,
    isIndividualPackaged: 1,
    servingSize: 5,
    badges: 'local_specialty',
    purposeTags: '挨拶,御礼,差し入れ',
    minPeople: 3,
    maxPeople: 6,
    editorialPick: 0,
    makerName: '矢場とん',
    makerFoundedYear: 1947,
    guaranteeReason: '名古屋みそかつの代名詞的老舗ブランド',
  },
  {
    id: genId('ngy_'),
    name: '名古屋コーチン親子丼の素',
    brand: '名古屋コーチン農業協同組合',
    description: '名古屋コーチンを使った本格親子丼の素。ご飯にかけるだけで本場の味が楽しめる。',
    price: 864,
    prefecture: '愛知県',
    region: '中部',
    category: '食品',
    shelfLife: 180,
    isIndividualPackaged: 1,
    servingSize: 2,
    badges: 'long_shelf_life',
    purposeTags: '挨拶,御礼,自分用',
    minPeople: 1,
    maxPeople: 3,
    editorialPick: 0,
    makerName: '名古屋コーチン農業協同組合',
    guaranteeReason: '名古屋コーチン認定ブランドの正規品',
  },
  {
    id: genId('ngy_'),
    name: '鯱もなか',
    brand: '両口屋是清',
    description: '名古屋城の金のしゃちほこをかたどったもなか。上品な粒あんと香ばしい皮が特徴の名古屋銘菓。',
    price: 1296,
    prefecture: '愛知県',
    region: '中部',
    category: '和菓子',
    shelfLife: 21,
    isIndividualPackaged: 1,
    servingSize: 6,
    badges: 'traditional,local_specialty',
    purposeTags: '挨拶,御礼,接待',
    minPeople: 4,
    maxPeople: 8,
    editorialPick: 1,
    editorialNote: '名古屋城の象徴・金のしゃちほこをモチーフにした上品な和菓子。目上の方への贈り物にも最適。',
    makerName: '両口屋是清',
    makerFoundedYear: 1634,
    guaranteeReason: '創業390年の老舗和菓子店が作る格調ある名古屋銘菓',
  },
  {
    id: genId('ngy_'),
    name: '名古屋限定 きしめんパイ',
    brand: 'エスビー食品',
    description: '名古屋名物きしめんをモチーフにしたパイ菓子。サクサクの食感とだしの風味が楽しめる名古屋限定品。',
    price: 648,
    prefecture: '愛知県',
    region: '中部',
    category: '菓子',
    shelfLife: 45,
    isIndividualPackaged: 1,
    servingSize: 8,
    badges: 'limited,local_specialty',
    purposeTags: '差し入れ,社内配布,自分用',
    minPeople: 5,
    maxPeople: 10,
    editorialPick: 0,
    makerName: 'エスビー食品',
    guaranteeReason: '名古屋限定品、きしめんの風味を再現した独自商品',
  },
  {
    id: genId('ngy_'),
    name: '名古屋コーチン 燻製ソーセージ',
    brand: '名古屋コーチン農業協同組合',
    description: '名古屋コーチンを使った本格燻製ソーセージ。豊かな旨味と燻製の香りが特徴。',
    price: 1620,
    prefecture: '愛知県',
    region: '中部',
    category: '食品',
    shelfLife: 14,
    isIndividualPackaged: 0,
    servingSize: 4,
    badges: 'local_specialty',
    purposeTags: '御礼,接待,自分用',
    minPeople: 2,
    maxPeople: 5,
    editorialPick: 0,
    makerName: '名古屋コーチン農業協同組合',
    guaranteeReason: '名古屋コーチン認定ブランドの正規品',
  },
  {
    id: genId('ngy_'),
    name: '中部国際空港限定 セントレアクッキー',
    brand: 'セントレア',
    description: '中部国際空港（セントレア）限定のオリジナルクッキー。飛行機や空港をモチーフにしたかわいいデザイン。',
    price: 1080,
    prefecture: '愛知県',
    region: '中部',
    category: '洋菓子',
    shelfLife: 30,
    isIndividualPackaged: 1,
    servingSize: 10,
    badges: 'limited,airport_only',
    purposeTags: '挨拶,差し入れ,社内配布',
    minPeople: 6,
    maxPeople: 12,
    editorialPick: 0,
    makerName: 'セントレア',
    guaranteeReason: '空港限定品として入手困難な希少性',
  },
  {
    id: genId('ngy_'),
    name: '名古屋みそカツソース',
    brand: '盛田',
    description: '名古屋名物みそカツの本格八丁味噌ソース。家庭でも本場の味が楽しめる人気調味料。',
    price: 540,
    prefecture: '愛知県',
    region: '中部',
    category: '調味料・ソース',
    shelfLife: 365,
    isIndividualPackaged: 0,
    servingSize: 1,
    badges: 'long_shelf_life,local_specialty',
    purposeTags: '挨拶,御礼,自分用',
    minPeople: 1,
    maxPeople: 2,
    editorialPick: 0,
    makerName: '盛田',
    makerFoundedYear: 1665,
    guaranteeReason: '愛知県を代表する老舗醸造メーカーの本格品',
  },
  // ── 静岡エリア 追加商品 ──────────────────────────────────
  {
    id: genId('shz_'),
    name: 'うなぎパイ NIGHT（ナイト）',
    brand: '春華堂',
    description: 'うなぎパイの夜のお菓子シリーズ。ブランデー入りの大人向けうなぎパイ。',
    price: 1080,
    prefecture: '静岡県',
    region: '中部',
    category: '焼き菓子',
    shelfLife: 30,
    isIndividualPackaged: 1,
    servingSize: 8,
    badges: 'limited,adult',
    purposeTags: '御礼,接待,自分用',
    minPeople: 4,
    maxPeople: 8,
    editorialPick: 1,
    editorialNote: 'うなぎパイの大人向けバージョン。ブランデーの風味が上品で、大人へのお土産に最適。',
    makerName: '春華堂',
    makerFoundedYear: 1887,
    guaranteeReason: '創業130年以上の老舗が作る浜松の代表銘菓',
  },
  {
    id: genId('shz_'),
    name: '浜松餃子 冷凍セット',
    brand: '石松餃子',
    description: '浜松名物餃子の老舗「石松餃子」の冷凍セット。キャベツたっぷりのあっさりした浜松スタイル。',
    price: 1620,
    prefecture: '静岡県',
    region: '中部',
    category: '食品',
    shelfLife: 30,
    isIndividualPackaged: 0,
    servingSize: 4,
    badges: 'local_specialty',
    purposeTags: '御礼,自分用,家族へ',
    minPeople: 2,
    maxPeople: 5,
    editorialPick: 1,
    editorialNote: '浜松名物餃子を家庭で楽しめる冷凍セット。浜松土産の定番として人気急上昇中。',
    makerName: '石松餃子',
    guaranteeReason: '浜松餃子の代表的老舗ブランド',
  },
  {
    id: genId('shz_'),
    name: '富士山羊羹',
    brand: '田子の月',
    description: '富士山をかたどった美しい羊羹。抹茶・小豆・白あんの三層が富士山の景色を表現。',
    price: 1296,
    prefecture: '静岡県',
    region: '中部',
    category: '和菓子',
    shelfLife: 60,
    isIndividualPackaged: 1,
    servingSize: 6,
    badges: 'instagrammable,local_specialty,long_shelf_life',
    purposeTags: '挨拶,御礼,接待',
    minPeople: 4,
    maxPeople: 8,
    editorialPick: 1,
    editorialNote: '富士山を表現した美しい羊羹。見た目のインパクトで贈り先に喜ばれる。',
    makerName: '田子の月',
    guaranteeReason: '富士山の景色を再現した独自デザインと本格的な味',
  },
  {
    id: genId('shz_'),
    name: '静岡茶 飲み比べセット',
    brand: '丸七製茶',
    description: '静岡を代表する3種類のお茶（深蒸し茶・煎茶・ほうじ茶）の飲み比べセット。',
    price: 1620,
    prefecture: '静岡県',
    region: '中部',
    category: '飲料・お茶',
    shelfLife: 180,
    isIndividualPackaged: 1,
    servingSize: 3,
    badges: 'long_shelf_life,local_specialty',
    purposeTags: '挨拶,御礼,接待,自分用',
    minPeople: 1,
    maxPeople: 3,
    editorialPick: 1,
    editorialNote: '日本一のお茶産地・静岡の味を飲み比べで楽しめるセット。お茶好きへの贈り物に最適。',
    makerName: '丸七製茶',
    guaranteeReason: '静岡産100%の本格茶葉を使用',
  },
  {
    id: genId('shz_'),
    name: '桜えびのかき揚げ',
    brand: '由比港漁業協同組合',
    description: '駿河湾産の桜えびを使ったかき揚げ。静岡・由比の名産品で、ほんのりした甘みと香りが特徴。',
    price: 1080,
    prefecture: '静岡県',
    region: '中部',
    category: '海産物',
    shelfLife: 7,
    isIndividualPackaged: 0,
    servingSize: 2,
    badges: 'local_specialty',
    purposeTags: '御礼,自分用,差し入れ',
    minPeople: 1,
    maxPeople: 3,
    editorialPick: 0,
    makerName: '由比港漁業協同組合',
    guaranteeReason: '駿河湾産の新鮮な桜えびを使用した本場の味',
  },
  {
    id: genId('shz_'),
    name: '三島コロッケ',
    brand: '三島食品',
    description: '三島名物のコロッケ。三島産のじゃがいもと地元野菜を使ったシンプルで美味しいコロッケ。',
    price: 540,
    prefecture: '静岡県',
    region: '中部',
    category: '弁当・惣菜',
    shelfLife: 3,
    isIndividualPackaged: 0,
    servingSize: 2,
    badges: 'local_specialty',
    purposeTags: '自分用,差し入れ',
    minPeople: 1,
    maxPeople: 2,
    editorialPick: 0,
    makerName: '三島食品',
    guaranteeReason: '三島産じゃがいもを使った地元名物',
  },
  {
    id: genId('shz_'),
    name: 'わさびチョコレート',
    brand: '田丸屋本店',
    description: '静岡名産わさびを使ったチョコレート。ピリッとした辛みとチョコの甘みが絶妙にマッチ。',
    price: 864,
    prefecture: '静岡県',
    region: '中部',
    category: '洋菓子',
    shelfLife: 30,
    isIndividualPackaged: 1,
    servingSize: 8,
    badges: 'unique,local_specialty',
    purposeTags: '差し入れ,自分用,社内配布',
    minPeople: 4,
    maxPeople: 10,
    editorialPick: 0,
    makerName: '田丸屋本店',
    makerFoundedYear: 1875,
    guaranteeReason: '創業150年以上のわさび専門店が作る本格品',
  },
  {
    id: genId('shz_'),
    name: '富士山サイダー',
    brand: '富士山サイダー',
    description: '富士山の湧き水を使ったご当地サイダー。富士山をモチーフにしたボトルデザインも人気。',
    price: 324,
    prefecture: '静岡県',
    region: '中部',
    category: '飲料・お茶',
    shelfLife: 365,
    isIndividualPackaged: 1,
    servingSize: 1,
    badges: 'instagrammable,local_specialty',
    purposeTags: '自分用,差し入れ,子供向け',
    minPeople: 1,
    maxPeople: 1,
    editorialPick: 0,
    makerName: '富士山サイダー',
    guaranteeReason: '富士山の湧き水使用、ご当地限定品',
  },
  {
    id: genId('shz_'),
    name: '浜名湖産うなぎ蒲焼',
    brand: '浜名湖うなぎ',
    description: '浜名湖産の国産うなぎを使った本格蒲焼。真空パックで日持ちが良く、贈り物にも最適。',
    price: 3240,
    prefecture: '静岡県',
    region: '中部',
    category: '海産物',
    shelfLife: 90,
    isIndividualPackaged: 0,
    servingSize: 2,
    badges: 'premium,local_specialty,long_shelf_life',
    purposeTags: '御礼,接待,家族へ',
    minPeople: 1,
    maxPeople: 3,
    editorialPick: 1,
    editorialNote: '浜松・浜名湖産の本格うなぎ蒲焼。真空パックで持ち運びやすく、特別な贈り物に。',
    makerName: '浜名湖うなぎ',
    guaranteeReason: '浜名湖産国産うなぎ使用、産地直送の鮮度',
  },
  {
    id: genId('shz_'),
    name: '熱海温泉まんじゅう 詰合せ',
    brand: '熱海温泉まんじゅう本舗',
    description: '熱海温泉街の定番土産。温泉の蒸気で蒸した柔らかい皮と上品なあんが特徴。',
    price: 972,
    prefecture: '静岡県',
    region: '中部',
    category: '和菓子',
    shelfLife: 7,
    isIndividualPackaged: 1,
    servingSize: 8,
    badges: 'traditional,local_specialty',
    purposeTags: '挨拶,御礼,差し入れ',
    minPeople: 4,
    maxPeople: 10,
    editorialPick: 0,
    makerName: '熱海温泉まんじゅう本舗',
    guaranteeReason: '熱海温泉の蒸気で蒸した本格品',
  },
];

// ============================================================
// 売り場データ（sellers）
// ============================================================
// 商品IDは後で取得するため、商品名でマッピング
const sellersByProductName = {
  // 名古屋駅
  'なごやん': [
    { facilityId: 'nagoya_station', storeName: 'グランドキヨスク名古屋', floor: 'B1F', businessHours: '6:00-22:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1706,136.8816', walkMinutes: 2 },
    { facilityId: 'nagoya_station', storeName: 'JR名古屋タカシマヤ ゲートタワーモール B1F', floor: 'B1F', businessHours: '10:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1706,136.8816', walkMinutes: 3 },
    { facilityId: 'meitetsu_nagoya', storeName: '名鉄百貨店 本店 B1F', floor: 'B1F', businessHours: '10:00-20:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1700,136.8820', walkMinutes: 3 },
  ],
  '青柳ういろう 詰合せ': [
    { facilityId: 'nagoya_station', storeName: 'グランドキヨスク名古屋', floor: 'B1F', businessHours: '6:00-22:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1706,136.8816', walkMinutes: 2 },
    { facilityId: 'nagoya_station', storeName: 'JR名古屋タカシマヤ ゲートタワーモール B1F', floor: 'B1F', businessHours: '10:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1706,136.8816', walkMinutes: 3 },
    { facilityId: 'chubu_airport', storeName: 'セントレア スカイタウン 2F', floor: '2F', businessHours: '7:00-21:00', insideGate: 1, mapUrl: 'https://maps.google.com/?q=34.8583,136.8053', walkMinutes: 5 },
    { facilityId: 'nagoya_sakae', storeName: '松坂屋名古屋店 B2F', floor: 'B2F', businessHours: '10:00-20:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1694,136.9082', walkMinutes: 3 },
  ],
  'ぴよりんケーキ': [
    { facilityId: 'nagoya_station', storeName: 'カフェ・ド・クリエ 名古屋駅店', floor: '1F', businessHours: '7:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1706,136.8816', walkMinutes: 2 },
    { facilityId: 'nagoya_station', storeName: 'JR名古屋タカシマヤ ゲートタワーモール B1F', floor: 'B1F', businessHours: '10:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1706,136.8816', walkMinutes: 3 },
  ],
  '坂角総本家 ゆかり 大缶': [
    { facilityId: 'nagoya_station', storeName: 'グランドキヨスク名古屋', floor: 'B1F', businessHours: '6:00-22:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1706,136.8816', walkMinutes: 2 },
    { facilityId: 'nagoya_station', storeName: 'JR名古屋タカシマヤ ゲートタワーモール B1F', floor: 'B1F', businessHours: '10:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1706,136.8816', walkMinutes: 3 },
    { facilityId: 'chubu_airport', storeName: 'セントレア スカイタウン 2F', floor: '2F', businessHours: '7:00-21:00', insideGate: 1, mapUrl: 'https://maps.google.com/?q=34.8583,136.8053', walkMinutes: 5 },
    { facilityId: 'nagoya_sakae', storeName: '松坂屋名古屋店 B2F', floor: 'B2F', businessHours: '10:00-20:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1694,136.9082', walkMinutes: 3 },
    { facilityId: 'kanayama_station', storeName: 'アスナル金山 1F', floor: '1F', businessHours: '10:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1439,136.8978', walkMinutes: 3 },
  ],
  '矢場とん みそかつ棒': [
    { facilityId: 'nagoya_station', storeName: 'JR名古屋タカシマヤ ゲートタワーモール B1F', floor: 'B1F', businessHours: '10:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1706,136.8816', walkMinutes: 3 },
    { facilityId: 'nagoya_sakae', storeName: '松坂屋名古屋店 B2F', floor: 'B2F', businessHours: '10:00-20:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1694,136.9082', walkMinutes: 3 },
  ],
  '名古屋コーチン親子丼の素': [
    { facilityId: 'nagoya_station', storeName: 'グランドキヨスク名古屋', floor: 'B1F', businessHours: '6:00-22:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1706,136.8816', walkMinutes: 2 },
    { facilityId: 'chubu_airport', storeName: 'セントレア スカイタウン 2F', floor: '2F', businessHours: '7:00-21:00', insideGate: 1, mapUrl: 'https://maps.google.com/?q=34.8583,136.8053', walkMinutes: 5 },
  ],
  '鯱もなか': [
    { facilityId: 'nagoya_station', storeName: 'JR名古屋タカシマヤ ゲートタワーモール B1F', floor: 'B1F', businessHours: '10:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1706,136.8816', walkMinutes: 3 },
    { facilityId: 'nagoya_sakae', storeName: '両口屋是清 栄本店', floor: '1F', businessHours: '10:00-19:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1694,136.9082', walkMinutes: 2 },
    { facilityId: 'meitetsu_nagoya', storeName: '名鉄百貨店 本店 B1F', floor: 'B1F', businessHours: '10:00-20:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1700,136.8820', walkMinutes: 3 },
  ],
  '名古屋限定 きしめんパイ': [
    { facilityId: 'nagoya_station', storeName: 'グランドキヨスク名古屋', floor: 'B1F', businessHours: '6:00-22:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1706,136.8816', walkMinutes: 2 },
    { facilityId: 'chubu_airport', storeName: 'セントレア スカイタウン 2F', floor: '2F', businessHours: '7:00-21:00', insideGate: 1, mapUrl: 'https://maps.google.com/?q=34.8583,136.8053', walkMinutes: 5 },
  ],
  '名古屋コーチン 燻製ソーセージ': [
    { facilityId: 'nagoya_station', storeName: 'JR名古屋タカシマヤ ゲートタワーモール B1F', floor: 'B1F', businessHours: '10:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1706,136.8816', walkMinutes: 3 },
    { facilityId: 'nagoya_sakae', storeName: '松坂屋名古屋店 B2F', floor: 'B2F', businessHours: '10:00-20:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1694,136.9082', walkMinutes: 3 },
  ],
  '中部国際空港限定 セントレアクッキー': [
    { facilityId: 'chubu_airport', storeName: 'セントレア スカイタウン 2F', floor: '2F', businessHours: '7:00-21:00', insideGate: 1, mapUrl: 'https://maps.google.com/?q=34.8583,136.8053', walkMinutes: 5 },
    { facilityId: 'chubu_airport', storeName: 'セントレア 国際線ターミナル 3F', floor: '3F', businessHours: '6:00-22:00', insideGate: 1, mapUrl: 'https://maps.google.com/?q=34.8583,136.8053', walkMinutes: 8 },
  ],
  '名古屋みそカツソース': [
    { facilityId: 'nagoya_station', storeName: 'グランドキヨスク名古屋', floor: 'B1F', businessHours: '6:00-22:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1706,136.8816', walkMinutes: 2 },
    { facilityId: 'nagoya_station', storeName: 'JR名古屋タカシマヤ ゲートタワーモール B1F', floor: 'B1F', businessHours: '10:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1706,136.8816', walkMinutes: 3 },
    { facilityId: 'chubu_airport', storeName: 'セントレア スカイタウン 2F', floor: '2F', businessHours: '7:00-21:00', insideGate: 1, mapUrl: 'https://maps.google.com/?q=34.8583,136.8053', walkMinutes: 5 },
  ],
  // 静岡エリア
  'うなぎパイ NIGHT（ナイト）': [
    { facilityId: 'hamamatsu_station', storeName: 'ギフトキヨスク浜松', floor: '1F', businessHours: '6:00-22:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=34.7039,137.7346', walkMinutes: 2 },
    { facilityId: 'hamamatsu_station', storeName: '浜松メイワン B1F', floor: 'B1F', businessHours: '10:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=34.7039,137.7346', walkMinutes: 3 },
    { facilityId: 'shizuoka_station', storeName: 'ギフトキヨスク静岡', floor: '1F', businessHours: '6:00-22:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=34.9714,138.3889', walkMinutes: 2 },
    { facilityId: 'chubu_airport', storeName: 'セントレア スカイタウン 2F', floor: '2F', businessHours: '7:00-21:00', insideGate: 1, mapUrl: 'https://maps.google.com/?q=34.8583,136.8053', walkMinutes: 5 },
  ],
  '浜松餃子 冷凍セット': [
    { facilityId: 'hamamatsu_station', storeName: '浜松メイワン B1F', floor: 'B1F', businessHours: '10:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=34.7039,137.7346', walkMinutes: 3 },
    { facilityId: 'hamamatsu_station', storeName: 'ギフトキヨスク浜松', floor: '1F', businessHours: '6:00-22:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=34.7039,137.7346', walkMinutes: 2 },
  ],
  '富士山羊羹': [
    { facilityId: 'shin_fuji_station', storeName: 'ギフトキヨスク新富士', floor: '1F', businessHours: '6:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1495,138.6455', walkMinutes: 2 },
    { facilityId: 'mishima_station', storeName: 'ギフトキヨスク三島', floor: '1F', businessHours: '6:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1162,138.9181', walkMinutes: 2 },
    { facilityId: 'shizuoka_station', storeName: 'ギフトキヨスク静岡', floor: '1F', businessHours: '6:00-22:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=34.9714,138.3889', walkMinutes: 2 },
  ],
  '静岡茶 飲み比べセット': [
    { facilityId: 'shizuoka_station', storeName: 'ギフトキヨスク静岡', floor: '1F', businessHours: '6:00-22:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=34.9714,138.3889', walkMinutes: 2 },
    { facilityId: 'shizuoka_station', storeName: 'パルシェ 静岡駅ビル B1F', floor: 'B1F', businessHours: '10:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=34.9714,138.3889', walkMinutes: 3 },
    { facilityId: 'shin_fuji_station', storeName: 'ギフトキヨスク新富士', floor: '1F', businessHours: '6:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1495,138.6455', walkMinutes: 2 },
    { facilityId: 'mishima_station', storeName: 'ギフトキヨスク三島', floor: '1F', businessHours: '6:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1162,138.9181', walkMinutes: 2 },
    { facilityId: 'chubu_airport', storeName: 'セントレア スカイタウン 2F', floor: '2F', businessHours: '7:00-21:00', insideGate: 1, mapUrl: 'https://maps.google.com/?q=34.8583,136.8053', walkMinutes: 5 },
  ],
  '桜えびのかき揚げ': [
    { facilityId: 'shizuoka_station', storeName: 'ギフトキヨスク静岡', floor: '1F', businessHours: '6:00-22:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=34.9714,138.3889', walkMinutes: 2 },
    { facilityId: 'shin_fuji_station', storeName: 'ギフトキヨスク新富士', floor: '1F', businessHours: '6:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1495,138.6455', walkMinutes: 2 },
  ],
  '三島コロッケ': [
    { facilityId: 'mishima_station', storeName: '三島駅 売店', floor: '1F', businessHours: '7:00-20:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1162,138.9181', walkMinutes: 1 },
  ],
  'わさびチョコレート': [
    { facilityId: 'shizuoka_station', storeName: 'ギフトキヨスク静岡', floor: '1F', businessHours: '6:00-22:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=34.9714,138.3889', walkMinutes: 2 },
    { facilityId: 'mishima_station', storeName: 'ギフトキヨスク三島', floor: '1F', businessHours: '6:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1162,138.9181', walkMinutes: 2 },
    { facilityId: 'shin_fuji_station', storeName: 'ギフトキヨスク新富士', floor: '1F', businessHours: '6:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1495,138.6455', walkMinutes: 2 },
  ],
  '富士山サイダー': [
    { facilityId: 'shin_fuji_station', storeName: 'ギフトキヨスク新富士', floor: '1F', businessHours: '6:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1495,138.6455', walkMinutes: 2 },
    { facilityId: 'mishima_station', storeName: 'ギフトキヨスク三島', floor: '1F', businessHours: '6:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1162,138.9181', walkMinutes: 2 },
    { facilityId: 'shizuoka_station', storeName: 'ギフトキヨスク静岡', floor: '1F', businessHours: '6:00-22:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=34.9714,138.3889', walkMinutes: 2 },
  ],
  '浜名湖産うなぎ蒲焼': [
    { facilityId: 'hamamatsu_station', storeName: '浜松メイワン B1F', floor: 'B1F', businessHours: '10:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=34.7039,137.7346', walkMinutes: 3 },
    { facilityId: 'hamamatsu_station', storeName: 'ギフトキヨスク浜松', floor: '1F', businessHours: '6:00-22:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=34.7039,137.7346', walkMinutes: 2 },
  ],
  '熱海温泉まんじゅう 詰合せ': [
    { facilityId: 'mishima_station', storeName: 'ギフトキヨスク三島', floor: '1F', businessHours: '6:00-21:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=35.1162,138.9181', walkMinutes: 2 },
    { facilityId: 'shizuoka_station', storeName: 'ギフトキヨスク静岡', floor: '1F', businessHours: '6:00-22:00', insideGate: 0, mapUrl: 'https://maps.google.com/?q=34.9714,138.3889', walkMinutes: 2 },
  ],
};

// ============================================================
// データ投入
// ============================================================
console.log('=== 商品データ投入開始 ===');
let insertedProducts = 0;
let skippedProducts = 0;
const productIdMap = {}; // name -> id

for (const p of products) {
  const [existing] = await conn.execute('SELECT id FROM products WHERE name=? AND prefecture=?', [p.name, p.prefecture]);
  if (existing.length > 0) {
    console.log(`  スキップ（既存）: ${p.name}`);
    productIdMap[p.name] = existing[0].id;
    skippedProducts++;
    continue;
  }
  await conn.execute(
    `INSERT INTO products (id, name, brand, description, price, prefecture, region, category, shelfLife, isIndividualPackaged, servingSize, badges, purposeTags, minPeople, maxPeople, editorialPick, editorialNote, makerName, makerFoundedYear, guaranteeReason) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [p.id, p.name, p.brand, p.description, p.price, p.prefecture, p.region, p.category, p.shelfLife ?? null, p.isIndividualPackaged ?? 0, p.servingSize ?? null, p.badges ?? null, p.purposeTags ?? null, p.minPeople ?? null, p.maxPeople ?? null, p.editorialPick ?? 0, p.editorialNote ?? null, p.makerName ?? null, p.makerFoundedYear ?? null, p.guaranteeReason ?? null]
  );
  productIdMap[p.name] = p.id;
  console.log(`  追加: ${p.name} (${p.id})`);
  insertedProducts++;
}

console.log(`\n商品: 追加${insertedProducts}件 / スキップ${skippedProducts}件`);

console.log('\n=== 売り場データ投入開始 ===');
let insertedSellers = 0;
let skippedSellers = 0;

for (const [productName, sellerList] of Object.entries(sellersByProductName)) {
  const productId = productIdMap[productName];
  if (!productId) {
    console.log(`  警告: 商品IDが見つかりません: ${productName}`);
    continue;
  }
  for (const s of sellerList) {
    const [existing] = await conn.execute(
      'SELECT id FROM sellers WHERE productId=? AND facilityId=? AND storeName=?',
      [productId, s.facilityId, s.storeName]
    );
    if (existing.length > 0) {
      skippedSellers++;
      continue;
    }
    const sellerId = genId('sel_');
    await conn.execute(
      `INSERT INTO sellers (id, productId, facilityId, storeName, floor, businessHours, insideGate, mapUrl, walkMinutes) VALUES (?,?,?,?,?,?,?,?,?)`,
      [sellerId, productId, s.facilityId, s.storeName, s.floor ?? null, s.businessHours ?? null, s.insideGate ?? 0, s.mapUrl ?? null, s.walkMinutes ?? null]
    );
    insertedSellers++;
  }
}

console.log(`売り場: 追加${insertedSellers}件 / スキップ${skippedSellers}件`);

// 確認
const [nagoyaCount] = await conn.execute('SELECT COUNT(*) as cnt FROM sellers WHERE facilityId="nagoya_station"');
const [chubuCount] = await conn.execute('SELECT COUNT(*) as cnt FROM sellers WHERE facilityId="chubu_airport"');
const [shizuokaCount] = await conn.execute('SELECT COUNT(*) as cnt FROM sellers WHERE facilityId="shizuoka_station"');
const [hamamatsuCount] = await conn.execute('SELECT COUNT(*) as cnt FROM sellers WHERE facilityId="hamamatsu_station"');
const [shinFujiCount] = await conn.execute('SELECT COUNT(*) as cnt FROM sellers WHERE facilityId="shin_fuji_station"');
const [mishimaCount] = await conn.execute('SELECT COUNT(*) as cnt FROM sellers WHERE facilityId="mishima_station"');

console.log('\n=== 最終確認 ===');
console.log('名古屋駅:', nagoyaCount[0].cnt, '件');
console.log('セントレア:', chubuCount[0].cnt, '件');
console.log('静岡駅:', shizuokaCount[0].cnt, '件');
console.log('浜松駅:', hamamatsuCount[0].cnt, '件');
console.log('新富士駅:', shinFujiCount[0].cnt, '件');
console.log('三島駅:', mishimaCount[0].cnt, '件');

await conn.end();
console.log('\n=== 完了 ===');
