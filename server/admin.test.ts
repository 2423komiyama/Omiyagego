import { describe, it, expect, vi } from "vitest";

/**
 * Admin API Tests
 * Tests for admin-related logic (using mocks to avoid DB dependency in CI)
 */

// ── JSON クリーニングロジックのテスト ─────────────────────────
function cleanGeminiJson(text: string): string {
  let cleaned = text;
  cleaned = cleaned.replace(/\s*\/\/[^\n]*/g, "");
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return cleaned.trim();
}

function parseGeminiData(text: string): unknown[] {
  const cleaned = cleanGeminiJson(text);
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj.products)) return obj.products;
      for (const val of Object.values(obj)) {
        if (Array.isArray(val)) return val;
      }
    }
    if (Array.isArray(parsed)) return parsed;
  } catch {
    try {
      const parsed = JSON.parse("[" + cleaned + "]");
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
  }
  throw new Error("JSONのパースに失敗しました");
}

// ── 商品データ正規化ロジックのテスト ─────────────────────────
interface RawProduct {
  id?: string;
  name?: string;
  brand?: string;
  description?: string;
  price?: number | string;
  imageUrl?: string | null;
  prefecture?: string;
  region?: string;
  category?: string;
  shelfLife?: number | string;
  isIndividualPackaged?: boolean;
  servingSize?: number | string;
  guaranteeReason?: string[] | string;
  makerStory?: string;
  badges?: string[] | string;
}

function normalizeProduct(raw: RawProduct) {
  return {
    name: raw.name || "不明",
    brand: raw.brand || "不明",
    price: Number(raw.price) || 0,
    prefecture: raw.prefecture || "東京都",
    region: raw.region || "関東",
    description: raw.description || "",
    shelfLife: raw.shelfLife ? Number(raw.shelfLife) : 0,
    imageUrl: raw.imageUrl || null,
    category: raw.category || "その他",
    isIndividualPackaged: raw.isIndividualPackaged ?? false,
    servingSize: raw.servingSize ? Number(raw.servingSize) : 1,
    guaranteeReason: Array.isArray(raw.guaranteeReason)
      ? raw.guaranteeReason
      : typeof raw.guaranteeReason === "string"
      ? [raw.guaranteeReason]
      : [],
    makerStory: raw.makerStory || null,
    badges: Array.isArray(raw.badges)
      ? raw.badges
      : typeof raw.badges === "string"
      ? [raw.badges]
      : [],
  };
}

describe("Admin - JSON Cleaning & Parsing", () => {
  it("should remove single-line comments from JSON", () => {
    const input = `{
      // This is a comment
      "name": "test"
    }`;
    const cleaned = cleanGeminiJson(input);
    expect(cleaned).not.toContain("//");
    const parsed = JSON.parse(cleaned);
    expect(parsed.name).toBe("test");
  });

  it("should remove trailing commas from JSON", () => {
    const input = `{"name": "test", "value": 1,}`;
    const cleaned = cleanGeminiJson(input);
    const parsed = JSON.parse(cleaned);
    expect(parsed.name).toBe("test");
    expect(parsed.value).toBe(1);
  });

  it("should parse { products: [...] } format", () => {
    const input = JSON.stringify({
      products: [
        { name: "商品A", brand: "ブランドA", price: 1000 },
        { name: "商品B", brand: "ブランドB", price: 2000 },
      ],
    });
    const result = parseGeminiData(input);
    expect(result).toHaveLength(2);
  });

  it("should parse array format directly", () => {
    const input = JSON.stringify([
      { name: "商品A", brand: "ブランドA", price: 1000 },
    ]);
    const result = parseGeminiData(input);
    expect(result).toHaveLength(1);
  });

  it("should parse JSON with comments and trailing commas", () => {
    const input = `{
      // Gemini generated data
      "products": [
        {
          "name": "白い恋人", // 北海道の定番
          "brand": "石屋製菓",
          "price": 1296,
        },
      ]
    }`;
    const result = parseGeminiData(input);
    expect(result).toHaveLength(1);
    expect((result[0] as RawProduct).name).toBe("白い恋人");
  });

  it("should throw error for completely invalid JSON", () => {
    expect(() => parseGeminiData("not json at all !!!")).toThrow();
  });
});

describe("Admin - Product Normalization", () => {
  it("should normalize a complete product", () => {
    const raw: RawProduct = {
      id: "p-hokkaido-001",
      name: "白い恋人",
      brand: "石屋製菓",
      description: "北海道の定番土産",
      price: 1296,
      prefecture: "北海道",
      region: "北海道",
      category: "洋菓子",
      shelfLife: 90,
      isIndividualPackaged: true,
      servingSize: 18,
      guaranteeReason: ["個包装で配りやすい", "全国的知名度No.1"],
      makerStory: "1976年創業の石屋製菓",
      badges: ["bestseller", "editorial"],
    };
    const result = normalizeProduct(raw);
    expect(result.name).toBe("白い恋人");
    expect(result.price).toBe(1296);
    expect(result.guaranteeReason).toHaveLength(2);
    expect(result.badges).toHaveLength(2);
  });

  it("should use defaults for missing fields", () => {
    const raw: RawProduct = { name: "テスト商品" };
    const result = normalizeProduct(raw);
    expect(result.brand).toBe("不明");
    expect(result.price).toBe(0);
    expect(result.prefecture).toBe("東京都");
    expect(result.region).toBe("関東");
    expect(result.category).toBe("その他");
    expect(result.isIndividualPackaged).toBe(false);
    expect(result.guaranteeReason).toEqual([]);
    expect(result.badges).toEqual([]);
  });

  it("should convert string price to number", () => {
    const raw: RawProduct = { name: "商品", brand: "ブランド", price: "1500" };
    const result = normalizeProduct(raw);
    expect(result.price).toBe(1500);
    expect(typeof result.price).toBe("number");
  });

  it("should convert string guaranteeReason to array", () => {
    const raw: RawProduct = { name: "商品", guaranteeReason: "美味しい" };
    const result = normalizeProduct(raw);
    expect(Array.isArray(result.guaranteeReason)).toBe(true);
    expect(result.guaranteeReason).toEqual(["美味しい"]);
  });

  it("should convert string badges to array", () => {
    const raw: RawProduct = { name: "商品", badges: "bestseller" };
    const result = normalizeProduct(raw);
    expect(Array.isArray(result.badges)).toBe(true);
    expect(result.badges).toEqual(["bestseller"]);
  });

  it("should handle null imageUrl", () => {
    const raw: RawProduct = { name: "商品", imageUrl: null };
    const result = normalizeProduct(raw);
    expect(result.imageUrl).toBeNull();
  });
});

describe("Admin - Batch Processing Logic", () => {
  it("should split products into batches of 50", () => {
    const products = Array.from({ length: 130 }, (_, i) => ({
      name: `商品${i + 1}`,
      brand: "ブランド",
      price: 1000,
    }));

    const BATCH_SIZE = 50;
    const batches: unknown[][] = [];
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      batches.push(products.slice(i, i + BATCH_SIZE));
    }

    expect(batches).toHaveLength(3);
    expect(batches[0]).toHaveLength(50);
    expect(batches[1]).toHaveLength(50);
    expect(batches[2]).toHaveLength(30);
  });

  it("should calculate progress correctly", () => {
    const total = 100;
    const processed = 75;
    const progress = (processed / total) * 100;
    expect(progress).toBe(75);
  });
});

// ── DB商品詳細ページのデータ処理ロジックのテスト ─────────────────
describe("DBProductDetail - Data Parsing", () => {
  function parseBadges(badgesStr: string | null): string[] {
    try { return badgesStr ? JSON.parse(badgesStr) : []; }
    catch { return []; }
  }

  function parseGuaranteeReasons(reasonStr: string | null): string[] {
    try { return reasonStr ? JSON.parse(reasonStr) : []; }
    catch { return []; }
  }

  function formatShelfLife(days: number | null): string {
    if (!days) return "要確認";
    if (days >= 9999) return "長期保存可";
    return `${days}日`;
  }

  it("should parse badges JSON string", () => {
    const badges = parseBadges('["popular","regional","niche"]');
    expect(badges).toHaveLength(3);
    expect(badges).toContain("popular");
    expect(badges).toContain("niche");
  });

  it("should return empty array for null badges", () => {
    const badges = parseBadges(null);
    expect(badges).toEqual([]);
  });

  it("should return empty array for invalid badges JSON", () => {
    const badges = parseBadges("invalid json");
    expect(badges).toEqual([]);
  });

  it("should parse guarantee reasons JSON string", () => {
    const reasons = parseGuaranteeReasons('["理由1","理由2"]');
    expect(reasons).toHaveLength(2);
    expect(reasons[0]).toBe("理由1");
  });

  it("should format shelf life correctly", () => {
    expect(formatShelfLife(30)).toBe("30日");
    expect(formatShelfLife(9999)).toBe("長期保存可");
    expect(formatShelfLife(null)).toBe("要確認");
    expect(formatShelfLife(7)).toBe("7日");
  });

  it("should handle product with all fields", () => {
    const product = {
      id: "prod-test-001",
      name: "元祖紅いもタルト",
      brand: "御菓子御殿",
      price: 1200,
      prefecture: "沖縄県",
      region: "九州・沖縄",
      category: "菓子",
      description: "沖縄県産紅芋を100%使用したタルト",
      imageUrl: null,
      shelfLife: 30,
      isIndividualPackaged: true,
      badges: '["popular","regional"]',
      guaranteeReason: '["沖縄県産紅芋100%使用","モンドセレクション受賞"]',
      makerStory: null,
    };

    const badges = parseBadges(product.badges);
    const reasons = parseGuaranteeReasons(product.guaranteeReason);
    const shelfLabel = formatShelfLife(product.shelfLife);

    expect(badges).toContain("popular");
    expect(reasons).toHaveLength(2);
    expect(shelfLabel).toBe("30日");
    expect(product.isIndividualPackaged).toBe(true);
  });
});
