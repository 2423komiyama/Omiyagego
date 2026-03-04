import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

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