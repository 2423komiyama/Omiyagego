# Geminiへのデータ収集・登録プロンプト（最終版）

## 目的
Omiyage Go（お土産検索アプリ）のPostgreSQLデータベースに、日本全国の主要駅・空港・観光地の土産物データを収集・登録する。

---

## 前提情報

### データベーススキーマ

**1. facilities テーブル（施設マスタ）**
```
- id: 施設ID（例：tokyo-station, hakone-town）
- name: 施設名（例：東京駅）
- shortLabel: 短縮名（例：東京駅）
- region: 地方（北海道、東北、関東、中部、近畿、中国、四国、九州・沖縄）
- prefecture: 都道府県（例：東京都）
- latitude: 緯度（小数点以下8桁）
- longitude: 経度（小数点以下8桁）
- insideGate: 改札内フラグ（true/false）
```

**2. products テーブル（商品マスタ）**
```
- id: 商品ID（UUID形式）
- name: 商品名（例：東京駅弁「かつ重」）
- brand: ブランド名（例：駅弁屋 匠）
- description: 商品説明（テキスト）
- price: 価格（円、整数）
- imageUrl: 商品画像URL
- prefecture: 産地都道府県（例：東京都）
- region: 地方（北海道、東北、関東など）
- category: カテゴリ（スイーツ、和菓子、弁当、チョコレート、バター、チーズなど）
- shelfLife: 日持ち（日数、整数）
- isIndividualPackaged: 個包装フラグ（true/false）
- servingSize: 内容量（個数、整数）
- guaranteeReason: 保証理由（JSON配列として保存）
- makerStory: 作り手ストーリー（テキスト）
- badges: バッジ（JSON配列：editorial, bestseller, local など）
```

**3. sellers テーブル（売り場情報）**
```
- id: 売り場ID（UUID形式）
- productId: 商品ID（products.idへの外部キー）
- facilityId: 施設ID（facilities.idへの外部キー）
- storeName: 店舗名（例：駅弁屋 匠）
- floor: 階層情報（例：B1F, 1F など）
- location: 位置情報詳細（例：改札口A近く）
- insideGate: 改札内フラグ（true/false）
- businessHours: 営業時間（例：7:00-21:00）
- congestionLevel: 混雑度（low, medium, high）
- stockStatus: 在庫状況（in_stock, low_stock, out_of_stock）
```

---

## データ収集タスク

### 対象施設・観光地（50施設以上）

以下の主要駅・空港・観光地でのお土産データを収集してください：

---

## 関東エリア（20施設）

### 東京都
1. 東京駅
2. 羽田空港 第1ターミナル
3. 羽田空港 第2ターミナル
4. 羽田空港 第3ターミナル（国際線）
5. 品川駅
6. 新宿駅
7. 渋谷駅

### 神奈川県
8. 小田原駅・小田原城周辺
9. 小田原周辺（箱根への玄関口、小田原かまぼこ、梅干しなど）
10. 熱海駅・熱海温泉
11. 熱海周辺（海の幸、温泉関連商品）
12. 伊豆エリア（伊豆高原、伊豆下田など）
13. 伊豆周辺（わさび、金目鯛、温泉饅頭など）
14. 箱根（箱根駅伝で有名な温泉地）
15. 箱根周辺（湯の花、温泉卵、寄木細工など）
16. 江の島（湘南の観光地）
17. 江の島周辺（海産物、貝類製品）
18. 鎌倉（古都、寺院が多い）
19. 鎌倉周辺（鎌倉彫、伝統菓子）
20. 横浜（みなとみらい、中華街）

---

## 北海道エリア（10施設）

### 札幌
21. 札幌駅
22. 新千歳空港
23. 札幌市内（大通公園、すすきのなど）

### 小樽
24. 小樽駅
25. 小樽周辺（運河エリア、歴史的建造物）
26. 小樽港周辺（海産物、ガラス工芸品）

### 函館
27. 函館駅
28. 函館空港
29. 函館周辺（五稜郭、夜景スポット）
30. 函館港周辺（海の幸、イカ製品）

---

## 東北エリア（10施設）

### 仙台
31. 仙台駅
32. 仙台空港
33. 仙台市内（青葉城周辺）
34. 仙台周辺（牛タン、笹かまぼこ）

### その他東北
35. 青森県（りんご、せんべい）
36. 岩手県（わんこそば、南部鉄器）
37. 秋田県（きりたんぽ、稲庭うどん）
38. 山形県（さくらんぼ、芋煮）
39. 福島県（会津塗、喜多方ラーメン）
40. 宮城県内陸部（温泉地、地酒）

---

## 関西エリア（10施設）

41. 京都駅
42. 京都市内（清水寺周辺、祇園など）
43. 伏見稲荷大社（京都）
44. 大阪駅・新大阪駅
45. 大阪城周辺
46. 神戸市内（元町、南京町など）
47. 奈良駅（近鉄奈良駅・JR奈良駅）
48. 奈良周辺（奈良公園、大仏周辺）

---

## 中部・北陸エリア（8施設）

49. 名古屋駅・中部国際空港
50. 金沢駅
51. 金沢周辺（兼六園、21世紀美術館）
52. 草津温泉（群馬県、日本有数の温泉地）
53. 長野駅・松本駅
54. 静岡駅・浜松駅
55. 新潟県（越後湯沢温泉、佐渡島）
56. 富山県（黒部峡谷、立山黒部）

---

## 中国・四国・九州エリア（12施設）

### 中国
57. 広島駅・広島空港
58. 宮島（厳島神社）

### 四国
59. 高松駅・高松空港
60. 高知駅
61. 徳島県（阿波踊り、藍製品）
62. 香川県（讃岐うどん）

### 九州
63. 博多駅・福岡空港
64. 福岡市内（天神・中州エリア）
65. 那覇空港・国際通り
66. 由布院温泉（大分県）
67. 別府温泉（大分県）
68. 黒川温泉（熊本県）
69. 長崎県（長崎駅、ハウステンボス周辺）
70. 鹿児島県（桜島周辺、焼酎蔵）

---

## データ収集要件

### 各施設ごとに以下を収集：

1. **施設情報（facilities テーブル用）**
   - 施設名、短縮名
   - 正確な緯度経度（Google Maps APIで確認）
   - 地方分類
   - 改札内フラグ

2. **商品情報（products テーブル用）**
   - 各施設・観光地で販売されている代表的なお土産 **最低3〜5品**
   - 商品名、ブランド名、価格
   - 産地情報（都道府県・地方）
   - カテゴリ分類
   - 日持ち日数
   - 個包装の有無
   - 作り手ストーリー（簡潔に）
   - バッジ（editorial=編集部推奨, bestseller=人気商品, local=地元産）
   
   **観光地での特別な配慮：**
   
   **温泉地（箱根、熱海、伊豆、草津、由布院、別府、黒川）**
   - 湯の花、温泉卵、温泉饅頭、温泉化粧品
   - 地元の名物（わさび、金目鯛など）
   - 温泉関連の工芸品
   
   **古都（京都、鎌倉、奈良）**
   - 伝統工芸品（清水焼、鎌倉彫、奈良漆器など）
   - 和菓子、抹茶スイーツ
   - 寺院関連商品
   
   **ビーチリゾート（江の島、伊豆下田）**
   - 海産物、貝類製品
   - 海鮮加工品、干物
   - 海塩関連商品
   
   **城跡（大阪城、広島城、金沢城）**
   - 地元の歴史関連商品
   - 城下町の伝統工芸品
   - 地元の銘菓
   
   **港町（小樽、函館、長崎）**
   - 海産物、イカ製品
   - ガラス工芸品（小樽）
   - 異国情緒あふれる商品
   
   **地方都市（仙台、福岡）**
   - 地元の名物（牛タン、博多ラーメン、明太子）
   - 地酒、焼酎
   - 地元の工芸品

3. **売り場情報（sellers テーブル用）**
   - 店舗名
   - 階層情報（B1F, 1F など）
   - 位置情報（例：改札口A近く）
   - 営業時間
   - 混雑度（low/medium/high）
   - 在庫状況（推定）

---

## データ品質ガイドライン

1. **正確性**
   - 実在する施設・商品のみを記載
   - 不確実な情報は含めない
   - 緯度経度は小数点以下8桁の精度

2. **多様性**
   - 各施設で異なるカテゴリの商品を選定
   - 価格帯を混在させる（500円～10,000円程度）
   - 地元産と全国ブランドを混在させる
   - 各地域の特色を反映した商品選定

3. **形式**
   - すべての日付はISO 8601形式
   - 価格はすべて円（整数）
   - JSON配列は有効なJSON形式

---

## 出力形式

### JSON形式でデータを提供してください：

```json
{
  "facilities": [
    {
      "id": "tokyo-station",
      "name": "東京駅",
      "shortLabel": "東京駅",
      "region": "関東",
      "prefecture": "東京都",
      "latitude": 35.68120000,
      "longitude": 139.76710000,
      "insideGate": true
    },
    {
      "id": "odawara-station",
      "name": "小田原駅",
      "shortLabel": "小田原",
      "region": "関東",
      "prefecture": "神奈川県",
      "latitude": 35.26590000,
      "longitude": 139.15370000,
      "insideGate": true
    },
    {
      "id": "otaru-station",
      "name": "小樽駅",
      "shortLabel": "小樽",
      "region": "北海道",
      "prefecture": "北海道",
      "latitude": 43.19140000,
      "longitude": 140.99640000,
      "insideGate": true
    },
    {
      "id": "hakodate-station",
      "name": "函館駅",
      "shortLabel": "函館",
      "region": "北海道",
      "prefecture": "北海道",
      "latitude": 41.80360000,
      "longitude": 140.72640000,
      "insideGate": true
    },
    {
      "id": "sendai-station",
      "name": "仙台駅",
      "shortLabel": "仙台",
      "region": "東北",
      "prefecture": "宮城県",
      "latitude": 38.26060000,
      "longitude": 140.87220000,
      "insideGate": true
    }
  ],
  "products": [
    {
      "id": "prod-odawara-001",
      "name": "小田原かまぼこ「白梅」",
      "brand": "小田原かまぼこ協会",
      "description": "小田原の伝統的なかまぼこ。白身魚を使用した上品な味わい。",
      "price": 1500,
      "imageUrl": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=600&q=80",
      "prefecture": "神奈川県",
      "region": "関東",
      "category": "海産物",
      "shelfLife": 7,
      "isIndividualPackaged": true,
      "servingSize": 1,
      "guaranteeReason": ["新鮮", "伝統製法"],
      "makerStory": "小田原の伝統工芸品。江戸時代から続くかまぼこ製造技法。",
      "badges": ["editorial", "local"]
    },
    {
      "id": "prod-odawara-002",
      "name": "小田原梅干し「南高梅」",
      "brand": "小田原梅干し本舗",
      "description": "小田原産の南高梅を使用した梅干し。塩辛さと酸味のバランスが絶妙。",
      "price": 2000,
      "imageUrl": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=600&q=80",
      "prefecture": "神奈川県",
      "region": "関東",
      "category": "漬物",
      "shelfLife": 365,
      "isIndividualPackaged": true,
      "servingSize": 1,
      "guaranteeReason": ["天然素材", "塩漬け"],
      "makerStory": "小田原産の南高梅を塩漬けにした伝統的な梅干し。",
      "badges": ["local"]
    },
    {
      "id": "prod-atami-001",
      "name": "熱海温泉 湯の花",
      "brand": "熱海温泉協会",
      "description": "熱海温泉の湯の花。肌に優しい成分。",
      "price": 2500,
      "imageUrl": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=600&q=80",
      "prefecture": "静岡県",
      "region": "関東",
      "category": "温泉関連",
      "shelfLife": 365,
      "isIndividualPackaged": true,
      "servingSize": 10,
      "guaranteeReason": ["天然成分", "肌に優しい"],
      "makerStory": "熱海温泉の湯から採取した天然の湯の花。肌に優しい成分。",
      "badges": ["editorial", "local"]
    },
    {
      "id": "prod-izu-001",
      "name": "伊豆わさび「本わさび」",
      "brand": "伊豆わさび農園",
      "description": "伊豆産の本わさび。清流で育った最高品質のわさび。",
      "price": 3500,
      "imageUrl": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=600&q=80",
      "prefecture": "静岡県",
      "region": "関東",
      "category": "調味料",
      "shelfLife": 30,
      "isIndividualPackaged": true,
      "servingSize": 1,
      "guaranteeReason": ["本わさび", "清流育成"],
      "makerStory": "伊豆の清流で育った本わさび。最高品質の香りと辛味。",
      "badges": ["editorial", "local"]
    },
    {
      "id": "prod-izu-002",
      "name": "伊豆金目鯛の干物",
      "brand": "伊豆漁協",
      "description": "伊豆沖で獲れた金目鯛を塩漬けにして干した干物。",
      "price": 2800,
      "imageUrl": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=600&q=80",
      "prefecture": "静岡県",
      "region": "関東",
      "category": "海産物",
      "shelfLife": 14,
      "isIndividualPackaged": true,
      "servingSize": 1,
      "guaranteeReason": ["新鮮", "天然素材"],
      "makerStory": "伊豆沖の金目鯛を使用した干物。塩漬けにして天日干し。",
      "badges": ["local", "bestseller"]
    },
    {
      "id": "prod-otaru-001",
      "name": "小樽ガラス工芸品「花瓶」",
      "brand": "小樽ガラス工房",
      "description": "小樽の伝統工芸品。手吹きガラスの花瓶。",
      "price": 5000,
      "imageUrl": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=600&q=80",
      "prefecture": "北海道",
      "region": "北海道",
      "category": "工芸品",
      "shelfLife": 3650,
      "isIndividualPackaged": true,
      "servingSize": 1,
      "guaranteeReason": ["手作り", "伝統工芸"],
      "makerStory": "小樽の伝統工芸「ガラス工芸品」。手吹きで作られた花瓶。",
      "badges": ["editorial", "local"]
    },
    {
      "id": "prod-otaru-002",
      "name": "小樽海産物詰め合わせ",
      "brand": "小樽漁協",
      "description": "小樽沖で獲れた海産物の詰め合わせ。ホタテ、ウニ、昆布など。",
      "price": 4500,
      "imageUrl": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=600&q=80",
      "prefecture": "北海道",
      "region": "北海道",
      "category": "海産物",
      "shelfLife": 30,
      "isIndividualPackaged": true,
      "servingSize": 1,
      "guaranteeReason": ["新鮮", "天然素材"],
      "makerStory": "小樽沖の海産物を詰め合わせ。北海道の味覚を堪能できる。",
      "badges": ["editorial", "local"]
    },
    {
      "id": "prod-hakodate-001",
      "name": "函館イカ製品詰め合わせ",
      "brand": "函館漁協",
      "description": "函館沖で獲れたイカを使用した製品詰め合わせ。イカの塩辛、イカ墨ラーメンなど。",
      "price": 3500,
      "imageUrl": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=600&q=80",
      "prefecture": "北海道",
      "region": "北海道",
      "category": "海産物",
      "shelfLife": 14,
      "isIndividualPackaged": true,
      "servingSize": 1,
      "guaranteeReason": ["新鮮", "天然素材"],
      "makerStory": "函館沖のイカを使用した製品詰め合わせ。函館の味覚を代表。",
      "badges": ["bestseller", "local"]
    },
    {
      "id": "prod-hakodate-002",
      "name": "函館夜景チョコレート",
      "brand": "函館製菓",
      "description": "函館の夜景をモチーフにしたチョコレート。函館土産の定番。",
      "price": 1500,
      "imageUrl": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80",
      "prefecture": "北海道",
      "region": "北海道",
      "category": "スイーツ",
      "shelfLife": 14,
      "isIndividualPackaged": true,
      "servingSize": 8,
      "guaranteeReason": ["個包装", "常温保存可能"],
      "makerStory": "函館の夜景をモチーフにしたチョコレート。函館土産の定番。",
      "badges": ["editorial", "local"]
    },
    {
      "id": "prod-sendai-001",
      "name": "仙台牛タン",
      "brand": "仙台牛タン本舗",
      "description": "仙台の名物、牛タン。塩漬けにして燻製にした製品。",
      "price": 3000,
      "imageUrl": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=600&q=80",
      "prefecture": "宮城県",
      "region": "東北",
      "category": "肉製品",
      "shelfLife": 14,
      "isIndividualPackaged": true,
      "servingSize": 1,
      "guaranteeReason": ["新鮮", "燻製"],
      "makerStory": "仙台の名物、牛タン。塩漬けにして燻製にした製品。",
      "badges": ["bestseller", "local"]
    },
    {
      "id": "prod-sendai-002",
      "name": "仙台笹かまぼこ",
      "brand": "仙台笹かまぼこ協会",
      "description": "仙台の伝統的なかまぼこ。笹の葉で巻いた上品な味わい。",
      "price": 1200,
      "imageUrl": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=600&q=80",
      "prefecture": "宮城県",
      "region": "東北",
      "category": "海産物",
      "shelfLife": 7,
      "isIndividualPackaged": true,
      "servingSize": 1,
      "guaranteeReason": ["新鮮", "伝統製法"],
      "makerStory": "仙台の伝統工芸品。笹の葉で巻いたかまぼこ。",
      "badges": ["editorial", "local"]
    }
  ],
  "sellers": [
    {
      "id": "seller-odawara-001",
      "productId": "prod-odawara-001",
      "facilityId": "odawara-station",
      "storeName": "小田原かまぼこ協会直営店",
      "floor": "B1F",
      "location": "改札口A近く",
      "insideGate": true,
      "businessHours": "8:00-20:00",
      "congestionLevel": "medium",
      "stockStatus": "in_stock"
    },
    {
      "id": "seller-otaru-001",
      "productId": "prod-otaru-001",
      "facilityId": "otaru-station",
      "storeName": "小樽ガラス工房",
      "floor": "1F",
      "location": "駅前通り",
      "insideGate": false,
      "businessHours": "9:00-18:00",
      "congestionLevel": "low",
      "stockStatus": "in_stock"
    },
    {
      "id": "seller-hakodate-001",
      "productId": "prod-hakodate-001",
      "facilityId": "hakodate-station",
      "storeName": "函館漁協直営店",
      "floor": "B1F",
      "location": "改札口近く",
      "insideGate": true,
      "businessHours": "8:00-19:00",
      "congestionLevel": "medium",
      "stockStatus": "in_stock"
    },
    {
      "id": "seller-sendai-001",
      "productId": "prod-sendai-001",
      "facilityId": "sendai-station",
      "storeName": "仙台牛タン本舗",
      "floor": "B1F",
      "location": "改札口A近く",
      "insideGate": true,
      "businessHours": "7:00-21:00",
      "congestionLevel": "high",
      "stockStatus": "in_stock"
    }
  ]
}
```

---

## 追加指示

1. **画像URL**
   - Unsplash、Pixabayなどの無料画像サイトから適切な画像URLを選定
   - または、実際の商品画像が利用可能なURLを使用

2. **バッジの使い分け**
   - `editorial`: 編集部推奨・特に有名な商品
   - `bestseller`: 売上が多い・人気商品
   - `local`: 地元産・地域限定商品

3. **カテゴリ例**
   - 弁当、スイーツ、和菓子、チョコレート、バター、チーズ、せんべい、漬物、飲料
   - 温泉関連：湯の花、温泉卵、温泉まんじゅう、温泉化粧品
   - 工芸品：陶磁器、漆器、織物、ガラス工芸品、寄木細工
   - 海産物：海苔、昆布、干物、かまぼこ、イカ製品
   - 地酒：日本酒、焼酎、地元クラフト酒
   - 地元野菜・果物：みかん、りんご、栗、さくらんぼ
   - 肉製品：牛タン、ハム、ソーセージ
   - 調味料：わさび、味噌、醤油

4. **日持ち日数**
   - 弁当：1日
   - 和菓子：3〜7日
   - スイーツ：5〜14日
   - 漬物・佃煮：30日以上
   - 温泉卵：3〜5日
   - 湯の花：常温保存で1年以上
   - 地酒：常温保存で3年以上
   - 工芸品：常温保存で数年以上
   - 海産物：冷蔵保存で1〜3日、冷凍で30日以上
   - 地元野菜・果物：常温保存で1〜2週間
   - 肉製品：冷蔵保存で7〜14日
   - 調味料：常温保存で1年以上

---

## 実行方法

このプロンプトをGeminiに入力し、以下のステップで実行してください：

1. **データ収集フェーズ**
   - 各施設の正確な情報を調査
   - 代表的なお土産商品を特定
   - 各地域の特色を反映した商品選定

2. **データ構造化フェーズ**
   - 上記JSON形式でデータを構造化
   - すべてのフィールドが正確に入力されているか確認

3. **品質チェックフェーズ**
   - すべてのフィールドが必須項目を満たしているか確認
   - 緯度経度の精度確認
   - JSON形式の妥当性確認
   - 各地域の特色が反映されているか確認

4. **出力**
   - 完成したJSONを提供

---

## 注意事項

- 不確実な情報は推測で埋めない
- 実在しない商品・施設は含めない
- 著作権に注意してURLを選定
- 価格情報は2024年時点の参考価格
- 各地域の特色を最大限に反映した商品選定を心がけること
- 温泉地、港町、古都、城下町など、各施設の特性に応じた商品を選定すること

---

## 期待される出力規模

- **施設数**: 50施設以上
- **商品数**: 150〜200商品（各施設ごとに3〜5品）
- **売り場数**: 150〜200売り場（各商品ごとに1〜2売り場）
- **合計JSON行数**: 5,000行以上

---

## 補足

このデータセットは、Omiyage Goアプリケーションの初期データとして使用されます。ユーザーが以下の機能を使用できるようになります：

- 現在地から最寄りのお土産を検索
- 用途（ビジネス、友人へのギフト、家族へのギフト）に応じた検索
- 予算に応じた検索
- 日持ちに応じた検索
- 地域別の検索
- 施設別の検索

データの正確性と多様性が、ユーザー体験の質に直結するため、慎重かつ詳細なデータ収集をお願いします。
