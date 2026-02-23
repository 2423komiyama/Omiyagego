import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getAllProducts, getProductById, getAllFacilities, getAllReservations, createProduct, updateProduct, deleteProduct } from "./db";

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
