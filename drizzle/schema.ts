import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, tinyint, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // プロフィールフィールド（会員登録フォームで入力）
  nickname: varchar("nickname", { length: 64 }),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  homePrefecture: varchar("homePrefecture", { length: 16 }),
  isProfileComplete: boolean("isProfileComplete").default(false).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================
// Omiyage Go - お土産管理テーブル
// ============================================================

export const facilities = mysqlTable("facilities", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  shortLabel: varchar("shortLabel", { length: 32 }).notNull(),
  region: varchar("region", { length: 32 }).notNull(),
  prefecture: varchar("prefecture", { length: 16 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  insideGate: boolean("insideGate").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = typeof facilities.$inferInsert;

export const products = mysqlTable("products", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  brand: varchar("brand", { length: 128 }).notNull(),
  description: text("description"),
  price: int("price").notNull(),
  imageUrl: text("imageUrl"),
  prefecture: varchar("prefecture", { length: 16 }).notNull(),
  region: varchar("region", { length: 32 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  shelfLife: int("shelfLife"),
  isIndividualPackaged: boolean("isIndividualPackaged").default(false).notNull(),
  servingSize: int("servingSize"),
  guaranteeReason: text("guaranteeReason"),
  makerStory: text("makerStory"),
  brandUrl: text("brandUrl"),
  badges: varchar("badges", { length: 256 }),
  purposeTags: text("purposeTags"),
  minPeople: int("minPeople"),
  maxPeople: int("maxPeople"),
  editorialPick: boolean("editorialPick").default(false).notNull(),
  editorialNote: text("editorialNote"),
  externalLinks: text("externalLinks"), // 外部リンク（JSON配列: [{url, type, title, priority}]）
  likeCount: int("likeCount").default(0).notNull(),
  reviewCount: int("reviewCount").default(0).notNull(), // 口コミ数（非正規化カウンタ）
  avgRating: decimal("avgRating", { precision: 3, scale: 2 }), // 平均評価（非正規化）
  // 商品ページ充実化フィールド
  realImageUrl: text("realImageUrl"), // 実際の商品画像URL（公式・楽天等から取得）
  imageSource: varchar("imageSource", { length: 256 }), // 画像の出典元
  reasonsToChoose: text("reasonsToChoose"), // このお土産が選ばれる理由（JSON配列: [{title, body}]）
  guaranteeDetail: text("guaranteeDetail"), // 保証書詳細（受賞歴・メディア掲載等のJSON配列）
  makerName: varchar("makerName", { length: 128 }), // メーカー正式名称
  makerFoundedYear: int("makerFoundedYear"), // 創業年
  makerAddress: varchar("makerAddress", { length: 256 }), // メーカー所在地
  makerPhone: varchar("makerPhone", { length: 32 }), // メーカー電話番号
  productSpecs: text("productSpecs"), // 商品スペック（JSON: {weight, size, ingredients, allergens, storage, calories}）
  buzzTopics: text("buzzTopics"), // この商品の話題（JSON配列: [{source, title, url, date}]）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export const sellers = mysqlTable("sellers", {
  id: varchar("id", { length: 32 }).primaryKey(),
  productId: varchar("productId", { length: 32 }).notNull(),
  facilityId: varchar("facilityId", { length: 32 }).notNull(),
  storeName: varchar("storeName", { length: 128 }).notNull(),
  floor: varchar("floor", { length: 32 }),
  location: varchar("location", { length: 256 }),
  insideGate: boolean("insideGate").default(false).notNull(),
  businessHours: varchar("businessHours", { length: 256 }),
  congestionLevel: mysqlEnum("congestionLevel", ["low", "medium", "high"]).default("medium"),
  stockStatus: mysqlEnum("stockStatus", ["in_stock", "low_stock", "out_of_stock"]).default("in_stock"),
  mapUrl: text("mapUrl"),
  walkMinutes: int("walkMinutes"),
  topProductIds: text("topProductIds"),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Seller = typeof sellers.$inferSelect;
export type InsertSeller = typeof sellers.$inferInsert;

export const giftMessages = mysqlTable("giftMessages", {
  id: varchar("id", { length: 32 }).primaryKey(),
  productId: varchar("productId", { length: 32 }).notNull(),
  title: varchar("title", { length: 128 }).notNull(),
  message: text("message").notNull(),
  occasion: varchar("occasion", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GiftMessage = typeof giftMessages.$inferSelect;
export type InsertGiftMessage = typeof giftMessages.$inferInsert;

export const reservations = mysqlTable("reservations", {
  id: varchar("id", { length: 32 }).primaryKey(),
  productId: varchar("productId", { length: 32 }).notNull(),
  facilityId: varchar("facilityId", { length: 32 }).notNull(),
  recipientName: varchar("recipientName", { length: 128 }).notNull(),
  quantity: int("quantity").notNull(),
  pickupDate: timestamp("pickupDate").notNull(),
  reservationNumber: varchar("reservationNumber", { length: 32 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "confirmed", "picked_up", "cancelled"]).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = typeof reservations.$inferInsert;

// ============================================================
// UGC・エンゲージメントテーブル
// ============================================================

/**
 * いいねテーブル
 * ログイン済みユーザーはuserIdで管理、匿名はsessionIdで識別
 */
export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  productId: varchar("productId", { length: 32 }).notNull(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

/**
 * 口コミテーブル
 * ログイン必須。評価・本文・用途タグを保存
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  productId: varchar("productId", { length: 32 }).notNull(),
  userId: int("userId").notNull(), // ログイン必須
  authorName: varchar("authorName", { length: 64 }),
  rating: tinyint("rating").notNull(), // 1-5
  purposeTag: varchar("purposeTag", { length: 64 }),
  body: text("body").notNull(),
  isAnonymous: boolean("isAnonymous").default(false).notNull(),
  isVisible: boolean("isVisible").default(true).notNull(),
  reportCount: int("reportCount").default(0).notNull(),
  likeCount: int("likeCount").default(0).notNull(), // 口コミへのいいね数
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * キュレーションリンクテーブル
 * 商品ごとのSNS投稿・YouTube・記事リンクを管理
 * 管理者が登録・削除、ユーザーは閲覧のみ
 */
export const curatedLinks = mysqlTable("curatedLinks", {
  id: int("id").autoincrement().primaryKey(),
  productId: varchar("productId", { length: 32 }).notNull(),
  type: mysqlEnum("type", ["youtube", "instagram", "twitter", "tiktok", "article", "news", "other"]).notNull(),
  url: text("url").notNull(),
  title: varchar("title", { length: 256 }),
  thumbnailUrl: text("thumbnailUrl"),
  description: text("description"),
  authorName: varchar("authorName", { length: 128 }), // 投稿者名・メディア名
  publishedAt: timestamp("publishedAt"), // 元コンテンツの公開日
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  addedBy: int("addedBy").notNull(), // 登録した管理者のuserId
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CuratedLink = typeof curatedLinks.$inferSelect;
export type InsertCuratedLink = typeof curatedLinks.$inferInsert;

// ============================================================
// ポイント・バッジ・特典テーブル
// ============================================================

/**
 * ユーザーポイント残高テーブル
 * 将来のクーポン・マイレージ交換に備えた拡張性のある設計
 */
export const userPoints = mysqlTable("userPoints", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // 1ユーザー1レコード
  totalPoints: int("totalPoints").default(0).notNull(), // 累計獲得ポイント
  availablePoints: int("availablePoints").default(0).notNull(), // 利用可能ポイント（交換・失効後の残高）
  usedPoints: int("usedPoints").default(0).notNull(), // 使用済みポイント
  expiredPoints: int("expiredPoints").default(0).notNull(), // 失効ポイント
  tier: mysqlEnum("tier", ["bronze", "silver", "gold", "platinum"]).default("bronze").notNull(), // 会員ランク
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPoints = typeof userPoints.$inferSelect;
export type InsertUserPoints = typeof userPoints.$inferInsert;

/**
 * ポイント取引履歴テーブル
 * 獲得・使用・失効・交換の全履歴を記録
 * 将来の外部ポイント交換・クーポン発行に対応
 */
export const pointTransactions = mysqlTable("pointTransactions", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "earn_review",        // 口コミ投稿
    "earn_like",          // いいね
    "earn_login",         // ログインボーナス
    "earn_bonus",         // ボーナス（マイルストーン達成等）
    "earn_admin",         // 管理者付与
    "use_coupon",         // クーポン利用
    "use_exchange",       // 外部ポイント交換
    "expire",             // 失効
  ]).notNull(),
  points: int("points").notNull(), // 正=獲得、負=使用/失効
  balanceAfter: int("balanceAfter").notNull(), // 取引後の利用可能残高
  referenceType: varchar("referenceType", { length: 32 }), // 参照エンティティ種別（"product","review","coupon"等）
  referenceId: varchar("referenceId", { length: 64 }), // 参照エンティティID
  description: varchar("description", { length: 256 }), // 取引説明（ユーザー表示用）
  expiresAt: timestamp("expiresAt"), // ポイント有効期限（null=無期限）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PointTransaction = typeof pointTransactions.$inferSelect;
export type InsertPointTransaction = typeof pointTransactions.$inferInsert;

/**
 * ユーザーバッジテーブル
 * 活動実績に応じて付与されるバッジを管理
 */
export const userBadges = mysqlTable("userBadges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeType: mysqlEnum("badgeType", [
    "first_review",       // 初めての口コミ
    "review_5",           // 口コミ5件達成
    "review_20",          // 口コミ20件達成
    "like_10",            // いいね10件達成
    "like_50",            // いいね50件達成
    "first_login",        // 初回ログイン
    "login_10",           // ログイン10回達成
    "explorer",           // 5施設の商品を閲覧
    "gourmet",            // 評価5をつけた口コミ3件
  ]).notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
  // 将来の特典付与に備えたフィールド
  rewardClaimed: boolean("rewardClaimed").default(false).notNull(), // 特典受取済みフラグ
  rewardClaimedAt: timestamp("rewardClaimedAt"),
});

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

// ============================================================
// 特集カードテーブル（トップページカルーセル用）
// ============================================================

export const features = mysqlTable("features", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 128 }).notNull(),
  subtitle: varchar("subtitle", { length: 256 }),
  imageUrl: text("imageUrl"),
  linkUrl: varchar("linkUrl", { length: 512 }).notNull(),
  linkType: mysqlEnum("linkType", ["station", "purpose", "region", "article", "external"]).default("article"),
  badgeText: varchar("badgeText", { length: 32 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Feature = typeof features.$inferSelect;
export type InsertFeature = typeof features.$inferInsert;

// ============================================================
// お土産コレクター機能（桃鉄風スタンプラリー）
// ============================================================

/**
 * お土産コレクションテーブル
 * ユーザーが買ったお土産を写真から登録する
 */
export const collections = mysqlTable("collections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: varchar("productId", { length: 32 }).notNull(),
  photoUrl: text("photoUrl"),           // S3に保存した写真 URL
  ocrText: text("ocrText"),             // OCRで抽出したテキスト
  matchScore: decimal("matchScore", { precision: 5, scale: 2 }), // マッチングスコア(0-100)
  prefecture: varchar("prefecture", { length: 16 }).notNull(), // 最得都道府縣（スタンプ用）
  region: varchar("region", { length: 32 }).notNull(),         // 最得エリア（ボーナス用）
  pointsEarned: int("pointsEarned").default(0).notNull(),      // この登録で獲得したポイント
  status: mysqlEnum("status", [
    "pending",    // OCR処理中
    "matched",    // 商品特定成功
    "unmatched",  // 商品特定失敗
    "manual",     // 手動登録
  ]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Collection = typeof collections.$inferSelect;
export type InsertCollection = typeof collections.$inferInsert;

/**
 * コレクターランクテーブル
 * ユーザーのスタンプラリー達成状況を管理
 */
export const collectorStats = mysqlTable("collectorStats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalCollected: int("totalCollected").default(0).notNull(),     // 登録商品数
  prefecturesCount: int("prefecturesCount").default(0).notNull(), // 制霸都道府縣数
  regionsCount: int("regionsCount").default(0).notNull(),         // 制霸エリア数
  collectorRank: mysqlEnum("collectorRank", [
    "traveler",       // 旅人: 1-9都道府縣
    "seasoned",       // 旅慣れ: 10-19都道府縣
    "master",         // 旅人達人: 20-34都道府縣
    "legend",         // 全国制霸: 35+都道府縣
  ]).default("traveler").notNull(),
  stampedPrefectures: text("stampedPrefectures"),  // JSON配列: ["東京都", "北海道", ...]
  stampedRegions: text("stampedRegions"),          // JSON配列: ["関東", "北海道", ...]
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CollectorStats = typeof collectorStats.$inferSelect;
export type InsertCollectorStats = typeof collectorStats.$inferInsert;

// ============================================================
// プッシュ通知・お気に入り機能
// ============================================================

/**
 * Web Push購読情報テーブル
 * ユーザーのブラウザごとのWeb Push購読情報を保存
 */
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // ログイン済みの場合はユーザーID、匿名はセッションIDで管理
  sessionId: varchar("sessionId", { length: 128 }), // 匿名ユーザー用
  endpoint: text("endpoint").notNull(), // PushサービスのURL
  p256dh: text("p256dh").notNull(), // 暗号化鍵
  auth: text("auth").notNull(), // 認証秘密鍵
  userAgent: varchar("userAgent", { length: 256 }), // ブラウザ情報
  isActive: boolean("isActive").default(true).notNull(),
  // 通知設定
  notifyNearby: boolean("notifyNearby").default(true).notNull(), // 近くの売り場通知
  notifyTrending: boolean("notifyTrending").default(true).notNull(), // エリアトレンド通知
  lastNotifiedAt: timestamp("lastNotifiedAt"), // 最後の通知日時
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * お気に入りテーブル
 * ログイン済みユーザーのお気に入り商品を管理（まだない場合は作成）
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: varchar("productId", { length: 32 }).notNull(),
  // 近接通知設定
  notifyNearby: boolean("notifyNearby").default(true).notNull(), // 近くの売り場に近づいたら通知
  lastNearbyNotifiedAt: timestamp("lastNearbyNotifiedAt"), // 最後に近接通知を送った日時
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * エリア別トレンドテーブル
 * 施設・都道府県別の注目商品データをキャッシュ
 */
export const areaTrends = mysqlTable("areaTrends", {
  id: int("id").autoincrement().primaryKey(),
  facilityId: varchar("facilityId", { length: 32 }), // 施設別トレンド（null=都道府県別）
  prefecture: varchar("prefecture", { length: 16 }), // 都道府県別トレンド
  topProductIds: text("topProductIds").notNull(), // JSON配列: ["商品ID1", ...]
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(), // 最後計算日時
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AreaTrend = typeof areaTrends.$inferSelect;
export type InsertAreaTrend = typeof areaTrends.$inferInsert;
