import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getCollectionsByUserId, addToCollection, isProductCollected,
  getOrCreateCollectorStats, updateCollectorStats, matchProductByOcrText,
  getProductById, awardPoints,
  getCollectionsByPrefecture, getTopCollectedProducts, getCollectorCountByProductId,
} from "../db";

export const collectorRouter = router({
  /**
   * コレクション一覧を取得
   */
  list: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const result = await getCollectionsByUserId(ctx.user.id, input.limit, input.offset);
      const itemsWithProduct = await Promise.all(
        result.items.map(async (item) => {
          const product = await getProductById(item.productId);
          return { ...item, product };
        })
      );
      return { items: itemsWithProduct, total: result.total };
    }),

  /**
   * コレクターステータスを取得
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    return await getOrCreateCollectorStats(ctx.user.id);
  }),

  /**
   * 写真をOCRして商品を特定する（プレビューステップ）
   */
  recognizePhoto: protectedProcedure
    .input(z.object({
      photoUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("../_core/llm");
      // LLM Visionで写真から商品名・ブランド名をOCR
      const ocrResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "あなたは日本のお土産商品を認識する専門家です。画像から商品名、ブランド名、特徴的なテキストを抽出してください。必ずJSON形式で返答してください。",
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: input.photoUrl, detail: "high" },
              },
              {
                type: "text",
                text: 'このお土産商品の商品名、ブランド名、地域名、包装に書かれているテキストを抽出してください。JSON形式: {"productName": "", "brand": "", "region": "", "extractedText": ""}',
              },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ocr_result",
            strict: true,
            schema: {
              type: "object",
              properties: {
                productName: { type: "string" },
                brand: { type: "string" },
                region: { type: "string" },
                extractedText: { type: "string" },
              },
              required: ["productName", "brand", "region", "extractedText"],
              additionalProperties: false,
            },
          },
        },
      });

      const ocrResult = JSON.parse(ocrResponse.choices[0].message.content as string);
      const searchText = `${ocrResult.productName} ${ocrResult.brand} ${ocrResult.extractedText}`.trim();

      // DBで商品マッチング
      const match = await matchProductByOcrText(searchText);

      return {
        ocrText: searchText,
        ocrResult,
        matchedProduct: match?.product ?? null,
        matchScore: match?.score ?? 0,
      };
    }),

  /**
   * コレクションに登録（OCR結果を確認後に実行）
   */
  register: protectedProcedure
    .input(z.object({
      productId: z.string(),
      photoUrl: z.string().url().optional(),
      ocrText: z.string().optional(),
      matchScore: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // 重複登録チェック
      const alreadyCollected = await isProductCollected(userId, input.productId);
      if (alreadyCollected) {
        throw new TRPCError({ code: "CONFLICT", message: "この商品は既にコレクション登録済みです" });
      }

      // 商品情報を取得
      const product = await getProductById(input.productId);
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "商品が見つかりません" });
      }

      // コレクションに追加
      const BASE_POINTS = 50;
      await addToCollection({
        userId,
        productId: input.productId,
        photoUrl: input.photoUrl,
        ocrText: input.ocrText,
        matchScore: input.matchScore,
        prefecture: product.prefecture,
        region: product.region,
        pointsEarned: BASE_POINTS,
        status: input.photoUrl ? "matched" : "manual",
      });

      // スタンプ更新とランク判定
      const statsUpdate = await updateCollectorStats(userId, product.prefecture, product.region);

      // ポイント付与
      let totalPoints = BASE_POINTS;
      const bonuses: string[] = [];

      if (statsUpdate.prefAdded) {
        totalPoints += 100;
        bonuses.push(`新規都道府県制覇ボーナス +100pt（${product.prefecture}）`);
      }
      if (statsUpdate.regAdded) {
        totalPoints += 200;
        bonuses.push(`新規エリア制覇ボーナス +200pt（${product.region}）`);
      }
      if (statsUpdate.rankChanged) {
        totalPoints += 500;
        bonuses.push(`ランクアップボーナス +500pt`);
      }

      await awardPoints({
        userId,
        points: totalPoints,
        type: "earn_bonus",
        referenceType: "collection",
        referenceId: input.productId,
        description: `お土産登録: ${product.name} +${totalPoints}pt`,
      });

      return {
        success: true,
        pointsEarned: totalPoints,
        bonuses,
        rankChanged: statsUpdate.rankChanged,
        newRank: statsUpdate.newRank,
        prefecturesCount: statsUpdate.prefecturesCount,
        product,
      };
    }),

  /**
   * 都道府県別コレクション一覧を取得
   */
  listByPrefecture: protectedProcedure.query(async ({ ctx }) => {
    const grouped = await getCollectionsByPrefecture(ctx.user.id);
    // 各グループの商品情報を付与
    const result: Record<string, Array<{ id: number; productId: string; photoUrl: string | null; prefecture: string; region: string; createdAt: Date; product: Awaited<ReturnType<typeof getProductById>> }>> = {};
    for (const [pref, items] of Object.entries(grouped)) {
      result[pref] = await Promise.all(
        items.map(async (item) => ({
          ...item,
          product: await getProductById(item.productId),
        }))
      );
    }
    return result;
  }),

  /**
   * みんなが買ったお土産ランキング（同じ商品を買ったコレクター数順）
   */
  popularRanking: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async ({ input }) => {
      const ranking = await getTopCollectedProducts(input.limit);
      const withProducts = await Promise.all(
        ranking.map(async (r) => ({
          ...r,
          product: await getProductById(r.productId),
        }))
      );
      return withProducts.filter((r) => r.product !== null);
    }),

  /**
   * 手動登録（写真なし）
   */
  registerManual: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const alreadyCollected = await isProductCollected(userId, input.productId);
      if (alreadyCollected) {
        throw new TRPCError({ code: "CONFLICT", message: "この商品は既にコレクション登録済みです" });
      }
      const product = await getProductById(input.productId);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "商品が見つかりません" });

      await addToCollection({
        userId,
        productId: input.productId,
        prefecture: product.prefecture,
        region: product.region,
        pointsEarned: 30,
        status: "manual",
      });
      const statsUpdate = await updateCollectorStats(userId, product.prefecture, product.region);

      await awardPoints({
        userId,
        points: 30,
        type: "earn_bonus",
        referenceType: "collection",
        referenceId: input.productId,
        description: `お土産手動登録: ${product.name} +30pt`,
      });

      return {
        success: true,
        pointsEarned: 30,
        rankChanged: statsUpdate.rankChanged,
        newRank: statsUpdate.newRank,
        prefecturesCount: statsUpdate.prefecturesCount,
      };
    }),
});
