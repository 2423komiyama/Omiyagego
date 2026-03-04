// ============================================================
// Omiyage Go - DB商品詳細ページ
// デザイン哲学: 駅案内板スタイル - 商品情報を最短で伝える
// 機能: DBから商品情報を取得・表示、売り場情報、保証理由
// ============================================================
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, Package, MapPin, Clock, Tag, Star,
  ShoppingBag, Gift, ChevronRight, Loader2, AlertCircle,
  CheckCircle2, Store
} from "lucide-react";
import { cn } from "@/lib/utils";

// バッジ表示設定
const BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  editorial: { label: "編集部推薦", className: "bg-amber-100 text-amber-700" },
  popular: { label: "人気", className: "bg-red-100 text-red-700" },
  limited: { label: "限定", className: "bg-purple-100 text-purple-700" },
  new: { label: "新商品", className: "bg-blue-100 text-blue-700" },
  regional: { label: "地元産", className: "bg-green-100 text-green-700" },
  niche: { label: "ニッチ", className: "bg-orange-100 text-orange-700" },
  bestseller: { label: "ベストセラー", className: "bg-red-100 text-red-700" },
  local: { label: "地元産", className: "bg-green-100 text-green-700" },
};

export default function DBProductDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const productId = params.id;

  const { data: product, isLoading, error } = trpc.products.get.useQuery(
    { id: productId },
    { enabled: !!productId }
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-sm text-stone-500">商品情報を読み込み中...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !product) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4 px-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-stone-700">商品が見つかりませんでした</p>
            <p className="text-sm text-stone-500 mt-1">
              {error?.message || "この商品は存在しないか、削除された可能性があります"}
            </p>
          </div>
          <button
            onClick={() => navigate("/db-search")}
            className="px-6 py-2.5 bg-emerald-700 text-white text-sm font-bold rounded-xl"
          >
            検索に戻る
          </button>
        </div>
      </AppLayout>
    );
  }

  // バッジ・保証理由をパース
  const badges: string[] = (() => {
    try { return product.badges ? JSON.parse(product.badges) : []; }
    catch { return []; }
  })();

  const guaranteeReasons: string[] = (() => {
    try { return product.guaranteeReason ? JSON.parse(product.guaranteeReason) : []; }
    catch { return []; }
  })();

  return (
    <AppLayout>
      {/* ── ヘッダー ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/db-search")}
            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-stone-600" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-stone-900 truncate">{product.name}</p>
            <p className="text-xs text-stone-500">{product.prefecture}</p>
          </div>
        </div>
      </div>

      <div className="pb-24">
        {/* ── 商品画像 ── */}
        <div className="relative w-full h-56 bg-stone-100 overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.classList.add("flex", "items-center", "justify-center");
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-stone-300" />
            </div>
          )}
          {/* グラデーションオーバーレイ */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          {/* バッジ */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            {badges.map((badge) => {
              const config = BADGE_CONFIG[badge];
              if (!config) return null;
              return (
                <span
                  key={badge}
                  className={cn("px-2 py-0.5 text-xs font-bold rounded-full", config.className)}
                >
                  {config.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* ── 商品基本情報 ── */}
        <div className="px-4 pt-4 pb-3 border-b border-stone-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xl font-black text-stone-900 leading-tight">{product.name}</p>
              <p className="text-sm text-stone-500 mt-0.5">{product.brand}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-2xl font-black text-emerald-700">
                ¥{product.price.toLocaleString()}
              </p>
              <p className="text-xs text-stone-400">税込</p>
            </div>
          </div>

          {/* タグ行 */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
              <MapPin className="w-3 h-3" />
              {product.prefecture}
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 bg-stone-100 text-stone-600 text-xs font-medium rounded-full">
              <Tag className="w-3 h-3" />
              {product.category}
            </span>
            {product.shelfLife && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-stone-100 text-stone-600 text-xs font-medium rounded-full">
                <Clock className="w-3 h-3" />
                日持ち{product.shelfLife >= 9999 ? "長期" : `${product.shelfLife}日`}
              </span>
            )}
            {product.isIndividualPackaged && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                <Gift className="w-3 h-3" />
                個包装
              </span>
            )}
          </div>
        </div>

        {/* ── 商品説明 ── */}
        {product.description && (
          <div className="px-4 py-4 border-b border-stone-100">
            <h2 className="text-sm font-bold text-stone-700 mb-2 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              商品について
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* ── 保証理由 ── */}
        {guaranteeReasons.length > 0 && (
          <div className="px-4 py-4 border-b border-stone-100">
            <h2 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500" />
              このお土産が選ばれる理由
            </h2>
            <div className="space-y-2">
              {guaranteeReasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-stone-700">{reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── メーカーストーリー ── */}
        {product.makerStory && (
          <div className="px-4 py-4 border-b border-stone-100">
            <h2 className="text-sm font-bold text-stone-700 mb-2 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-600" />
              メーカーについて
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">{product.makerStory}</p>
          </div>
        )}

        {/* ── 商品スペック ── */}
        <div className="px-4 py-4 border-b border-stone-100">
          <h2 className="text-sm font-bold text-stone-700 mb-3">商品スペック</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-xs text-stone-500 mb-1">価格</p>
              <p className="text-base font-black text-stone-900">¥{product.price.toLocaleString()}</p>
            </div>
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-xs text-stone-500 mb-1">日持ち</p>
              <p className="text-base font-black text-stone-900">
                {product.shelfLife
                  ? product.shelfLife >= 9999
                    ? "長期保存可"
                    : `${product.shelfLife}日`
                  : "要確認"}
              </p>
            </div>
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-xs text-stone-500 mb-1">カテゴリ</p>
              <p className="text-base font-black text-stone-900">{product.category}</p>
            </div>
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-xs text-stone-500 mb-1">個包装</p>
              <p className="text-base font-black text-stone-900">
                {product.isIndividualPackaged ? "あり" : "なし"}
              </p>
            </div>
          </div>
        </div>

        {/* ── 地域情報 ── */}
        <div className="px-4 py-4 border-b border-stone-100">
          <h2 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-600" />
            産地・地域
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900">{product.prefecture}</p>
              <p className="text-xs text-stone-500">{product.region}</p>
            </div>
          </div>
        </div>

        {/* ── 同じ都道府県のお土産を探す ── */}
        <div className="px-4 py-4">
          <button
            onClick={() => navigate(`/db-search?prefecture=${encodeURIComponent(product.prefecture)}`)}
            className="w-full flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 hover:bg-emerald-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-bold text-emerald-800">
                {product.prefecture}の他のお土産を見る
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
