# Omiyage Go - データ管理構造ガイド

## 📊 現在のデータ管理形式

### 1. **フロントエンド静的データ（現在の実装）**

```
client/src/lib/mockData.ts
├── FACILITIES[] ────────────────── 施設マスタ（23施設）
│   ├── id: FacilityId
│   ├── label: 施設名（フル）
│   ├── shortLabel: 施設名（短縮）
│   └── coords: { lat, lng }
│
├── PRODUCTS[] ──────────────────── 都内商品（38件）
│   └── 東京駅・羽田・品川・新宿・渋谷の売り場商品
│
├── NATIONAL_PRODUCTS[] ────────── 全国商品（60件）
│   └── 北海道～沖縄の15地域商品
│
└── ALL_PRODUCTS[] ──────────────── 統合データ（98件）
    └── PRODUCTS + NATIONAL_PRODUCTS
```

### 2. **Product型の階層構造**

```typescript
Product {
  // 基本情報
  id: "p001"
  name: "北海道バターサンド"
  brand: "六花亭"
  price: 1500
  imageUrl: "https://..."
  
  // 分類
  category: "バター菓子"
  prefecture: "北海道"
  region: "北海道"
  purposes: ["接待", "家族へ"]
  budgetCategory: 1500
  badges: ["editorial", "local"]
  
  // 制約条件（フィルタリング用）
  shelfLifeDays: 30
  individuallyWrapped: true
  temperature: "常温"
  allergens: ["乳製品", "小麦"]
  
  // 保証書
  guaranteeReasons: ["北海道産バター使用", "職人手作り"]
  guaranteeOneLiner: "北海道の最高級バターを使った逸品"
  
  // 売り場情報（複数可）
  sellers: [
    {
      facilityId: "tokyo"
      shopName: "グランスタ東京"
      gateStatus: "改札内"
      floor: "B1F"
      walkingMinutes: 5
      crowdLevel: "多"
      openHours: "08:00-22:00"
      coords: { lat: 35.6812, lng: 139.7671 }
    },
    {
      facilityId: "haneda_t2"
      shopName: "羽田エキスプレス"
      gateStatus: "改札外"
      floor: "1F"
      walkingMinutes: 8
      crowdLevel: "中"
      openHours: "07:00-21:00"
      coords: { lat: 35.5494, lng: 139.7798 }
    }
  ]
  
  // 在庫・配送
  stockStatus: "available"
  canReserve: true
  canPrePay: true
  canDeliver: true
}
```

---

## 🔄 データ追加・更新の3つの方法

### **方法1: フロントエンド静的データ（現在の実装）**

**メリット:**
- サーバー不要、デプロイが高速
- 小〜中規模データ（100件程度）に最適
- 開発環境ですぐテスト可能

**デメリット:**
- 1000件超のデータは管理が煩雑
- リアルタイム更新不可（ビルド必須）
- 在庫状態の動的更新が困難

**追加手順:**
```bash
# 1. mockData.tsのNATIONAL_PRODUCTS配列に新規商品を追加
const newProduct: Product = {
  id: "p099",
  name: "新商品名",
  brand: "ブランド",
  // ... 他のフィールド
  sellers: [
    {
      facilityId: "tokyo",
      shopName: "店舗名",
      // ... 売り場情報
    }
  ]
};

# 2. NATIONAL_PRODUCTS配列に追加
NATIONAL_PRODUCTS.push(newProduct);

# 3. ビルド・デプロイ
pnpm build
```

---

### **方法2: バックエンド + データベース（推奨・将来対応）**

**メリット:**
- 大規模データ（10000件超）に対応
- リアルタイム更新・在庫管理可能
- 管理画面で簡単追加・編集
- 複数ユーザーの同時編集対応

**推奨構成:**
```
Backend (Node.js/Express)
├── API エンドポイント
│   ├── GET /api/products ────── 商品一覧取得
│   ├── GET /api/products/:id ── 商品詳細取得
│   ├── POST /api/products ───── 商品追加（管理者）
│   ├── PUT /api/products/:id ── 商品更新（管理者）
│   └── DELETE /api/products/:id ─ 商品削除（管理者）
│
└── Database (PostgreSQL/MongoDB)
    ├── products テーブル
    ├── sellers テーブル
    ├── facilities テーブル
    └── stock_history テーブル
```

**実装例（Node.js/Express）:**
```typescript
// server/routes/products.ts
import express from "express";
import { db } from "../db";

const router = express.Router();

// 商品一覧取得
router.get("/api/products", async (req, res) => {
  const { region, category, maxPrice } = req.query;
  let query = "SELECT * FROM products WHERE 1=1";
  
  if (region) query += ` AND region = '${region}'`;
  if (category) query += ` AND category = '${category}'`;
  if (maxPrice) query += ` AND price <= ${maxPrice}`;
  
  const products = await db.query(query);
  res.json(products);
});

// 商品追加（管理者のみ）
router.post("/api/products", async (req, res) => {
  const { name, brand, price, prefecture, sellers } = req.body;
  
  const productId = await db.query(
    "INSERT INTO products (name, brand, price, prefecture) VALUES (?, ?, ?, ?)",
    [name, brand, price, prefecture]
  );
  
  // 売り場情報も同時に登録
  for (const seller of sellers) {
    await db.query(
      "INSERT INTO sellers (product_id, facility_id, shop_name, gate_status) VALUES (?, ?, ?, ?)",
      [productId, seller.facilityId, seller.shopName, seller.gateStatus]
    );
  }
  
  res.json({ id: productId, message: "商品を追加しました" });
});

export default router;
```

---

### **方法3: ヘッドレスCMS + API（スケーラブル）**

**推奨CMS:**
- **Contentful** — 柔軟なコンテンツモデル、API優先
- **Sanity.io** — リアルタイムコラボレーション、カスタムスキーマ
- **Strapi** — オープンソース、セルフホスト対応

**メリット:**
- ノーコード/ローコードで管理画面完備
- 複数チームでの同時編集対応
- メディア管理・バージョン管理機能
- Webhookでリアルタイム更新

**実装例（Contentful）:**
```typescript
// client/src/lib/contentful.ts
import { createClient } from "contentful";

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
});

export async function getProducts(region?: string) {
  const query: any = {
    content_type: "product",
  };
  
  if (region) {
    query["fields.region"] = region;
  }
  
  const response = await client.getEntries(query);
  return response.items.map((item: any) => ({
    id: item.sys.id,
    name: item.fields.name,
    brand: item.fields.brand,
    price: item.fields.price,
    prefecture: item.fields.prefecture,
    sellers: item.fields.sellers,
    // ...
  }));
}
```

---

## 📈 推奨される段階的な移行計画

### **Phase 1: 現在（フロントエンド静的）**
- ✅ 98件のデータで運用開始
- ✅ 迅速なデプロイ・テスト
- 対応: 〜500件程度

### **Phase 2: バックエンド導入（3-6ヶ月後）**
- 🔄 webdev_add_feature で `web-db-user` にアップグレード
- 🔄 PostgreSQL/MongoDBでデータベース構築
- 🔄 管理画面（CRUD）を実装
- 対応: 〜10000件

### **Phase 3: CMS連携（6-12ヶ月後）**
- 🔄 Contentful/Sanity.io導入
- 🔄 複数チームでの同時編集対応
- 🔄 在庫管理・リアルタイム更新
- 対応: 無制限

---

## 🛠️ 現在のデータ追加手順（詳細）

### **1. 新規商品を追加する場合**

**ファイル:** `client/src/lib/mockData.ts`

```typescript
// 1. NATIONAL_PRODUCTS配列の末尾に新規商品を追加
const newProduct: Product = {
  id: "p099",  // ユニークID（p001〜p098の次）
  name: "福岡 明太子せんべい",
  brand: "ふくや",
  price: 1200,
  priceLabel: "¥1,200",
  imageUrl: IMG.snack,  // 画像URLプール内から選択
  badges: ["local"],
  badgeLabels: ["福岡発"],
  category: "せんべい・煎餅",
  
  // 制約条件
  shelfLifeDays: 60,
  individuallyWrapped: true,
  recommendedCount: 45,
  temperature: "常温",
  allergens: ["卵", "小麦", "えび"],
  
  // 保証書
  guaranteeReasons: [
    "福岡産明太子を使用",
    "伝統製法で焼き上げ"
  ],
  guaranteeOneLiner: "福岡の味を代表する逸品",
  
  // 文脈
  makerQuote: "明太子の風味を最大限に引き出しました",
  makerStory: "1962年創業。福岡の明太子文化を世界へ",
  makerName: "ふくや",
  
  // 贈り文テンプレ
  giftTemplates: {
    greeting: "福岡から届いた明太子の香り",
    thanks: "福岡の味をありがとう",
    apology: "福岡の美味しさでお詫びします"
  },
  
  // 売り場情報
  sellers: [
    {
      id: "seller_fukuoka_01",
      facilityId: "fukuoka",
      facilityName: "福岡空港",
      shopName: "福岡みやげ館",
      gateStatus: "改札外",
      floor: "1F",
      landmark: "国内線ターミナル",
      walkingMinutes: 3,
      crowdLevel: "中",
      openHours: "07:00-21:00",
      mapUrl: "https://maps.google.com/...",
      coords: { lat: 33.3562, lng: 130.4418 }
    },
    {
      id: "seller_fukuoka_02",
      facilityId: "fukuoka",
      facilityName: "福岡空港",
      shopName: "福岡銘品館",
      gateStatus: "改札内",
      floor: "2F",
      landmark: "国際線ターミナル",
      walkingMinutes: 5,
      crowdLevel: "少",
      openHours: "06:00-20:00",
      mapUrl: "https://maps.google.com/...",
      coords: { lat: 33.3562, lng: 130.4418 }
    }
  ],
  
  // 受取・配送
  canReserve: true,
  canPrePay: false,
  canDeliver: true,
  
  // 在庫状態
  stockStatus: "available",
  
  // 用途タグ
  purposes: ["接待", "家族へ", "親友へ"],
  
  // 予算カテゴリ
  budgetCategory: 1000,
  
  // 産地情報
  prefecture: "福岡県",
  region: "九州・沖縄"
};

// 2. NATIONAL_PRODUCTS配列に追加
NATIONAL_PRODUCTS.push(newProduct);

// 3. ALL_PRODUCTS は自動的に更新される
// export const ALL_PRODUCTS: Product[] = [...PRODUCTS, ...NATIONAL_PRODUCTS];
```

### **2. 売り場情報を更新する場合**

```typescript
// 既存商品の売り場を追加
const existingProduct = NATIONAL_PRODUCTS.find(p => p.id === "p050");
if (existingProduct) {
  existingProduct.sellers.push({
    id: "seller_new_01",
    facilityId: "nagoya",
    facilityName: "名古屋駅",
    shopName: "名古屋銘品館",
    gateStatus: "改札内",
    floor: "B1F",
    landmark: "エスカ内",
    walkingMinutes: 3,
    crowdLevel: "多",
    openHours: "08:00-22:00",
    mapUrl: "https://maps.google.com/...",
    coords: { lat: 35.1705, lng: 136.8817 }
  });
}
```

### **3. 施設を追加する場合**

```typescript
// FACILITIES配列に新規施設を追加
FACILITIES.push({
  id: "matsumoto" as FacilityId,
  label: "松本駅",
  shortLabel: "松本",
  coords: { lat: 36.2388, lng: 137.9713 }
});

// FacilityId型にも追加が必要
// type FacilityId = "..." | "matsumoto";
```

---

## 🔍 データの検索・フィルタリング機能

### **現在実装済み:**

```typescript
// フリーワード検索
searchProducts(query: string): Product[]
// 商品名・ブランド・施設名で横断検索

// 条件絞り込み
filterProducts(conditions: SearchConditions): Product[]
// 用途・予算・日持ち・個包装・温度帯・改札内外で絞り込み

// 地方別フィルタ
products.filter(p => p.region === "北海道")

// 施設別フィルタ
products.filter(p => 
  p.sellers.some(s => s.facilityId === "tokyo")
)
```

---

## 📋 チェックリスト：データ追加時の確認項目

- [ ] Product IDが重複していない（p001〜p098の次の番号を使用）
- [ ] 必須フィールドが全て埋まっている（id, name, brand, price等）
- [ ] 画像URLが有効か確認（Unsplashまたはアップロード画像）
- [ ] 売り場情報のfacilityIdがFACILITIES内に存在するか確認
- [ ] 座標（coords）が正確か確認
- [ ] 保証書の理由が3個以上あるか確認
- [ ] 用途タグが適切に設定されているか確認
- [ ] 予算カテゴリが正確か確認（1000/2000/3000/5000）
- [ ] 都道府県・地方情報が正確か確認
- [ ] TypeScriptコンパイルエラーがないか確認（`npx tsc --noEmit`）

---

## 🚀 次のステップ：バックエンド導入

現在98件のデータで運用していますが、**1000件超のお土産データを扱う場合は、バックエンド + データベースの導入をお勧めします。**

```bash
# webdev_add_feature で web-db-user にアップグレード
# これにより以下が利用可能になります：
# - PostgreSQL/MongoDB
# - Node.js/Express バックエンド
# - 管理画面（CRUD UI）
# - リアルタイム在庫管理
```

ご質問があればお気軽にお聞きください！
