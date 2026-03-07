import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, tinyint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================
// Omiyage Go - お土産管理テーブル
// ============================================================

/**
 * 施設（駅・空港）マスタテーブル
 */
export const facilities = mysqlTable("facilities", {
  id: varchar("id", { length: 32 }).primaryKey(), // e.g., "tokyo-station", "haneda-t1"
  name: varchar("name", { length: 128 }).notNull(), // e.g., "東京駅"
  shortLabel: varchar("shortLabel", { length: 32 }).notNull(), // e.g., "東京駅"
  region: varchar("region", { length: 32 }).notNull(), // e.g., "関東"
  prefecture: varchar("prefecture", { length: 16 }).notNull(), // e.g., "東京都"
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  insideGate: boolean("insideGate").default(false).notNull(), // 改札内フラグ
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = typeof facilities.$inferInsert;

/**
 * 商品マスタテーブル
 */
export const products = mysqlTable("products", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 256 }).notNull(), // 商品名
  brand: varchar("brand", { length: 128 }).notNull(), // ブランド名
  description: text("description"), // 商品説明
  price: int("price").notNull(), // 価格（円）
  imageUrl: text("imageUrl"), // 商品画像URL
  prefecture: varchar("prefecture", { length: 16 }).notNull(), // 産地都道府県
  region: varchar("region", { length: 32 }).notNull(), // 地方（北海道、関東など）
  category: varchar("category", { length: 64 }).notNull(), // カテゴリ（スイーツ、和菓子など）
  shelfLife: int("shelfLife"), // 日持ち（日数）
  isIndividualPackaged: boolean("isIndividualPackaged").default(false).notNull(), // 個包装フラグ
  servingSize: int("servingSize"), // 内容量（個数）
  guaranteeReason: text("guaranteeReason"), // 保証理由（JSON配列として保存）
  makerStory: text("makerStory"), // 作り手ストーリー
  brandUrl: text("brandUrl"), // メーカー公式サイトURL
  badges: varchar("badges", { length: 256 }), // バッジ（JSON配列：editorial, bestseller等）
  // ── 新規追加フィールド ──
  purposeTags: text("purposeTags"), // 用途タグ（JSON配列: ["greeting","thanks","apology","family","lover","friend","self","kids","souvenir"]）
  minPeople: int("minPeople"), // 人数目安（最小）
  maxPeople: int("maxPeople"), // 人数目安（最大）
  editorialPick: boolean("editorialPick").default(false).notNull(), // 編集部推薦フラグ
  editorialNote: text("editorialNote"), // 編集部推薦理由（短文）
  externalLinks: text("externalLinks"), // 外部リンク（JSON配列: [{url, type, title, priority}]）
  likeCount: int("likeCount").default(0).notNull(), // いいね数（非正規化カウンタ）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"), // 作成者ID
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * 売り場情報テーブル（商品と施設の関連付け）
 */
export const sellers = mysqlTable("sellers", {
  id: varchar("id", { length: 32 }).primaryKey(),
  productId: varchar("productId", { length: 32 }).notNull(),
  facilityId: varchar("facilityId", { length: 32 }).notNull(),
  storeName: varchar("storeName", { length: 128 }).notNull(), // 店舗名
  floor: varchar("floor", { length: 32 }), // 階層情報
  location: varchar("location", { length: 256 }), // 位置情報（詳細）
  insideGate: boolean("insideGate").default(false).notNull(), // 改札内フラグ
  businessHours: varchar("businessHours", { length: 256 }), // 営業時間
  congestionLevel: mysqlEnum("congestionLevel", ["low", "medium", "high"]).default("medium"), // 混雑度
  stockStatus: mysqlEnum("stockStatus", ["in_stock", "low_stock", "out_of_stock"]).default("in_stock"), // 在庫状況
  // ── 新規追加フィールド ──
  mapUrl: text("mapUrl"), // Google Maps URL等
  walkMinutes: int("walkMinutes"), // 改札/出口からの徒歩分数
  topProductIds: text("topProductIds"), // 人気商品TOP3（JSON配列: ["id1","id2","id3"]）
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Seller = typeof sellers.$inferSelect;
export type InsertSeller = typeof sellers.$inferInsert;

/**
 * 贈り文テンプレートテーブル
 */
export const giftMessages = mysqlTable("giftMessages", {
  id: varchar("id", { length: 32 }).primaryKey(),
  productId: varchar("productId", { length: 32 }).notNull(),
  title: varchar("title", { length: 128 }).notNull(), // テンプレートタイトル
  message: text("message").notNull(), // メッセージ本文
  occasion: varchar("occasion", { length: 64 }).notNull(), // 用途（お礼、お詫び等）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GiftMessage = typeof giftMessages.$inferSelect;
export type InsertGiftMessage = typeof giftMessages.$inferInsert;

/**
 * 取り置き予約テーブル
 */
export const reservations = mysqlTable("reservations", {
  id: varchar("id", { length: 32 }).primaryKey(),
  productId: varchar("productId", { length: 32 }).notNull(),
  facilityId: varchar("facilityId", { length: 32 }).notNull(),
  recipientName: varchar("recipientName", { length: 128 }).notNull(), // 受取者名
  quantity: int("quantity").notNull(), // 個数
  pickupDate: timestamp("pickupDate").notNull(), // 受取日時
  reservationNumber: varchar("reservationNumber", { length: 32 }).notNull().unique(), // 受付番号
  status: mysqlEnum("status", ["pending", "confirmed", "picked_up", "cancelled"]).default("pending"), // ステータス
  notes: text("notes"), // 備考
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = typeof reservations.$inferInsert;

// ============================================================
// 新規テーブル（SEO流入最大化・UGC対応）
// ============================================================

/**
 * いいねテーブル（Step1 UGC）
 * 匿名ユーザーはsessionIdで識別、ログイン済みはuserIdで管理
 */
export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  productId: varchar("productId", { length: 32 }).notNull(),
  userId: int("userId"), // ログイン済みユーザーのID（nullable）
  sessionId: varchar("sessionId", { length: 128 }), // 匿名ユーザーのセッションID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

/**
 * 口コミテーブル（Step2 UGC、今回はテーブルのみ作成）
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  productId: varchar("productId", { length: 32 }).notNull(),
  userId: int("userId"), // 投稿者ID（nullable: 匿名可）
  authorName: varchar("authorName", { length: 64 }), // 表示名（匿名の場合は"匿名ユーザー"等）
  rating: tinyint("rating").notNull(), // 評価 1-5
  purposeTag: varchar("purposeTag", { length: 64 }), // 用途タグ（どんな場面で使ったか）
  body: text("body").notNull(), // 口コミ本文
  isAnonymous: boolean("isAnonymous").default(false).notNull(), // 匿名フラグ
  isVisible: boolean("isVisible").default(true).notNull(), // 表示フラグ（通報で非表示化）
  reportCount: int("reportCount").default(0).notNull(), // 通報数
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * 特集カードテーブル（トップページカルーセル用）
 * 運用で差し替え可能
 */
export const features = mysqlTable("features", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 128 }).notNull(), // 特集タイトル
  subtitle: varchar("subtitle", { length: 256 }), // サブタイトル
  imageUrl: text("imageUrl"), // バナー画像URL
  linkUrl: varchar("linkUrl", { length: 512 }).notNull(), // 遷移先URL（内部/外部）
  linkType: mysqlEnum("linkType", ["station", "purpose", "region", "article", "external"]).default("article"), // リンク種別
  badgeText: varchar("badgeText", { length: 32 }), // バッジテキスト（例：「季節限定」「編集部推薦」）
  sortOrder: int("sortOrder").default(0).notNull(), // 表示順（小さいほど先頭）
  isActive: boolean("isActive").default(true).notNull(), // 表示フラグ
  startsAt: timestamp("startsAt"), // 表示開始日時（null=即時）
  endsAt: timestamp("endsAt"), // 表示終了日時（null=無期限）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Feature = typeof features.$inferSelect;
export type InsertFeature = typeof features.$inferInsert;
