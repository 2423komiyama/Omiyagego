/**
 * プッシュ通知・お気に入り・エリアトレンド ルーター
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  pushSubscriptions, favorites, areaTrends, products, sellers, facilities,
} from "../../drizzle/schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { sendPushToUser } from "../push";

// ============================================================
// Push Subscription Router
// ============================================================
export const notificationsRouter = router({

  /**
   * Web Push購読を登録・更新
   */
  subscribe: publicProcedure
    .input(z.object({
      endpoint: z.string().url(),
      p256dh: z.string(),
      auth: z.string(),
      userAgent: z.string().optional(),
      sessionId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const userId = ctx.user?.id ?? null;

      // 既存の購読を確認（endpointで一意）
      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, input.endpoint))
        .limit(1);

      if (existing.length > 0) {
        // 更新
        await db
          .update(pushSubscriptions)
          .set({
            p256dh: input.p256dh,
            auth: input.auth,
            userId: userId,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(pushSubscriptions.id, existing[0].id));
        return { subscriptionId: existing[0].id, updated: true };
      }

      // 新規登録
      await db.insert(pushSubscriptions).values({
        userId,
        sessionId: input.sessionId ?? null,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent ?? null,
        isActive: true,
      });

      const inserted = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, input.endpoint))
        .limit(1);

      return { subscriptionId: inserted[0]?.id ?? null, updated: false };
    }),

  /**
   * 購読解除
   */
  unsubscribe: publicProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(pushSubscriptions)
        .set({ isActive: false })
        .where(eq(pushSubscriptions.endpoint, input.endpoint));

      return { success: true };
    }),

  /**
   * 通知設定を更新
   */
  updateSettings: protectedProcedure
    .input(z.object({
      endpoint: z.string(),
      notifyNearby: z.boolean().optional(),
      notifyTrending: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const updates: Record<string, boolean> = {};
      if (input.notifyNearby !== undefined) updates.notifyNearby = input.notifyNearby;
      if (input.notifyTrending !== undefined) updates.notifyTrending = input.notifyTrending;

      await db
        .update(pushSubscriptions)
        .set(updates)
        .where(eq(pushSubscriptions.endpoint, input.endpoint));

      return { success: true };
    }),

  // ============================================================
  // お気に入り機能
  // ============================================================

  /**
   * お気に入りに追加
   */
  addFavorite: protectedProcedure
    .input(z.object({
      productId: z.string(),
      notifyNearby: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // 重複チェック
      const existing = await db
        .select()
        .from(favorites)
        .where(and(
          eq(favorites.userId, ctx.user.id),
          eq(favorites.productId, input.productId)
        ))
        .limit(1);

      if (existing.length > 0) {
        return { success: true, alreadyExists: true };
      }

      await db.insert(favorites).values({
        userId: ctx.user.id,
        productId: input.productId,
        notifyNearby: input.notifyNearby,
      });

      return { success: true, alreadyExists: false };
    }),

  /**
   * お気に入りから削除
   */
  removeFavorite: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .delete(favorites)
        .where(and(
          eq(favorites.userId, ctx.user.id),
          eq(favorites.productId, input.productId)
        ));

      return { success: true };
    }),

  /**
   * お気に入り一覧を取得
   */
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const favs = await db
      .select({
        id: favorites.id,
        productId: favorites.productId,
        notifyNearby: favorites.notifyNearby,
        createdAt: favorites.createdAt,
        product: {
          id: products.id,
          name: products.name,
          brand: products.brand,
          price: products.price,
          imageUrl: products.imageUrl,
          realImageUrl: products.realImageUrl,
          prefecture: products.prefecture,
          category: products.category,
        },
      })
      .from(favorites)
      .innerJoin(products, eq(favorites.productId, products.id))
      .where(eq(favorites.userId, ctx.user.id))
      .orderBy(desc(favorites.createdAt));

    return favs;
  }),

  /**
   * お気に入り状態を確認
   */
  isFavorite: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { isFavorite: false };

      const existing = await db
        .select()
        .from(favorites)
        .where(and(
          eq(favorites.userId, ctx.user.id),
          eq(favorites.productId, input.productId)
        ))
        .limit(1);

      return { isFavorite: existing.length > 0 };
    }),

  /**
   * 近接チェック: ユーザーの現在地とお気に入り商品の売り場を比較して通知を送信
   * フロントエンドから位置情報を受け取り、サーバーサイドで距離計算・通知送信
   */
  checkNearby: protectedProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      radiusMeters: z.number().default(500), // デフォルト500m以内
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { latitude, longitude, radiusMeters } = input;

      // ユーザーのお気に入り商品を取得
      const userFavs = await db
        .select({
          productId: favorites.productId,
          notifyNearby: favorites.notifyNearby,
          lastNearbyNotifiedAt: favorites.lastNearbyNotifiedAt,
          productName: products.name,
        })
        .from(favorites)
        .innerJoin(products, eq(favorites.productId, products.id))
        .where(and(
          eq(favorites.userId, ctx.user.id),
          eq(favorites.notifyNearby, true)
        ));

      if (userFavs.length === 0) return { notified: 0, nearby: [] };

      // 全施設の位置情報を取得
      const allFacilities = await db.select().from(facilities);

      // Haversine距離計算
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const calcDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371000; // メートル
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      // 近くの施設を特定
      const nearbyFacilities = allFacilities
        .map((f) => ({
          ...f,
          distanceMeters: calcDistance(
            latitude, longitude,
            parseFloat(f.latitude as unknown as string),
            parseFloat(f.longitude as unknown as string)
          ),
        }))
        .filter((f) => f.distanceMeters <= radiusMeters);

      if (nearbyFacilities.length === 0) return { notified: 0, nearby: [] };

      const nearbyFacilityIds = nearbyFacilities.map((f) => f.id);

      // お気に入り商品の売り場が近くにあるか確認
      const productIds = userFavs.map((f) => f.productId);
      const nearbySellers = await db
        .select({
          productId: sellers.productId,
          facilityId: sellers.facilityId,
          storeName: sellers.storeName,
        })
        .from(sellers)
        .where(and(
          inArray(sellers.productId, productIds),
          inArray(sellers.facilityId, nearbyFacilityIds)
        ));

      const notifiedProducts: string[] = [];
      let notifiedCount = 0;

      for (const seller of nearbySellers) {
        const fav = userFavs.find((f) => f.productId === seller.productId);
        if (!fav) continue;

        // 同じ商品について1時間以内に通知済みならスキップ
        if (fav.lastNearbyNotifiedAt) {
          const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
          if (fav.lastNearbyNotifiedAt > hourAgo) continue;
        }

        const nearFacility = nearbyFacilities.find((f) => f.id === seller.facilityId);
        if (!nearFacility) continue;

        // プッシュ通知送信
        const sent = await sendPushToUser(ctx.user.id, {
          title: `📍 お気に入りのお土産が近くにあります`,
          body: `「${fav.productName}」が${nearFacility.shortLabel}（${Math.round(nearFacility.distanceMeters)}m先）で買えます`,
          url: `/db-product/${seller.productId}`,
          productId: seller.productId,
          facilityId: seller.facilityId,
          tag: `nearby-${seller.productId}`,
          type: 'nearby',
          actions: [
            { action: 'view_product', title: '商品を見る' },
            { action: 'view_station', title: '売り場を見る' },
          ],
        });

        if (sent > 0) {
          // 通知日時を更新
          await db
            .update(favorites)
            .set({ lastNearbyNotifiedAt: new Date() })
            .where(and(
              eq(favorites.userId, ctx.user.id),
              eq(favorites.productId, seller.productId)
            ));
          notifiedCount++;
          notifiedProducts.push(seller.productId);
        }
      }

      return {
        notified: notifiedCount,
        nearby: nearbyFacilities.map((f) => ({
          facilityId: f.id,
          facilityName: f.shortLabel,
          distanceMeters: Math.round(f.distanceMeters),
        })),
      };
    }),

  // ============================================================
  // エリア別トレンド
  // ============================================================

  /**
   * エリア別トレンド商品を取得（キャッシュ付き）
   * 位置情報から最寄りの施設・都道府県のトレンドを返す
   */
  getAreaTrends: publicProcedure
    .input(z.object({
      facilityId: z.string().optional(),
      prefecture: z.string().optional(),
      limit: z.number().default(5),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { facilityId, prefecture, limit } = input;

      // キャッシュされたトレンドを確認（1時間以内）
      let cachedTrend = null;
      if (facilityId) {
        const rows = await db
          .select()
          .from(areaTrends)
          .where(eq(areaTrends.facilityId, facilityId))
          .orderBy(desc(areaTrends.calculatedAt))
          .limit(1);
        cachedTrend = rows[0] ?? null;
      } else if (prefecture) {
        const rows = await db
          .select()
          .from(areaTrends)
          .where(and(
            sql`${areaTrends.facilityId} IS NULL`,
            eq(areaTrends.prefecture, prefecture)
          ))
          .orderBy(desc(areaTrends.calculatedAt))
          .limit(1);
        cachedTrend = rows[0] ?? null;
      }

      // キャッシュが1時間以内なら使用
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (cachedTrend && cachedTrend.calculatedAt > oneHourAgo) {
        const productIds = JSON.parse(cachedTrend.topProductIds) as string[];
        const trendProducts = await db
          .select()
          .from(products)
          .where(inArray(products.id, productIds.slice(0, limit)));
        return { products: trendProducts, source: 'cache' as const };
      }

      // キャッシュなし or 古い → リアルタイム計算
      let trendProducts;
      if (facilityId) {
        // 施設別: その施設で売られているいいね数上位商品
        const sellerRows = await db
          .select({ productId: sellers.productId })
          .from(sellers)
          .where(eq(sellers.facilityId, facilityId));
        const sellerProductIds = sellerRows.map((s) => s.productId);

        if (sellerProductIds.length === 0) {
          return { products: [], source: 'realtime' as const };
        }

        trendProducts = await db
          .select()
          .from(products)
          .where(inArray(products.id, sellerProductIds))
          .orderBy(desc(products.likeCount))
          .limit(limit);
      } else if (prefecture) {
        // 都道府県別: その都道府県のいいね数上位商品
        trendProducts = await db
          .select()
          .from(products)
          .where(eq(products.prefecture, prefecture))
          .orderBy(desc(products.likeCount))
          .limit(limit);
      } else {
        // 全国: いいね数上位商品
        trendProducts = await db
          .select()
          .from(products)
          .orderBy(desc(products.likeCount))
          .limit(limit);
      }

      // キャッシュを更新
      const topProductIds = JSON.stringify(trendProducts.map((p) => p.id));
      if (facilityId || prefecture) {
        await db.insert(areaTrends).values({
          facilityId: facilityId ?? null,
          prefecture: prefecture ?? null,
          topProductIds,
          calculatedAt: new Date(),
        });
      }

      return { products: trendProducts, source: 'realtime' as const };
    }),

  /**
   * 近隣エリアの注目お土産を取得（位置情報ベース）
   */
  getNearbyTrending: publicProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      limit: z.number().default(6),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { latitude, longitude, limit } = input;

      // 全施設から最寄りを特定
      const allFacilities = await db.select().from(facilities);

      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const calcDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371000;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      const sortedFacilities = allFacilities
        .map((f) => ({
          ...f,
          distanceMeters: calcDistance(
            latitude, longitude,
            parseFloat(f.latitude as unknown as string),
            parseFloat(f.longitude as unknown as string)
          ),
        }))
        .sort((a, b) => a.distanceMeters - b.distanceMeters);

      const nearestFacility = sortedFacilities[0];
      if (!nearestFacility) return { products: [], facilityName: null };

      // 最寄り施設の商品を取得
      const sellerRows = await db
        .select({ productId: sellers.productId })
        .from(sellers)
        .where(eq(sellers.facilityId, nearestFacility.id));

      const sellerProductIds = sellerRows.map((s) => s.productId);
      if (sellerProductIds.length === 0) return { products: [], facilityName: nearestFacility.shortLabel };

      const trendProducts = await db
        .select()
        .from(products)
        .where(inArray(products.id, sellerProductIds))
        .orderBy(desc(products.likeCount))
        .limit(limit);

      return {
        products: trendProducts,
        facilityName: nearestFacility.shortLabel,
        facilityId: nearestFacility.id,
        distanceMeters: Math.round(nearestFacility.distanceMeters),
      };
    }),
});
