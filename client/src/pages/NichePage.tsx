// ============================================================
// Omiyage Go - ニッチ土産特集ページ
// デザイン哲学: 他では見つからない「隠れた逸品」を特集
// 機能: nicheバッジ商品の一覧・都道府県別フィルタ・詳細リンク
// ============================================================
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { trpc } from "@/lib/trpc";
import {
  Sparkles, MapPin, Package, Loader2, ChevronRight,
  ArrowLeft, Star, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

// カテゴリ別フォールバック画像（Unsplash）
const CATEGORY_IMAGES: Record<string, string> = {
  "和菓子": "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=75",
  "洋菓子": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=75",
  "焼き菓子": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=75",
  "煎餅・おかき": "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=75",
  "スナック": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=75",
  "菓子": "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400&q=75",
  "チョコレート": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&q=75",
  "飲料": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=75",
  "海産物": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=75",
  "肉・加工品": "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=75",
  "調味料・ソース": "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400&q=75",
  "麺類": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=75",
  "弁当・惣菜": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=75",
  "食品": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=75",
  "工芸品": "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=75",
  "その他": "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=400&q=75",
};

function getCategoryImage(category: string): string {
  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES["その他"];
}

// 地方タブ
const REGION_TABS = [
  { id: "", label: "全国" },
  { id: "北海道", label: "北海道" },
  { id: "東北", label: "東北" },
  { id: "関東", label: "関東" },
  { id: "中部", label: "中部" },
  { id: "近畿", label: "近畿" },
  { id: "中国", label: "中国" },
  { id: "四国", label: "四国" },
  { id: "九州・沖縄", label: "九州・沖縄" },
];

const ITEMS_PER_PAGE = 30;

export default function NichePage() {
  const [, navigate] = useLocation();
  const [selectedRegion, setSelectedRegion] = useState("");
  const [page, setPage] = useState(0);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // nicheバッジで検索
  const searchInput = useMemo(() => ({
    badges: ["niche"],
    region: selectedRegion || undefined,
    limit: ITEMS_PER_PAGE,
    offset: page * ITEMS_PER_PAGE,
  }), [selectedRegion, page]);

  const { data: searchResult, isLoading, isFetching } = trpc.products.search.useQuery(searchInput);

  // 検索条件変更時にリセット
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setPage(0);
    setAllResults([]);
    setHasMore(true);
  };

  // 結果を蓄積
  useEffect(() => {
    if (!searchResult) return;
    if (page === 0) {
      setAllResults(searchResult.products);
    } else {
      setAllResults(prev => [...prev, ...searchResult.products]);
    }
    setHasMore(searchResult.products.length === ITEMS_PER_PAGE);
  }, [searchResult, page]);

  const loadMore = () => {
    if (!isFetching && hasMore) {
      setPage(p => p + 1);
    }
  };

  const totalCount = searchResult?.total ?? 0;

  return (
    <AppLayout>
      {/* ── ヘッダー ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-stone-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <p className="text-sm font-black text-stone-900">ニッチ土産特集</p>
            </div>
            <p className="text-xs text-stone-500">他では見つからない隠れた逸品</p>
          </div>
        </div>
      </div>

      {/* ── ヒーローバナー ── */}
      <div className="relative bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 px-5 py-8 overflow-hidden">
        {/* 背景装飾 */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white/80 text-xs font-bold uppercase tracking-widest">Niche Picks</span>
          </div>
          <h1 className="text-2xl font-black text-white leading-tight mb-2">
            知る人ぞ知る<br />
            <span className="text-yellow-200">ニッチなお土産</span>
          </h1>
          <p className="text-white/80 text-sm leading-relaxed">
            メジャーではないけれど、地元で愛され続ける本物の味。
            旅先でしか出会えない、ここだけの逸品を集めました。
          </p>
          {!isLoading && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
              <Star className="w-3.5 h-3.5 text-yellow-200" />
              <span className="text-white text-xs font-bold">{totalCount}件の隠れた逸品</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 地方タブ ── */}
      <div className="bg-white border-b border-stone-100 sticky top-[57px] z-10">
        <div className="flex overflow-x-auto scrollbar-hide px-4 py-2 gap-2">
          {REGION_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleRegionChange(tab.id)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                selectedRegion === tab.id
                  ? "bg-orange-500 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-orange-50 hover:text-orange-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 結果カウント ── */}
      <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-100 flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-stone-400" />
        {isLoading && page === 0 ? (
          <p className="text-xs text-stone-500">検索中...</p>
        ) : (
          <p className="text-xs text-stone-600">
            <span className="font-bold text-orange-600">{totalCount}件</span>のニッチ土産
            {selectedRegion && <span className="text-stone-400">（{selectedRegion}）</span>}
          </p>
        )}
      </div>

      {/* ── 商品グリッド ── */}
      <div className="px-4 pb-24 pt-3">
        {isLoading && page === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            <p className="text-sm text-stone-500">ニッチな逸品を探しています...</p>
          </div>
        ) : allResults.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-orange-300" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-stone-700">
                {selectedRegion ? `${selectedRegion}のニッチ土産は準備中です` : "ニッチ土産を準備中です"}
              </p>
              <p className="text-sm text-stone-500 mt-1">
                他の地方も探してみてください
              </p>
            </div>
            <button
              onClick={() => handleRegionChange("")}
              className="px-6 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl"
            >
              全国で探す
            </button>
          </div>
        ) : (
          <>
            {/* カードグリッド（2列） */}
            <div className="grid grid-cols-2 gap-3">
              {allResults.map((product) => (
                <NicheProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* もっと見るボタン */}
            {hasMore && (
              <div className="pt-5 pb-2 text-center">
                <button
                  onClick={loadMore}
                  disabled={isFetching}
                  className="px-6 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      読み込み中...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      もっと見る
                    </>
                  )}
                </button>
              </div>
            )}

            {!hasMore && allResults.length > 0 && (
              <div className="pt-5 pb-2 text-center">
                <p className="text-xs text-stone-400">
                  {allResults.length}件すべて表示しました
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

// ── ニッチ商品カード（2列グリッド用） ────────────────────────────
interface NicheProductCardProps {
  product: {
    id: string;
    name: string;
    brand: string;
    price: number;
    prefecture: string;
    category: string;
    imageUrl: string | null;
    shelfLife: number | null;
    isIndividualPackaged: boolean;
    badges: string | null;
    guaranteeReason: string | null;
  };
}

function NicheProductCard({ product }: NicheProductCardProps) {
  const [, navigate] = useLocation();

  const displayImageUrl = product.imageUrl || getCategoryImage(product.category);

  const guaranteeReasons: string[] = (() => {
    try { return product.guaranteeReason ? JSON.parse(product.guaranteeReason) : []; }
    catch { return []; }
  })();

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
      onClick={() => navigate(`/db-product/${product.id}`)}
    >
      {/* 商品画像 */}
      <div className="relative w-full h-32 bg-stone-100 overflow-hidden">
        <img
          src={displayImageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getCategoryImage("その他");
          }}
        />
        {/* ニッチバッジ */}
        <div className="absolute top-2 left-2">
          <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" />
            ニッチ
          </span>
        </div>
        {/* 産地バッジ */}
        <div className="absolute bottom-2 right-2">
          <span className="px-1.5 py-0.5 bg-black/50 text-white text-[10px] font-medium rounded">
            {product.prefecture === "北海道" ? "北海道" : product.prefecture.replace("県", "").replace("府", "").replace("都", "")}
          </span>
        </div>
      </div>

      {/* 商品情報 */}
      <div className="p-2.5">
        <p className="text-xs font-black text-stone-900 leading-tight line-clamp-2 mb-0.5">
          {product.name}
        </p>
        <p className="text-[10px] text-stone-400 mb-1.5 truncate">{product.brand}</p>

        {/* 保証理由（最初の1件） */}
        {guaranteeReasons.length > 0 && (
          <p className="text-[10px] text-stone-500 line-clamp-2 mb-1.5 leading-tight">
            {guaranteeReasons[0]}
          </p>
        )}

        {/* 価格 */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-orange-600">
            ¥{product.price.toLocaleString()}
          </p>
          {product.shelfLife && product.shelfLife < 9999 && (
            <span className="text-[10px] text-stone-400">
              {product.shelfLife}日
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
