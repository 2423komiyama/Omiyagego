import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, sellers, facilities, giftMessages, reservations } from "../drizzle/schema";
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
  id: string;
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
  guaranteeReason?: string;
  makerStory?: string;
  badges?: string;
  createdBy?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(products).values({
    ...data,
    category: data.category || "その他",
  });
  
  return data.id;
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
