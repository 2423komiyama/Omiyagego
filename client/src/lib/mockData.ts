// ============================================================
// Omiyage Go - モックデータ定義（拡充版）
// デザイン哲学: 駅ホーム案内板スタイル - 情報の読み取り速度最優先
// ============================================================

export type BadgeType = "editorial" | "local" | "corporate";
export type TemperatureType = "常温" | "冷蔵" | "冷凍";
export type GateStatus = "改札内" | "改札外";
export type FacilityId =
  | "tokyo"
  | "haneda_t1"
  | "haneda_t2"
  | "haneda_t3"
  | "shinagawa"
  | "shinjuku"
  | "shibuya"
  | "all";

export interface FacilityInfo {
  id: FacilityId;
  label: string;
  shortLabel: string;
  coords: { lat: number; lng: number };
}

export const FACILITIES: FacilityInfo[] = [
  {
    id: "all",
    label: "すべての施設",
    shortLabel: "すべて",
    coords: { lat: 35.6812, lng: 139.7671 },
  },
  {
    id: "tokyo",
    label: "東京駅",
    shortLabel: "東京駅",
    coords: { lat: 35.6812, lng: 139.7671 },
  },
  {
    id: "haneda_t1",
    label: "羽田空港 第1ターミナル",
    shortLabel: "羽田T1",
    coords: { lat: 35.5494, lng: 139.7798 },
  },
  {
    id: "haneda_t2",
    label: "羽田空港 第2ターミナル",
    shortLabel: "羽田T2",
    coords: { lat: 35.5494, lng: 139.7798 },
  },
  {
    id: "haneda_t3",
    label: "羽田空港 第3ターミナル（国際線）",
    shortLabel: "羽田T3",
    coords: { lat: 35.5494, lng: 139.7798 },
  },
  {
    id: "shinagawa",
    label: "品川駅",
    shortLabel: "品川駅",
    coords: { lat: 35.6284, lng: 139.7387 },
  },
  {
    id: "shinjuku",
    label: "新宿駅",
    shortLabel: "新宿駅",
    coords: { lat: 35.6896, lng: 139.7006 },
  },
  {
    id: "shibuya",
    label: "渋谷駅",
    shortLabel: "渋谷駅",
    coords: { lat: 35.6591, lng: 139.7030 },
  },
];

export interface Seller {
  id: string;
  facilityId: FacilityId;
  facilityName: string;
  shopName: string;
  gateStatus: GateStatus;
  floor: string;
  landmark: string;
  walkingMinutes: number;
  crowdLevel: "少" | "中" | "多";
  openHours: string;
  mapUrl: string;
  coords: { lat: number; lng: number };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  imageUrl: string;
  badges: BadgeType[];
  badgeLabels: string[];
  // 制約
  shelfLifeDays: number;
  individuallyWrapped: boolean;
  recommendedCount: number;
  temperature: TemperatureType;
  allergens: string[];
  // 保証書
  guaranteeReasons: string[];
  guaranteeOneLiner: string;
  // 文脈
  makerQuote: string;
  makerStory: string;
  makerName: string;
  // 贈り文テンプレ
  giftTemplates: {
    greeting: string;
    thanks: string;
    apology: string;
  };
  // 売り場
  sellers: Seller[];
  // 受取・配送
  canReserve: boolean;
  canPrePay: boolean;
  canDeliver: boolean;
  // 在庫状態
  stockStatus: "available" | "soldout_risk" | "unknown";
  // 用途タグ
  purposes: string[];
  // 予算カテゴリ
  budgetCategory: 1000 | 2000 | 3000 | 5000;
}

export const PRODUCTS: Product[] = [
  // ─── 商品1: 東京和菓子 彩り詰め合わせ ───────────────────────
  {
    id: "p001",
    name: "東京和菓子 彩り詰め合わせ",
    price: 2700,
    priceLabel: "¥2,700（税込）",
    imageUrl:
      "https://private-us-east-1.manuscdn.com/sessionFile/PzmyGBA8B4SwIi3RcwaikB/sandbox/hveQjdnUbdiIB1lgDKtpHG-img-2_1771832759000_na1fn_cHJvZHVjdC0x.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUHpteUdCQThCNFN3SWkzUmN3YWlrQi9zYW5kYm94L2h2ZVFqZG5VYmRpSUIxbGdES3RwSEctaW1nLTJfMTc3MTgzMjc1OTAwMF9uYTFmbl9jSEp2WkhWamRDMHguanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=VkT0n~M6IaFZ0Ry3squKEYcViYtDBrW6JdYzmoyjnH1Ouph2csHK447d5LBNx98OIwA7VgUP-JpWuECf5V1Q9f68UaawHQNtXpEE1fngNkSxiYT3RGYazTZtwOynbpFDmi4CllJ~fgLofsmISQK1SnItWDVUx1yI1c0Gr33o~cM3Vo5iYwOw6AI3iEJEb7EttepYK2qm1KHWtAWqxiX2EEvWFrfyfyJFc3Jukv~7SusHZBcva9no2pAXPYbopXzuKmI7PKNyEIHqoco2qJ0yGiusXFs~kwF3rc-mETWq~YYiSDf4qAF495u8e-FBc3MPjgInuaXdn~HIh6a2TfXQOQ__",
    badges: ["editorial"],
    badgeLabels: ["編集部推薦"],
    shelfLifeDays: 14,
    individuallyWrapped: true,
    recommendedCount: 20,
    temperature: "常温",
    allergens: ["小麦", "卵"],
    guaranteeReasons: [
      "全12種が個包装で配りやすい",
      "常温保存で日持ち14日以上",
      "東京駅改札内で購入可能",
      "20〜30名への配布に最適なボリューム",
      "老舗和菓子店の品質保証付き",
    ],
    guaranteeOneLiner: "個包装で配りやすく、改札内で受け取りやすい定番品",
    makerQuote:
      "「東京の四季を一箱に詰め込みました。どなたにも喜んでいただける味を追い求めています」",
    makerStory:
      "明治42年創業の老舗和菓子店。三代目店主が厳選した国産素材のみを使用し、職人が毎朝手作りしています。東京駅構内に出店して30年、出張帰りのビジネスパーソンに愛され続けています。",
    makerName: "東京和菓子本舗 三代目 田中 誠",
    giftTemplates: {
      greeting:
        "本日はお時間をいただきありがとうございます。ささやかですが、東京の品をお持ちしました。お口に合えば嬉しいです。",
      thanks:
        "先日はありがとうございました。東京で評判の和菓子とのことで、よろしければお召し上がりください。",
      apology:
        "このたびはご迷惑をおかけし申し訳ございません。お詫びの気持ちとして、東京の品をお納めください。",
    },
    sellers: [
      {
        id: "s001",
        facilityId: "tokyo",
        facilityName: "東京駅 八重洲地下街",
        shopName: "東京和菓子本舗 東京駅店",
        gateStatus: "改札内",
        floor: "B1F",
        landmark: "中央改札から徒歩8分・和菓子コーナー",
        walkingMinutes: 8,
        crowdLevel: "中",
        openHours: "8:00〜21:00",
        mapUrl: "https://maps.google.com/?q=東京駅八重洲地下街",
        coords: { lat: 35.6793, lng: 139.7698 },
      },
      {
        id: "s001b",
        facilityId: "shinagawa",
        facilityName: "品川駅 エキュート品川",
        shopName: "東京和菓子本舗 品川店",
        gateStatus: "改札内",
        floor: "1F",
        landmark: "中央改札内・北通路沿い",
        walkingMinutes: 3,
        crowdLevel: "少",
        openHours: "7:00〜22:00",
        mapUrl: "https://maps.google.com/?q=品川駅エキュート",
        coords: { lat: 35.6284, lng: 139.7387 },
      },
    ],
    canReserve: true,
    canPrePay: true,
    canDeliver: true,
    stockStatus: "available",
    purposes: ["挨拶", "御礼", "社内", "差し入れ"],
    budgetCategory: 3000,
  },

  // ─── 商品2: プレミアムバタークッキー ───────────────────────
  {
    id: "p002",
    name: "プレミアムバタークッキー詰め合わせ",
    price: 1800,
    priceLabel: "¥1,800（税込）",
    imageUrl:
      "https://private-us-east-1.manuscdn.com/sessionFile/PzmyGBA8B4SwIi3RcwaikB/sandbox/hveQjdnUbdiIB1lgDKtpHG-img-3_1771832776000_na1fn_cHJvZHVjdC0y.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUHpteUdCQThCNFN3SWkzUmN3YWlrQi9zYW5kYm94L2h2ZVFqZG5VYmRpSUIxbGdES3RwSEctaW1nLTNfMTc3MTgzMjc3NjAwMF9uYTFmbl9jSEp2WkhWamRDMHkuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=i8Q944gA-l9zcigApoSFEwqafTZyqwZUdaaIBRwPRNDXnPRhxti0xNnj8NXy~4p01CX6x02r0wf3QnxGBFtpQSqUpVtJxUlfUH6rcTDrdCQyaMk9vxJGrChVhmwHDik2OJKm1wayD7pU-hThcVloOb8i3V2jjl9btlshx6VI5tu4hu8xqvY682qbHa3lI-BdytSFsXuDnNcVWPdp7Mkw6U7f3O6CCwJeMVpC9URaOhTLXYIriw~SKUMzNtUjz40ZsnBgsbWnNhhSutC8X2U5C28w4UmYvrgIkRFSnwG4tjiBSWkXD-6ZG5g5dwy6kfRnTmqj0LygZZgeEIioCg7U9g__",
    badges: ["editorial", "corporate"],
    badgeLabels: ["編集部推薦", "法人向け安心"],
    shelfLifeDays: 30,
    individuallyWrapped: true,
    recommendedCount: 20,
    temperature: "常温",
    allergens: ["小麦", "乳", "卵"],
    guaranteeReasons: [
      "全20枚が個包装で配布しやすい",
      "常温保存で日持ち30日と余裕あり",
      "アレルギー表示が明確で安心",
      "法人贈答実績多数の定番品",
    ],
    guaranteeOneLiner: "日持ち30日・個包装で、ばらまき用途に最適",
    makerQuote:
      "「北海道産バターと国産小麦にこだわった、シンプルだけど飽きない味を目指しました」",
    makerStory:
      "北海道の牧場直送バターを使用した洋菓子専門店。創業15年、羽田空港と東京駅の両方に出店。ビジネス手土産として法人顧客からの支持が厚い。",
    makerName: "ラ・メゾン・ドゥース 代表 鈴木 花子",
    giftTemplates: {
      greeting:
        "本日はお時間をいただきありがとうございます。北海道バターのクッキーをお持ちしました。お口に合えば幸いです。",
      thanks:
        "先日はお世話になりありがとうございました。北海道産バターのクッキーです。よろしければどうぞ。",
      apology:
        "このたびはご迷惑をおかけし大変申し訳ございません。心ばかりですが、お詫びの品をお納めください。",
    },
    sellers: [
      {
        id: "s002",
        facilityId: "haneda_t1",
        facilityName: "羽田空港 第1ターミナル",
        shopName: "ラ・メゾン・ドゥース 羽田T1店",
        gateStatus: "改札内",
        floor: "2F",
        landmark: "保安検査場通過後・スイーツコーナー",
        walkingMinutes: 5,
        crowdLevel: "少",
        openHours: "6:00〜20:00",
        mapUrl: "https://maps.google.com/?q=羽田空港第1ターミナル",
        coords: { lat: 35.5494, lng: 139.7798 },
      },
      {
        id: "s003",
        facilityId: "tokyo",
        facilityName: "東京駅 グランスタ",
        shopName: "ラ・メゾン・ドゥース 東京駅店",
        gateStatus: "改札内",
        floor: "B1F",
        landmark: "丸の内地下中央口付近",
        walkingMinutes: 3,
        crowdLevel: "多",
        openHours: "8:00〜22:00",
        mapUrl: "https://maps.google.com/?q=東京駅グランスタ",
        coords: { lat: 35.6812, lng: 139.7671 },
      },
      {
        id: "s003b",
        facilityId: "haneda_t2",
        facilityName: "羽田空港 第2ターミナル",
        shopName: "ラ・メゾン・ドゥース 羽田T2店",
        gateStatus: "改札内",
        floor: "2F",
        landmark: "保安検査場通過後・北ウィング",
        walkingMinutes: 7,
        crowdLevel: "少",
        openHours: "6:00〜20:00",
        mapUrl: "https://maps.google.com/?q=羽田空港第2ターミナル",
        coords: { lat: 35.5494, lng: 139.7798 },
      },
    ],
    canReserve: true,
    canPrePay: false,
    canDeliver: true,
    stockStatus: "available",
    purposes: ["挨拶", "御礼", "社内", "差し入れ", "自分用"],
    budgetCategory: 2000,
  },

  // ─── 商品3: 東京人形焼 ───────────────────────────────────
  {
    id: "p003",
    name: "東京人形焼 30個入り",
    price: 2400,
    priceLabel: "¥2,400（税込）",
    imageUrl:
      "https://private-us-east-1.manuscdn.com/sessionFile/PzmyGBA8B4SwIi3RcwaikB/sandbox/hveQjdnUbdiIB1lgDKtpHG-img-4_1771832768000_na1fn_cHJvZHVjdC0z.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUHpteUdCQThCNFN3SWkzUmN3YWlrQi9zYW5kYm94L2h2ZVFqZG5VYmRpSUIxbGdES3RwSEctaW1nLTRfMTc3MTgzMjc2ODAwMF9uYTFmbl9jSEp2WkhWamRDMHouanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=kL26hfyv5VEB4nht1Vo0Q0v0n2B4QZcMcbkBXD39Sv-aTtChw~3Ok9G9R~tSrE4m9LL5Ro6ysybj-nE8Qg4q-00PVjHuFSEuzUzdLzIhGLgikOQi67FywjV8cc3rlTnXyoIt3c9q61Ijoo67UwVON527CObQe3VjcOheJaIWJOORAyZl7f3WicT1JB1cmBxiLz2swIVan56JJTd1ZJTjsy0erTaaQ9GeckW1D8zXDgp0ZdmPDH6WYTEuH7gANTZoczyAbB2F~4Xu32nNFoYfmRUrr6iVwxcPPJX2ZsTrLZ0xGZ2qIvxnPVy-FnYQdy1fL43rZcN7zZ86I-A9cGllCA__",
    badges: ["local"],
    badgeLabels: ["地元定番"],
    shelfLifeDays: 7,
    individuallyWrapped: true,
    recommendedCount: 30,
    temperature: "常温",
    allergens: ["小麦", "卵"],
    guaranteeReasons: [
      "30個入りで大人数への配布に対応",
      "全個包装でゴミが出にくい",
      "東京土産の定番として認知度が高い",
      "改札内で購入できる利便性",
    ],
    guaranteeOneLiner: "30人分の個包装、東京土産の定番で話題にもなりやすい",
    makerQuote:
      "「浅草で100年以上続く人形焼の伝統を、現代の忙しい方にも届けたい」",
    makerStory:
      "浅草の老舗人形焼店が東京駅に出店。明治時代から変わらぬ製法で作る人形焼は、東京土産の代名詞として親しまれています。",
    makerName: "浅草人形焼本舗 五代目 山田 太郎",
    giftTemplates: {
      greeting:
        "本日はお時間をいただきありがとうございます。浅草の人形焼をお持ちしました。皆様でどうぞ。",
      thanks:
        "先日はお世話になりありがとうございました。東京の定番、浅草人形焼です。よろしければ皆様でお召し上がりください。",
      apology:
        "このたびはご迷惑をおかけし申し訳ございません。東京の品ですが、お詫びの気持ちとしてお受け取りください。",
    },
    sellers: [
      {
        id: "s004",
        facilityId: "tokyo",
        facilityName: "東京駅 エキュート東京",
        shopName: "浅草人形焼本舗 東京駅店",
        gateStatus: "改札内",
        floor: "1F",
        landmark: "京葉線乗り換え通路沿い",
        walkingMinutes: 10,
        crowdLevel: "中",
        openHours: "7:00〜22:00",
        mapUrl: "https://maps.google.com/?q=東京駅エキュート",
        coords: { lat: 35.6793, lng: 139.7668 },
      },
      {
        id: "s004b",
        facilityId: "shinjuku",
        facilityName: "新宿駅 NEWoMan",
        shopName: "浅草人形焼本舗 新宿店",
        gateStatus: "改札外",
        floor: "2F",
        landmark: "新南口直結・フードコート",
        walkingMinutes: 2,
        crowdLevel: "中",
        openHours: "8:00〜22:00",
        mapUrl: "https://maps.google.com/?q=新宿NEWoMan",
        coords: { lat: 35.6896, lng: 139.7006 },
      },
    ],
    canReserve: false,
    canPrePay: false,
    canDeliver: false,
    stockStatus: "soldout_risk",
    purposes: ["挨拶", "差し入れ", "社内"],
    budgetCategory: 3000,
  },

  // ─── 商品4: 京都抹茶大福 ────────────────────────────────
  {
    id: "p004",
    name: "京都抹茶大福 詰め合わせ",
    price: 3200,
    priceLabel: "¥3,200（税込）",
    imageUrl:
      "https://private-us-east-1.manuscdn.com/sessionFile/PzmyGBA8B4SwIi3RcwaikB/sandbox/hveQjdnUbdiIB1lgDKtpHG-img-5_1771832763000_na1fn_cHJvZHVjdC00.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUHpteUdCQThCNFN3SWkzUmN3YWlrQi9zYW5kYm94L2h2ZVFqZG5VYmRpSUIxbGdES3RwSEctaW1nLTVfMTc3MTgzMjc2MzAwMF9uYTFmbl9jSEp2WkhWamRDMDAuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=WdVCQCVTbtq5-XK5rZFe89VKDJU5--fnng2blsUPostX4N4CR93Rbx0-8NlSha03tQ0-kdlPjKuby~uG1DT6P3du236ZQn6d9HXr3CvIdv2ueHVmzQIZpwfeKPNFjo2s~UhKxpWRSvNIRx59JkhknyA2kUe65qwNJWdi4K-VhFUK7MGrRzks9nVzKMHvsDcXpgSpy4jZtglci-jOikwR1X4aZTWIZ-xZc3wcYMb5~ULlCa3RFzQjEPM~hDynMs685UeuDNQGK~XlfIWZrSwYb5cKeVVD3QH4Bboy8xvwQ7RZGQmNrZI032jjq8YzDnSp4rfnleWYuFeLOCcU6eJrsQ__",
    badges: ["editorial", "local"],
    badgeLabels: ["編集部推薦", "地元定番"],
    shelfLifeDays: 3,
    individuallyWrapped: true,
    recommendedCount: 10,
    temperature: "冷蔵",
    allergens: ["小麦"],
    guaranteeReasons: [
      "宇治抹茶100%使用の本格派",
      "全個包装で手渡しやすい",
      "冷蔵保存で品質管理が明確",
      "少人数への特別感ある贈り物に最適",
    ],
    guaranteeOneLiner: "本格抹茶の香りと個包装で、少人数への特別な手土産に",
    makerQuote:
      "「京都宇治の茶畑から直接仕入れた抹茶だけを使います。妥協しない味をお届けします」",
    makerStory:
      "京都宇治に本店を構える和菓子店が東京に進出。宇治の茶農家と直接契約し、最高品質の抹茶のみを使用。東京駅での販売は数量限定のため、早めの購入をお勧めします。",
    makerName: "宇治抹茶菓子処 辻 和彦",
    giftTemplates: {
      greeting:
        "本日はお時間をいただきありがとうございます。京都宇治の抹茶大福をお持ちしました。冷蔵でお召し上がりください。",
      thanks:
        "先日はありがとうございました。京都の抹茶大福です。冷蔵でお召し上がりいただけると幸いです。",
      apology:
        "このたびはご迷惑をおかけし申し訳ございません。京都の品ですが、お詫びの気持ちとしてお受け取りください。",
    },
    sellers: [
      {
        id: "s005",
        facilityId: "tokyo",
        facilityName: "東京駅 グランスタ東京",
        shopName: "宇治抹茶菓子処 東京駅店",
        gateStatus: "改札内",
        floor: "B1F",
        landmark: "丸の内地下南口付近・和菓子エリア",
        walkingMinutes: 5,
        crowdLevel: "多",
        openHours: "8:00〜22:00",
        mapUrl: "https://maps.google.com/?q=東京駅グランスタ東京",
        coords: { lat: 35.6812, lng: 139.7671 },
      },
      {
        id: "s005b",
        facilityId: "haneda_t3",
        facilityName: "羽田空港 第3ターミナル（国際線）",
        shopName: "宇治抹茶菓子処 羽田国際線店",
        gateStatus: "改札内",
        floor: "4F",
        landmark: "出国審査後・ジャパンプロムナード",
        walkingMinutes: 8,
        crowdLevel: "少",
        openHours: "7:00〜21:00",
        mapUrl: "https://maps.google.com/?q=羽田空港第3ターミナル",
        coords: { lat: 35.5494, lng: 139.7798 },
      },
    ],
    canReserve: true,
    canPrePay: true,
    canDeliver: false,
    stockStatus: "available",
    purposes: ["挨拶", "御礼", "お詫び", "自分用"],
    budgetCategory: 5000,
  },

  // ─── 商品5: 銀座チョコレートアソート ─────────────────────
  {
    id: "p005",
    name: "銀座チョコレートアソート",
    price: 4500,
    priceLabel: "¥4,500（税込）",
    imageUrl:
      "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&q=80",
    badges: ["editorial", "corporate"],
    badgeLabels: ["編集部推薦", "法人向け安心"],
    shelfLifeDays: 60,
    individuallyWrapped: true,
    recommendedCount: 20,
    temperature: "常温",
    allergens: ["乳", "大豆"],
    guaranteeReasons: [
      "銀座老舗ショコラティエの品質保証",
      "常温60日保存で余裕を持って贈れる",
      "全個包装でエレガントな配布が可能",
      "法人贈答・お中元・お歳暮実績多数",
      "アレルギー表示が丁寧で安心",
    ],
    guaranteeOneLiner: "銀座の格と60日の日持ちで、法人贈答の定番品",
    makerQuote:
      "「ベルギー産カカオと日本の繊細な技術を融合させた、世界に誇れるチョコレートを作っています」",
    makerStory:
      "銀座に本店を構えるショコラティエが、東京駅限定ボックスを展開。ベルギー・フランス・日本の技術を融合させた独自製法で、国内外の食品コンテストで受賞歴多数。",
    makerName: "ショコラ銀座 オーナーシェフ 渡辺 美咲",
    giftTemplates: {
      greeting:
        "本日はお時間をいただきありがとうございます。銀座のチョコレートをお持ちしました。お口に合えば幸いです。",
      thanks:
        "先日はお世話になりありがとうございました。銀座のショコラティエのチョコレートです。ぜひお召し上がりください。",
      apology:
        "このたびはご迷惑をおかけし大変申し訳ございません。心ばかりですが、銀座の品をお納めください。",
    },
    sellers: [
      {
        id: "s006",
        facilityId: "tokyo",
        facilityName: "東京駅 グランスタ東京",
        shopName: "ショコラ銀座 東京駅店",
        gateStatus: "改札内",
        floor: "B1F",
        landmark: "丸の内地下中央口・スイーツゾーン",
        walkingMinutes: 4,
        crowdLevel: "中",
        openHours: "8:00〜22:00",
        mapUrl: "https://maps.google.com/?q=東京駅グランスタ東京",
        coords: { lat: 35.6812, lng: 139.7671 },
      },
      {
        id: "s007",
        facilityId: "shinagawa",
        facilityName: "品川駅 エキュート品川サウス",
        shopName: "ショコラ銀座 品川店",
        gateStatus: "改札内",
        floor: "1F",
        landmark: "南改札内・スイーツコーナー",
        walkingMinutes: 2,
        crowdLevel: "少",
        openHours: "7:00〜22:00",
        mapUrl: "https://maps.google.com/?q=品川駅エキュートサウス",
        coords: { lat: 35.6284, lng: 139.7387 },
      },
      {
        id: "s007b",
        facilityId: "haneda_t1",
        facilityName: "羽田空港 第1ターミナル",
        shopName: "ショコラ銀座 羽田T1店",
        gateStatus: "改札内",
        floor: "2F",
        landmark: "保安検査後・南ウィング",
        walkingMinutes: 6,
        crowdLevel: "少",
        openHours: "6:00〜21:00",
        mapUrl: "https://maps.google.com/?q=羽田空港第1ターミナル",
        coords: { lat: 35.5494, lng: 139.7798 },
      },
    ],
    canReserve: true,
    canPrePay: true,
    canDeliver: true,
    stockStatus: "available",
    purposes: ["挨拶", "御礼", "お詫び"],
    budgetCategory: 5000,
  },

  // ─── 商品6: 新宿限定 抹茶ロールケーキ ────────────────────
  {
    id: "p006",
    name: "新宿限定 抹茶ロールケーキ",
    price: 1500,
    priceLabel: "¥1,500（税込）",
    imageUrl:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80",
    badges: ["local"],
    badgeLabels: ["地元定番"],
    shelfLifeDays: 2,
    individuallyWrapped: false,
    recommendedCount: 5,
    temperature: "冷蔵",
    allergens: ["小麦", "乳", "卵"],
    guaranteeReasons: [
      "新宿駅直結で購入から手渡しまでが最短",
      "当日製造の新鮮なロールケーキ",
      "抹茶スイーツとして話題性が高い",
    ],
    guaranteeOneLiner: "新宿駅直結・当日製造で、少人数への特別な差し入れに",
    makerQuote:
      "「毎朝手作りするロールケーキ。新鮮さが一番の贈り物です」",
    makerStory:
      "新宿駅直結のNEWoManに出店する洋菓子店。毎朝仕込む生地と地元産の抹茶を使ったロールケーキが人気。",
    makerName: "パティスリー新宿 オーナー 中村 優子",
    giftTemplates: {
      greeting:
        "本日はお時間をいただきありがとうございます。新宿の抹茶ロールケーキをお持ちしました。当日中にお召し上がりください。",
      thanks:
        "先日はありがとうございました。新宿の人気スイーツです。冷蔵でお召し上がりください。",
      apology:
        "このたびはご迷惑をおかけし申し訳ございません。心ばかりですが、お詫びの品をお受け取りください。",
    },
    sellers: [
      {
        id: "s008",
        facilityId: "shinjuku",
        facilityName: "新宿駅 NEWoMan",
        shopName: "パティスリー新宿 NEWoMan店",
        gateStatus: "改札外",
        floor: "2F",
        landmark: "新南口直結・スイーツフロア",
        walkingMinutes: 2,
        crowdLevel: "中",
        openHours: "8:00〜22:00",
        mapUrl: "https://maps.google.com/?q=新宿NEWoMan",
        coords: { lat: 35.6896, lng: 139.7006 },
      },
    ],
    canReserve: false,
    canPrePay: false,
    canDeliver: false,
    stockStatus: "available",
    purposes: ["差し入れ", "自分用", "御礼"],
    budgetCategory: 2000,
  },

  // ─── 商品7: 渋谷 フルーツゼリー ──────────────────────────
  {
    id: "p007",
    name: "渋谷 フルーツゼリー詰め合わせ",
    price: 2200,
    priceLabel: "¥2,200（税込）",
    imageUrl:
      "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&q=80",
    badges: ["editorial"],
    badgeLabels: ["編集部推薦"],
    shelfLifeDays: 14,
    individuallyWrapped: true,
    recommendedCount: 10,
    temperature: "常温",
    allergens: [],
    guaranteeReasons: [
      "アレルギー対応（主要7品目不使用）",
      "全個包装で配りやすい",
      "常温14日保存で持ち運びしやすい",
      "鮮やかな見た目で喜ばれやすい",
    ],
    guaranteeOneLiner: "アレルギー対応・個包装で、幅広い方への手土産に",
    makerQuote:
      "「アレルギーのある方にも安心して食べていただけるゼリーを作りたかった」",
    makerStory:
      "渋谷ヒカリエに出店するフルーツゼリー専門店。国産フルーツのみを使用し、アレルギー対応に徹底的にこだわっています。",
    makerName: "フルーツゼリー工房 渡辺 健一",
    giftTemplates: {
      greeting:
        "本日はお時間をいただきありがとうございます。渋谷のフルーツゼリーをお持ちしました。お口に合えば幸いです。",
      thanks:
        "先日はありがとうございました。渋谷で人気のフルーツゼリーです。よろしければどうぞ。",
      apology:
        "このたびはご迷惑をおかけし申し訳ございません。心ばかりですが、お詫びの品をお受け取りください。",
    },
    sellers: [
      {
        id: "s009",
        facilityId: "shibuya",
        facilityName: "渋谷駅 渋谷ヒカリエ",
        shopName: "フルーツゼリー工房 ヒカリエ店",
        gateStatus: "改札外",
        floor: "3F",
        landmark: "渋谷ヒカリエ ShinQs 3F",
        walkingMinutes: 5,
        crowdLevel: "中",
        openHours: "10:00〜21:00",
        mapUrl: "https://maps.google.com/?q=渋谷ヒカリエ",
        coords: { lat: 35.6591, lng: 139.7030 },
      },
    ],
    canReserve: true,
    canPrePay: false,
    canDeliver: true,
    stockStatus: "available",
    purposes: ["挨拶", "御礼", "差し入れ", "社内"],
    budgetCategory: 3000,
  },
];

// ── 選択肢データ ──────────────────────────────────────────────

export const PURPOSE_LIST = [
  { id: "挨拶", label: "挨拶", icon: "🤝", description: "初対面・訪問時" },
  { id: "御礼", label: "御礼", icon: "🙏", description: "お礼・感謝" },
  { id: "お詫び", label: "お詫び", icon: "💐", description: "謝罪・お詫び" },
  { id: "社内", label: "社内", icon: "🏢", description: "社内配布" },
  { id: "差し入れ", label: "差し入れ", icon: "☕", description: "差し入れ・おやつ" },
  { id: "自分用", label: "自分用", icon: "🎁", description: "自分へのご褒美" },
];

export const BUDGET_OPTIONS = [
  { value: 1000, label: "〜1,000円" },
  { value: 2000, label: "〜2,000円" },
  { value: 3000, label: "〜3,000円" },
  { value: 5000, label: "〜5,000円" },
];

export const SHELF_LIFE_OPTIONS = [
  { value: 0, label: "当日" },
  { value: 3, label: "3日" },
  { value: 7, label: "7日" },
  { value: 14, label: "14日以上" },
];

export const COUNT_OPTIONS = [
  { value: 5, label: "5人" },
  { value: 10, label: "10人" },
  { value: 20, label: "20人" },
  { value: 30, label: "30人" },
];

export const TEMPERATURE_OPTIONS: TemperatureType[] = ["常温", "冷蔵", "冷凍"];

export interface SearchConditions {
  purpose: string;
  budget: number | null;
  shelfLife: number | null;
  individuallyWrapped: boolean | null;
  count: number | null;
  temperature: TemperatureType | null;
  facilityId: FacilityId | null;
}

// 施設フィルタ: 商品が指定施設で購入できるかチェック
function hasSellerAtFacility(product: Product, facilityId: FacilityId): boolean {
  if (facilityId === "all") return true;
  return product.sellers.some((s) => s.facilityId === facilityId);
}

export function filterProducts(conditions: SearchConditions): Product[] {
  return PRODUCTS.filter((p) => {
    // 用途フィルタ
    if (conditions.purpose && !p.purposes.includes(conditions.purpose)) {
      return false;
    }
    // 予算フィルタ
    if (conditions.budget !== null && p.price > conditions.budget) {
      return false;
    }
    // 日持ちフィルタ
    if (conditions.shelfLife !== null && p.shelfLifeDays < conditions.shelfLife) {
      return false;
    }
    // 個包装フィルタ
    if (conditions.individuallyWrapped === true && !p.individuallyWrapped) {
      return false;
    }
    // 人数フィルタ
    if (conditions.count !== null && p.recommendedCount < conditions.count) {
      return false;
    }
    // 温度帯フィルタ
    if (conditions.temperature !== null && p.temperature !== conditions.temperature) {
      return false;
    }
    // 施設フィルタ
    if (conditions.facilityId && conditions.facilityId !== "all") {
      if (!hasSellerAtFacility(p, conditions.facilityId)) {
        return false;
      }
    }
    return true;
  });
}
