import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, sellers, facilities, giftMessages, reservations, likes, reviews, features } from "../drizzle/schema";
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
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
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
  if (!db) return undefined;
  const result = await db.select().from(sellers).where(eq(sellers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
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
  if (!db) return undefined;
  const result = await db.select().from(facilities).where(eq(facilities.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
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
  if (!db) return undefined;
  const result = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
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
