import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, sellers, facilities, giftMessages, reservations, likes, reviews, features, curatedLinks, userPoints, userBadges, pointTransactions, collections, collectorStats } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================
// Omiyage Go - Query Helpers
// ============================================================

/**
 * 全商品を取得
 */
export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products);
}

/**
 * 商品IDで商品を取得
 */
export async function getProductById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * 施設IDで売り場情報を取得
 */
export async function getSellersByFacilityId(facilityId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(sellers).where(eq(sellers.facilityId, facilityId));
}

/**
 * 売り場IDで売り場情報を取得
 */
export async function getSellerById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(sellers).where(eq(sellers.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * 商品IDで売り場情報を取得
 */
export async function getSellersByProductId(productId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(sellers).where(eq(sellers.productId, productId));
}

/**
 * 全施設を取得
 */
export async function getAllFacilities() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(facilities);
}

/**
 * 施設IDで施設情報を取得
 */
export async function getFacilityById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(facilities).where(eq(facilities.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * 商品IDで贈り文テンプレートを取得
 */
export async function getGiftMessagesByProductId(productId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(giftMessages).where(eq(giftMessages.productId, productId));
}

/**
 * 全予約を取得
 */
export async function getAllReservations() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(reservations);
}

/**
 * 予約IDで予約を取得
 */
export async function getReservationById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ============================================================
// Product CRUD Operations
// ============================================================

/**
 * Create a new product
 */
export async function createProduct(data: {
  id?: string;
  name: string;
  brand: string;
  price: number;
  prefecture: string;
  region: string;
  description?: string;
  shelfLife?: number;
  imageUrl?: string;
  category?: string;
  isIndividualPackaged?: boolean;
  servingSize?: number;
  guaranteeReason?: string | string[];
  makerStory?: string;
  badges?: string | string[];
  createdBy?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Generate ID if not provided
  const id = data.id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Convert arrays to JSON strings
  const guaranteeReasonStr = typeof data.guaranteeReason === 'string' 
    ? data.guaranteeReason 
    : JSON.stringify(data.guaranteeReason || []);
  const badgesStr = typeof data.badges === 'string' 
    ? data.badges 
    : JSON.stringify(data.badges || []);
  
  await db.insert(products).values({
    id,
    name: data.name,
    brand: data.brand,
    price: data.price,
    prefecture: data.prefecture,
    region: data.region,
    description: data.description || null,
    shelfLife: data.shelfLife || null,
    imageUrl: data.imageUrl || null,
    category: data.category || "その他",
    isIndividualPackaged: data.isIndividualPackaged || false,
    servingSize: data.servingSize || null,
    guaranteeReason: guaranteeReasonStr,
    makerStory: data.makerStory || null,
    badges: badgesStr,
    createdBy: data.createdBy,
  });
  
  return id;
}

/**
 * Update an existing product
 */
export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    brand: string;
    price: number;
    prefecture: string;
    region: string;
    description: string;
    shelfLife: number;
    imageUrl: string;
    category: string;
    isIndividualPackaged: boolean;
    servingSize: number;
    guaranteeReason: string;
    makerStory: string;
    badges: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(products).set(data).where(eq(products.id, id));
}

/**
 * Delete a product and related data
 */
export async function deleteProduct(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete related seller information
  await db.delete(sellers).where(eq(sellers.productId, id));
  // Delete related gift messages
  await db.delete(giftMessages).where(eq(giftMessages.productId, id));
  // Delete the product
  await db.delete(products).where(eq(products.id, id));
}

// ============================================================
// Product Search & Filter Operations
// ============================================================

import { like, and, or, gte, lte, inArray, sql, desc, asc, isNotNull } from "drizzle-orm";

/**
 * 商品を検索・フィルタリングして取得（強化版）
 */
export async function searchProducts(params: {
  query?: string;
  prefecture?: string;
  region?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  badges?: string[];
  // 新規フィルター
  purposeTag?: string;
  minShelfLife?: number;
  isIndividualPackaged?: boolean;
  minPeople?: number;
  maxPeople?: number;
  facilityId?: string;
  sortBy?: 'popular' | 'editorial' | 'shelf_life_desc' | 'price_asc' | 'newest';
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { products: [], total: 0 };

  const conditions = [];

  if (params.query) {
    conditions.push(
      or(
        like(products.name, `%${params.query}%`),
        like(products.brand, `%${params.query}%`),
        like(products.description, `%${params.query}%`),
        like(products.prefecture, `%${params.query}%`),
        like(products.category, `%${params.query}%`)
      )
    );
  }

  if (params.prefecture) {
    conditions.push(eq(products.prefecture, params.prefecture));
  }

  if (params.region) {
    conditions.push(eq(products.region, params.region));
  }

  if (params.category) {
    conditions.push(eq(products.category, params.category));
  }

  if (params.minPrice !== undefined) {
    conditions.push(gte(products.price, params.minPrice));
  }

  if (params.maxPrice !== undefined) {
    conditions.push(lte(products.price, params.maxPrice));
  }

  // 日持ちフィルター
  if (params.minShelfLife !== undefined) {
    conditions.push(gte(products.shelfLife, params.minShelfLife));
  }

  // 個包装フィルター
  if (params.isIndividualPackaged === true) {
    conditions.push(eq(products.isIndividualPackaged, true));
  }

  // 用途タグフィルター（JSON配列の中に含まれるかチェック）
  if (params.purposeTag) {
    conditions.push(
      or(
        like(products.purposeTags, `%"${params.purposeTag}"%`),
        like(products.badges, `%${params.purposeTag}%`)
      )
    );
  }

  // badgesフィルター（editorialなど）
  if (params.badges && params.badges.length > 0) {
    const badgeConditions = params.badges.map(badge =>
      like(products.badges, `%${badge}%`)
    );
    conditions.push(or(...badgeConditions));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const limit = params.limit || 20;
  const offset = params.offset || 0;

  // ソート順
  let orderBy;
  switch (params.sortBy) {
    case 'popular':
      orderBy = desc(products.likeCount);
      break;
    case 'editorial':
      orderBy = desc(products.editorialPick);
      break;
    case 'shelf_life_desc':
      orderBy = desc(products.shelfLife);
      break;
    case 'price_asc':
      orderBy = asc(products.price);
      break;
    case 'newest':
      orderBy = desc(products.createdAt);
      break;
    default:
      orderBy = desc(products.likeCount);
  }

  const [rows, countRows] = await Promise.all([
    whereClause
      ? db.select().from(products).where(whereClause).orderBy(orderBy).limit(limit).offset(offset)
      : db.select().from(products).orderBy(orderBy).limit(limit).offset(offset),
    whereClause
      ? db.select({ count: sql<number>`COUNT(*)` }).from(products).where(whereClause)
      : db.select({ count: sql<number>`COUNT(*)` }).from(products),
  ]);

  return {
    products: rows,
    total: Number(countRows[0]?.count || 0),
  };
}

/**
 * 都道府県一覧を取得（商品が存在するもの）
 */
export async function getAvailablePrefectures() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .selectDistinct({ prefecture: products.prefecture })
    .from(products)
    .orderBy(products.prefecture);
  return rows.map(r => r.prefecture);
}

/**
 * カテゴリ一覧を取得（商品が存在するもの）
 */
export async function getAvailableCategories() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .selectDistinct({ category: products.category })
    .from(products)
    .orderBy(products.category);
  return rows.map(r => r.category);
}

/**
 * 地方一覧を取得（商品が存在するもの）
 */
export async function getAvailableRegions() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .selectDistinct({ region: products.region })
    .from(products)
    .orderBy(products.region);
  return rows.map(r => r.region);
}

// ============================================================
// Likes (いいね) Operations
// ============================================================

/**
 * いいねを追加（重複チェック付き）
 * sessionIdまたはuserIdで1商品1いいね制限
 */
export async function addLike(productId: string, sessionId?: string, userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 重複チェック
  const existing = await db.select().from(likes).where(
    and(
      eq(likes.productId, productId),
      userId ? eq(likes.userId, userId) : eq(likes.sessionId, sessionId || '')
    )
  ).limit(1);

  if (existing.length > 0) {
    return { alreadyLiked: true };
  }

  await db.insert(likes).values({
    productId,
    userId: userId || null,
    sessionId: sessionId || null,
  });

  // likeCountを更新
  await db.execute(
    sql`UPDATE products SET likeCount = likeCount + 1 WHERE id = ${productId}`
  );

  return { alreadyLiked: false };
}

/**
 * いいねを削除
 */
export async function removeLike(productId: string, sessionId?: string, userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(likes).where(
    and(
      eq(likes.productId, productId),
      userId ? eq(likes.userId, userId) : eq(likes.sessionId, sessionId || '')
    )
  ).limit(1);

  if (existing.length === 0) {
    return { wasLiked: false };
  }

  await db.delete(likes).where(eq(likes.id, existing[0].id));

  // likeCountを更新
  await db.execute(
    sql`UPDATE products SET likeCount = GREATEST(likeCount - 1, 0) WHERE id = ${productId}`
  );

  return { wasLiked: true };
}

/**
 * セッションまたはユーザーのいいね済み商品IDリストを取得
 */
export async function getLikedProductIds(sessionId?: string, userId?: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select({ productId: likes.productId }).from(likes).where(
    userId ? eq(likes.userId, userId) : eq(likes.sessionId, sessionId || '')
  );

  return rows.map(r => r.productId);
}

// ============================================================
// Features (特集カード) Operations
// ============================================================

/**
 * アクティブな特集カードを取得（カルーセル用）
 */
export async function getActiveFeatures() {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const rows = await db.select().from(features).where(
    and(
      eq(features.isActive, true),
      or(
        sql`${features.startsAt} IS NULL`,
        lte(features.startsAt, now)
      ),
      or(
        sql`${features.endsAt} IS NULL`,
        gte(features.endsAt, now)
      )
    )
  ).orderBy(asc(features.sortOrder)).limit(10);

  return rows;
}

// ============================================================
// Facility-based product search (SEO入口ページ用)
// ============================================================

/**
 * 施設IDに紐づく商品を取得（SEO入口ページ用）
 */
export async function getProductsByFacilityId(facilityId: string, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return { products: [], total: 0 };

  // sellersテーブルを経由して商品を取得
  const sellerRows = await db.select({ productId: sellers.productId })
    .from(sellers)
    .where(eq(sellers.facilityId, facilityId));

  const productIds = Array.from(new Set(sellerRows.map(s => s.productId)));

  if (productIds.length === 0) {
    return { products: [], total: 0 };
  }

  const [rows, countRows] = await Promise.all([
    db.select().from(products)
      .where(inArray(products.id, productIds))
      .orderBy(desc(products.likeCount))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`COUNT(*)` }).from(products)
      .where(inArray(products.id, productIds)),
  ]);

  return {
    products: rows,
    total: Number(countRows[0]?.count || 0),
  };
}

// ============================================================
// Reviews (口コミ) Operations
// ============================================================

/**
 * 商品の口コミ一覧を取得（ユーザー情報付き）
 */
export async function getReviewsByProductId(productId: string, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return { reviews: [], total: 0 };

  const [rows, countRows] = await Promise.all([
    db.select({
      id: reviews.id,
      productId: reviews.productId,
      userId: reviews.userId,
      authorName: reviews.authorName,
      rating: reviews.rating,
      purposeTag: reviews.purposeTag,
      body: reviews.body,
      isAnonymous: reviews.isAnonymous,
      likeCount: reviews.likeCount,
      createdAt: reviews.createdAt,
      userName: users.name,
    })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(and(eq(reviews.productId, productId), eq(reviews.isVisible, true)))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`COUNT(*)` })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.isVisible, true))),
  ]);

  return {
    reviews: rows,
    total: Number(countRows[0]?.count || 0),
  };
}

/**
 * 口コミを投稿（ポイント付与トリガー付き）
 */
export async function createReview(data: {
  productId: string;
  userId: number;
  rating: number;
  body: string;
  purposeTag?: string;
  isAnonymous?: boolean;
  authorName?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 同一ユーザーの既存口コミをチェック（1商品1口コミ制限）
  const existing = await db.select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.productId, data.productId), eq(reviews.userId, data.userId)))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("既にこの商品に口コミを投稿済みです");
  }

  const [result] = await db.insert(reviews).values({
    productId: data.productId,
    userId: data.userId,
    rating: data.rating,
    body: data.body,
    purposeTag: data.purposeTag || null,
    isAnonymous: data.isAnonymous || false,
    authorName: data.authorName || null,
  });

  // reviewCount・avgRatingを更新
  await db.execute(
    sql`UPDATE products SET
      reviewCount = reviewCount + 1,
      avgRating = (SELECT AVG(rating) FROM reviews WHERE productId = ${data.productId} AND isVisible = 1)
    WHERE id = ${data.productId}`
  );

  return { id: (result as any).insertId };
}

/**
 * ユーザーの口コミ数を取得
 */
export async function getUserReviewCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`COUNT(*)` })
    .from(reviews)
    .where(eq(reviews.userId, userId));
  return Number(rows[0]?.count || 0);
}

// ============================================================
// CuratedLinks (キュレーションリンク) Operations
// ============================================================

/**
 * 商品のキュレーションリンク一覧を取得
 */
export async function getCuratedLinksByProductId(productId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(curatedLinks)
    .where(and(eq(curatedLinks.productId, productId), eq(curatedLinks.isActive, true)))
    .orderBy(asc(curatedLinks.sortOrder), desc(curatedLinks.createdAt));
}

/**
 * キュレーションリンクを追加（管理者のみ）
 */
export async function addCuratedLink(data: {
  productId: string;
  type: "youtube" | "instagram" | "twitter" | "tiktok" | "article" | "news" | "other";
  url: string;
  title?: string;
  thumbnailUrl?: string;
  description?: string;
  authorName?: string;
  publishedAt?: Date;
  sortOrder?: number;
  addedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(curatedLinks).values({
    productId: data.productId,
    type: data.type,
    url: data.url,
    title: data.title || null,
    thumbnailUrl: data.thumbnailUrl || null,
    description: data.description || null,
    authorName: data.authorName || null,
    publishedAt: data.publishedAt || null,
    sortOrder: data.sortOrder || 0,
    addedBy: data.addedBy,
  });

  return { id: (result as any).insertId };
}

/**
 * キュレーションリンクを削除（管理者のみ）
 */
export async function deleteCuratedLink(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(curatedLinks).where(eq(curatedLinks.id, id));
}

/**
 * 全商品のキュレーションリンク一覧（管理者用）
 */
export async function getAllCuratedLinks(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return { links: [], total: 0 };

  const [rows, countRows] = await Promise.all([
    db.select({
      id: curatedLinks.id,
      productId: curatedLinks.productId,
      type: curatedLinks.type,
      url: curatedLinks.url,
      title: curatedLinks.title,
      thumbnailUrl: curatedLinks.thumbnailUrl,
      authorName: curatedLinks.authorName,
      isActive: curatedLinks.isActive,
      sortOrder: curatedLinks.sortOrder,
      createdAt: curatedLinks.createdAt,
      productName: products.name,
    })
      .from(curatedLinks)
      .leftJoin(products, eq(curatedLinks.productId, products.id))
      .orderBy(desc(curatedLinks.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`COUNT(*)` }).from(curatedLinks),
  ]);

  return { links: rows, total: Number(countRows[0]?.count || 0) };
}

// ============================================================
// Points & Badges Operations
// ============================================================

/**
 * ユーザーのポイント残高を取得（なければ初期化）
 */
export async function getUserPoints(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const rows = await db.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1);

  if (rows.length === 0) {
    // 初回アクセス時に初期化
    await db.insert(userPoints).values({
      userId,
      totalPoints: 0,
      availablePoints: 0,
      usedPoints: 0,
      expiredPoints: 0,
      tier: "bronze",
    });
    return { userId, totalPoints: 0, availablePoints: 0, usedPoints: 0, expiredPoints: 0, tier: "bronze" as const };
  }

  return rows[0];
}

/**
 * ポイントを付与（取引履歴に記録）
 */
export async function awardPoints(data: {
  userId: number;
  points: number;
  type: "earn_review" | "earn_like" | "earn_login" | "earn_bonus" | "earn_admin";
  referenceType?: string;
  referenceId?: string;
  description: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 現在の残高を取得（なければ初期化）
  const current = await getUserPoints(data.userId);
  const currentAvailable = current?.availablePoints || 0;
  const newBalance = currentAvailable + data.points;

  // userPointsをUPSERT
  await db.execute(
    sql`INSERT INTO userPoints (userId, totalPoints, availablePoints, usedPoints, expiredPoints, tier)
        VALUES (${data.userId}, ${data.points}, ${data.points}, 0, 0, 'bronze')
        ON DUPLICATE KEY UPDATE
          totalPoints = totalPoints + ${data.points},
          availablePoints = availablePoints + ${data.points},
          tier = CASE
            WHEN totalPoints + ${data.points} >= 5000 THEN 'platinum'
            WHEN totalPoints + ${data.points} >= 2000 THEN 'gold'
            WHEN totalPoints + ${data.points} >= 500 THEN 'silver'
            ELSE 'bronze'
          END`
  );

  // 取引履歴を記録
  await db.insert(pointTransactions).values({
    userId: data.userId,
    type: data.type,
    points: data.points,
    balanceAfter: newBalance,
    referenceType: data.referenceType || null,
    referenceId: data.referenceId || null,
    description: data.description,
  });

  return { newBalance };
}

/**
 * ポイント取引履歴を取得
 */
export async function getPointTransactions(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return { transactions: [], total: 0 };

  const [rows, countRows] = await Promise.all([
    db.select().from(pointTransactions)
      .where(eq(pointTransactions.userId, userId))
      .orderBy(desc(pointTransactions.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`COUNT(*)` })
      .from(pointTransactions)
      .where(eq(pointTransactions.userId, userId)),
  ]);

  return { transactions: rows, total: Number(countRows[0]?.count || 0) };
}

/**
 * ユーザーのバッジ一覧を取得
 */
export async function getUserBadges(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(userBadges)
    .where(eq(userBadges.userId, userId))
    .orderBy(desc(userBadges.earnedAt));
}

/**
 * バッジを付与（重複チェック付き）
 */
export async function awardBadge(userId: number, badgeType: typeof userBadges.$inferInsert["badgeType"]) {
  const db = await getDb();
  if (!db) return { alreadyHas: true };

  const existing = await db.select({ id: userBadges.id })
    .from(userBadges)
    .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeType, badgeType)))
    .limit(1);

  if (existing.length > 0) return { alreadyHas: true };

  await db.insert(userBadges).values({ userId, badgeType });
  return { alreadyHas: false };
}

/**
 * 口コミ投稿後のポイント・バッジ付与処理
 */
export async function processReviewReward(userId: number, productId: string, reviewId: number) {
  const reviewCount = await getUserReviewCount(userId);

  // ポイント付与
  const points = reviewCount === 1 ? 50 : 20; // 初回50pt、2回目以降20pt
  await awardPoints({
    userId,
    points,
    type: "earn_review",
    referenceType: "review",
    referenceId: String(reviewId),
    description: reviewCount === 1 ? "初めての口コミ投稿 +50pt" : "口コミ投稿 +20pt",
  });

  // バッジ付与チェック
  if (reviewCount === 1) {
    await awardBadge(userId, "first_review");
    // 初回口コミボーナス
    await awardPoints({
      userId,
      points: 30,
      type: "earn_bonus",
      referenceType: "badge",
      referenceId: "first_review",
      description: "バッジ「初めての口コミ」獲得ボーナス +30pt",
    });
  }
  if (reviewCount >= 5) await awardBadge(userId, "review_5");
  if (reviewCount >= 20) await awardBadge(userId, "review_20");
}

/**
 * いいね後のポイント・バッジ付与処理
 */
export async function processLikeReward(userId: number) {
  // いいね1回 +5pt
  await awardPoints({
    userId,
    points: 5,
    type: "earn_like",
    description: "いいね +5pt",
  });

  // いいね数チェック（バッジ付与）
  const db = await getDb();
  if (!db) return;
  const likeCountRows = await db.select({ count: sql<number>`COUNT(*)` })
    .from(likes)
    .where(eq(likes.userId, userId));
  const likeCount = Number(likeCountRows[0]?.count || 0);

  if (likeCount >= 10) {
    const result = await awardBadge(userId, "like_10");
    if (!result.alreadyHas) {
      await awardPoints({
        userId,
        points: 30,
        type: "earn_bonus",
        referenceType: "badge",
        referenceId: "like_10",
        description: "バッジ「いいね王」獲得ボーナス +30pt",
      });
    }
  }
  if (likeCount >= 50) await awardBadge(userId, "like_50");
}

/**
 * 初回ログインボーナス付与（1回のみ）
 */
export async function processLoginBonus(userId: number) {
  const db = await getDb();
  if (!db) return;

  // 既にログインボーナスを受け取っているか確認
  const existing = await db.select({ id: pointTransactions.id })
    .from(pointTransactions)
    .where(and(
      eq(pointTransactions.userId, userId),
      eq(pointTransactions.type, "earn_login")
    ))
    .limit(1);

  if (existing.length === 0) {
    await awardPoints({
      userId,
      points: 100,
      type: "earn_login",
      description: "初回ログインボーナス +100pt",
    });
    await awardBadge(userId, "first_login");
  }
}

// ============================================================
// お土産コレクター機能 - DB ヘルパー
// ============================================================

/**
 * ユーザーのコレクション一覧を取得
 */
export async function getCollectionsByUserId(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const [rows, countRows] = await Promise.all([
    db.select().from(collections)
      .where(eq(collections.userId, userId))
      .orderBy(desc(collections.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`COUNT(*)` }).from(collections)
      .where(eq(collections.userId, userId)),
  ]);
  return { items: rows, total: Number(countRows[0]?.count || 0) };
}

/**
 * コレクションに商品を追加
 */
export async function addToCollection(data: {
  userId: number;
  productId: string;
  photoUrl?: string;
  ocrText?: string;
  matchScore?: number;
  prefecture: string;
  region: string;
  pointsEarned?: number;
  status?: "pending" | "matched" | "unmatched" | "manual";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(collections).values({
    userId: data.userId,
    productId: data.productId,
    photoUrl: data.photoUrl ?? null,
    ocrText: data.ocrText ?? null,
    matchScore: data.matchScore?.toString() ?? null,
    prefecture: data.prefecture,
    region: data.region,
    pointsEarned: data.pointsEarned ?? 0,
    status: data.status ?? "matched",
  });
  return { id: (result as any).insertId as number };
}

/**
 * ユーザーが既にその商品をコレクション済みか確認
 */
export async function isProductCollected(userId: number, productId: string) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: collections.id })
    .from(collections)
    .where(and(eq(collections.userId, userId), eq(collections.productId, productId)))
    .limit(1);
  return rows.length > 0;
}

/**
 * コレクターステータスを取得（なければ初期化して返す）
 */
export async function getOrCreateCollectorStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(collectorStats)
    .where(eq(collectorStats.userId, userId))
    .limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(collectorStats).values({
    userId,
    totalCollected: 0,
    prefecturesCount: 0,
    regionsCount: 0,
    collectorRank: "traveler",
    stampedPrefectures: "[]",
    stampedRegions: "[]",
  });
  const created = await db.select().from(collectorStats)
    .where(eq(collectorStats.userId, userId))
    .limit(1);
  return created[0];
}

/**
 * コレクターステータスを更新（新しいスタンプを追加）
 */
export async function updateCollectorStats(userId: number, newPrefecture: string, newRegion: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const stats = await getOrCreateCollectorStats(userId);
  const stampedPrefs: string[] = JSON.parse(stats.stampedPrefectures || "[]");
  const stampedRegs: string[] = JSON.parse(stats.stampedRegions || "[]");

  const prefAdded = !stampedPrefs.includes(newPrefecture);
  const regAdded = !stampedRegs.includes(newRegion);

  if (prefAdded) stampedPrefs.push(newPrefecture);
  if (regAdded) stampedRegs.push(newRegion);

  const newPrefCount = stampedPrefs.length;
  const newRegCount = stampedRegs.length;

  // ランク計算
  let newRank: "traveler" | "seasoned" | "master" | "legend" = "traveler";
  if (newPrefCount >= 35) newRank = "legend";
  else if (newPrefCount >= 20) newRank = "master";
  else if (newPrefCount >= 10) newRank = "seasoned";

  const rankChanged = newRank !== stats.collectorRank;

  await db.update(collectorStats).set({
    totalCollected: stats.totalCollected + 1,
    prefecturesCount: newPrefCount,
    regionsCount: newRegCount,
    collectorRank: newRank,
    stampedPrefectures: JSON.stringify(stampedPrefs),
    stampedRegions: JSON.stringify(stampedRegs),
  }).where(eq(collectorStats.userId, userId));

  return { prefAdded, regAdded, rankChanged, newRank, prefecturesCount: newPrefCount };
}

/**
 * OCR結果テキストからDBの商品を検索してマッチング
 */
export async function matchProductByOcrText(ocrText: string): Promise<{ product: any; score: number } | null> {
  const db = await getDb();
  if (!db) return null;

  // テキストを単語に分割してOR検索
  const words = ocrText.split(/[\s\n、。・]+/).filter(w => w.length >= 2).slice(0, 10);
  if (words.length === 0) return null;

  const conditions = words.map(w =>
    or(
      like(products.name, `%${w}%`),
      like(products.brand, `%${w}%`),
    )
  );

  const candidates = await db.select().from(products)
    .where(or(...conditions))
    .orderBy(desc(products.likeCount))
    .limit(10);

  if (candidates.length === 0) return null;

  // スコアリング: 何単語マッチしたか
  let bestProduct = candidates[0];
  let bestScore = 0;
  for (const candidate of candidates) {
    let score = 0;
    for (const word of words) {
      if (candidate.name.includes(word)) score += 3;
      if (candidate.brand?.includes(word)) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      bestProduct = candidate;
    }
  }

  const normalizedScore = Math.min(100, (bestScore / (words.length * 3)) * 100);
  return { product: bestProduct, score: normalizedScore };
}
