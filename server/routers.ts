import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { collectorRouter } from "./routers/collector";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getAllProducts, getProductById, getSellersByProductId, getAllFacilities,
  getAllReservations, createProduct, updateProduct, deleteProduct, searchProducts,
  getAvailablePrefectures, getAvailableCategories, getAvailableRegions, getSellerById,
  addLike, removeLike, getLikedProductIds, getActiveFeatures, getProductsByFacilityId,
  getFacilityById, getSellersByFacilityId,
  // 新規
  getReviewsByProductId, createReview, processReviewReward,
  getCuratedLinksByProductId, addCuratedLink, deleteCuratedLink, getAllCuratedLinks,
  getUserPoints, getPointTransactions, getUserBadges, processLikeReward, processLoginBonus,
  // コレクター機能
  getCollectionsByUserId, addToCollection, isProductCollected,
  getOrCreateCollectorStats, updateCollectorStats, matchProductByOcrText,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================
  // Omiyage Go - Public Product Search Router
  // ============================================================
  products: router({
    search: publicProcedure
      .input(z.object({
        query: z.string().optional(),
        prefecture: z.string().optional(),
        region: z.string().optional(),
        category: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        badges: z.array(z.string()).optional(),
        purposeTag: z.string().optional(),
        minShelfLife: z.number().optional(),
        isIndividualPackaged: z.boolean().optional(),
        facilityId: z.string().optional(),
        sortBy: z.enum(['popular', 'editorial', 'shelf_life_desc', 'price_asc', 'newest']).optional(),
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
      }))
      .query(async ({ input }) => {
        return await searchProducts(input);
      }),
    
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const product = await getProductById(input.id);
        if (!product) return null;
        const productSellers = await getSellersByProductId(input.id);
        return { ...product, sellers: productSellers };
      }),
    
    prefectures: publicProcedure.query(async () => {
      return await getAvailablePrefectures();
    }),
    
    categories: publicProcedure.query(async () => {
      return await getAvailableCategories();
    }),
    
    regions: publicProcedure.query(async () => {
      return await getAvailableRegions();
    }),
  }),

  // ============================================================
  // Omiyage Go - Likes Router
  // ============================================================
  likes: router({
    toggle: publicProcedure
      .input(z.object({
        productId: z.string(),
        sessionId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id;
        const sessionId = input.sessionId;

        const likedIds = await getLikedProductIds(sessionId, userId);
        const isLiked = likedIds.includes(input.productId);

        if (isLiked) {
          await removeLike(input.productId, sessionId, userId);
          return { liked: false };
        } else {
          await addLike(input.productId, sessionId, userId);
          // ログイン済みユーザーにポイント付与
          if (userId) {
            await processLikeReward(userId);
          }
          return { liked: true };
        }
      }),

    getLikedIds: publicProcedure
      .input(z.object({ sessionId: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user?.id;
        return await getLikedProductIds(input.sessionId, userId);
      }),
  }),

  // ============================================================
  // Omiyage Go - Reviews (口コミ) Router
  // ============================================================
  reviews: router({
    list: publicProcedure
      .input(z.object({
        productId: z.string(),
        limit: z.number().optional().default(10),
        offset: z.number().optional().default(0),
      }))
      .query(async ({ input }) => {
        return await getReviewsByProductId(input.productId, input.limit, input.offset);
      }),

    create: protectedProcedure
      .input(z.object({
        productId: z.string(),
        rating: z.number().min(1).max(5),
        body: z.string().min(10, "口コミは10文字以上で入力してください").max(1000),
        purposeTag: z.string().optional(),
        isAnonymous: z.boolean().optional().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const authorName = input.isAnonymous ? null : (ctx.user.name || null);

        const { id: reviewId } = await createReview({
          productId: input.productId,
          userId,
          rating: input.rating,
          body: input.body,
          purposeTag: input.purposeTag,
          isAnonymous: input.isAnonymous,
          authorName: authorName || undefined,
        });

        // ポイント・バッジ付与
        await processReviewReward(userId, input.productId, reviewId);

        return { success: true, reviewId };
      }),
  }),

  // ============================================================
  // Omiyage Go - Curated Links (キュレーションリンク) Router
  // ============================================================
  curatedLinks: router({
    list: publicProcedure
      .input(z.object({ productId: z.string() }))
      .query(async ({ input }) => {
        return await getCuratedLinksByProductId(input.productId);
      }),

    add: protectedProcedure
      .input(z.object({
        productId: z.string(),
        type: z.enum(["youtube", "instagram", "twitter", "tiktok", "article", "news", "other"]),
        url: z.string().url("有効なURLを入力してください"),
        title: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        description: z.string().optional(),
        authorName: z.string().optional(),
        sortOrder: z.number().optional().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "管理者のみ操作できます" });
        }
        const { id } = await addCuratedLink({ ...input, addedBy: ctx.user.id });
        return { success: true, id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "管理者のみ操作できます" });
        }
        await deleteCuratedLink(input.id);
        return { success: true };
      }),

    adminList: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "管理者のみ操作できます" });
        }
        return await getAllCuratedLinks(input.limit, input.offset);
      }),
  }),

  // ============================================================
  // Omiyage Go - Points & Badges Router
  // ============================================================
  points: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      return await getUserPoints(ctx.user.id);
    }),

    transactions: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
      }))
      .query(async ({ ctx, input }) => {
        return await getPointTransactions(ctx.user.id, input.limit, input.offset);
      }),

    loginBonus: protectedProcedure.mutation(async ({ ctx }) => {
      await processLoginBonus(ctx.user.id);
      const points = await getUserPoints(ctx.user.id);
      return { success: true, points };
    }),
  }),

  badges: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      return await getUserBadges(ctx.user.id);
    }),
  }),

  // ============================================================
  // Omiyage Go - Features (特集カード) Router
  // ============================================================
  features: router({
    getActive: publicProcedure.query(async () => {
      return await getActiveFeatures();
    }),
  }),

  // ============================================================
  // Omiyage Go - Facilities Router (Public)
  // ============================================================
  facilities: router({
    list: publicProcedure.query(async () => {
      return await getAllFacilities();
    }),

    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await getFacilityById(input.id);
      }),

    getProducts: publicProcedure
      .input(z.object({
        facilityId: z.string(),
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
      }))
      .query(async ({ input }) => {
        // URLのfacilityId（短縮形）→ DBのfacilityId（完全形）マッピング
        const FACILITY_ID_MAP: Record<string, string> = {
          "tokyo": "tokyo_station",
          "shinjuku": "tokyo_station",
          "shinagawa": "tokyo_station",
          "shibuya": "tokyo_station",
          "chitose": "shin_chitose_airport",
          "kyoto": "kyoto_station",
          "osaka": "shin_osaka_station",
          "fukuoka": "hakata_station",
          "naha": "naha_airport",
          "hiroshima": "hiroshima_station",
          "nagoya": "nagoya_station",
          "sendai": "sendai_station",
          "kanazawa": "kanazawa_station",
          "haneda_t1": "haneda_t1",
          "haneda_t2": "haneda_t2",
          "haneda_t3": "haneda_t1",
        };
        const dbFacilityId = FACILITY_ID_MAP[input.facilityId] ?? input.facilityId;
        return await getProductsByFacilityId(dbFacilityId, input.limit, input.offset);
      }),

    getSellers: publicProcedure
      .input(z.object({ facilityId: z.string() }))
      .query(async ({ input }) => {
        const FACILITY_ID_MAP: Record<string, string> = {
          "tokyo": "tokyo_station",
          "shinjuku": "tokyo_station",
          "shinagawa": "tokyo_station",
          "shibuya": "tokyo_station",
          "chitose": "shin_chitose_airport",
          "kyoto": "kyoto_station",
          "osaka": "shin_osaka_station",
          "fukuoka": "hakata_station",
          "naha": "naha_airport",
          "hiroshima": "hiroshima_station",
          "nagoya": "nagoya_station",
          "sendai": "sendai_station",
          "kanazawa": "kanazawa_station",
          "haneda_t1": "haneda_t1",
          "haneda_t2": "haneda_t2",
          "haneda_t3": "haneda_t1",
        };
        const dbFacilityId = FACILITY_ID_MAP[input.facilityId] ?? input.facilityId;
        return await getSellersByFacilityId(dbFacilityId);
      }),
  }),

  // ============================================================
  // Omiyage Go - Sellers Router
  // ============================================================
  sellers: router({
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const seller = await getSellerById(input.id);
        if (!seller) return null;
        const product = await getProductById(seller.productId);
        return { ...seller, product: product || null };
      }),
  }),

  // ============================================================
  // Omiyage Go - Admin Router
  // ============================================================
  admin: router({
    products: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await getAllProducts();
      }),
      
      get: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
          if (ctx.user?.role !== "admin") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
          }
          return await getProductById(input.id);
        }),
      
      create: protectedProcedure
        .input(z.object({
          name: z.string(),
          brand: z.string(),
          price: z.number(),
          prefecture: z.string(),
          region: z.string(),
          description: z.string().optional(),
          shelfLife: z.number().optional(),
          imageUrl: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          if (ctx.user?.role !== "admin") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
          }
          const id = `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await createProduct({
            id,
            name: input.name,
            brand: input.brand,
            price: input.price,
            prefecture: input.prefecture,
            region: input.region,
            description: input.description,
            shelfLife: input.shelfLife,
            imageUrl: input.imageUrl,
            createdBy: ctx.user.id,
          });
          return { success: true, id };
        }),
      
      update: protectedProcedure
        .input(z.object({
          id: z.string(),
          name: z.string().optional(),
          brand: z.string().optional(),
          price: z.number().optional(),
          prefecture: z.string().optional(),
          region: z.string().optional(),
          description: z.string().optional(),
          shelfLife: z.number().optional(),
          imageUrl: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          if (ctx.user?.role !== "admin") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
          }
          const { id, ...updateData } = input;
          await updateProduct(id, updateData);
          return { success: true };
        }),
      
      delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
          if (ctx.user?.role !== "admin") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
          }
          await deleteProduct(input.id);
          return { success: true };
        }),
      
      bulkImport: protectedProcedure
        .input(z.object({
          products: z.array(z.object({
            id: z.string().optional(),
            name: z.string(),
            brand: z.string(),
            description: z.string(),
            price: z.number(),
            imageUrl: z.string().optional(),
            prefecture: z.string(),
            region: z.string(),
            category: z.string(),
            shelfLife: z.number(),
            isIndividualPackaged: z.boolean(),
            servingSize: z.number(),
            guaranteeReason: z.array(z.string()).optional(),
            makerStory: z.string().optional(),
            badges: z.array(z.string()).optional(),
          }))
        }))
        .mutation(async ({ ctx, input }) => {
          if (ctx.user?.role !== "admin") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
          }
          
          let successCount = 0;
          let errorCount = 0;
          const errors: string[] = [];
          
          for (const product of input.products) {
            try {
              await createProduct({
                name: product.name,
                brand: product.brand,
                description: product.description,
                price: product.price,
                imageUrl: product.imageUrl || '',
                prefecture: product.prefecture,
                region: product.region,
                category: product.category,
                shelfLife: product.shelfLife,
                isIndividualPackaged: product.isIndividualPackaged,
                servingSize: product.servingSize,
                guaranteeReason: product.guaranteeReason || [],
                makerStory: product.makerStory || '',
                badges: product.badges || [],
              });
              successCount++;
            } catch (error) {
              errorCount++;
              errors.push(`Product "${product.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
          
          return {
            success: true,
            successCount,
            errorCount,
            errors: errors.slice(0, 10),
            message: `Imported ${successCount} products${errorCount > 0 ? ` (${errorCount} errors)` : ''}`
          };
        }),
    }),
    
    facilities: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await getAllFacilities();
      }),
      delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
          if (ctx.user?.role !== "admin") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
          }
          return { success: true };
        }),
    }),
    
    reservations: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await getAllReservations();
      }),
    }),
  }),

  // ============================================================
  // お土産コレクター機能（桃鉄風スタンプラリー）
  // ============================================================
  collector: collectorRouter,
});

export type AppRouter = typeof appRouter;
