import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getAllProducts, getProductById, getSellersByProductId, getAllFacilities, getAllReservations, createProduct, updateProduct, deleteProduct, searchProducts, getAvailablePrefectures, getAvailableCategories, getAvailableRegions, getSellerById } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
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
        // 売り場情報も一緒に取得
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
  // Omiyage Go - Sellers Router
  // ============================================================
  sellers: router({
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const seller = await getSellerById(input.id);
        if (!seller) return null;
        // 関連商品も取得
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
        // Admin check
        if (ctx.user?.role !== "admin") {
          throw new Error("Admin access required");
        }
        return await getAllProducts();
      }),
      
      get: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
          if (ctx.user?.role !== "admin") {
            throw new Error("Admin access required");
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
            throw new Error("Admin access required");
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
            throw new Error("Admin access required");
          }
          const { id, ...updateData } = input;
          await updateProduct(id, updateData);
          return { success: true };
        }),
      
      delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
          if (ctx.user?.role !== "admin") {
            throw new Error("Admin access required");
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
            throw new Error("Admin access required");
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
            errors: errors.slice(0, 10), // Return first 10 errors
            message: `Imported ${successCount} products${errorCount > 0 ? ` (${errorCount} errors)` : ''}`
          };
        }),
    }),
    
    facilities: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Admin access required");
        }
        return await getAllFacilities();
      }),
      delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
          if (ctx.user?.role !== "admin") {
            throw new Error("Admin access required");
          }
          return { success: true };
        }),
    }),
    
    reservations: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Admin access required");
        }
        return await getAllReservations();
      }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
