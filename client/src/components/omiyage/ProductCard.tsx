// ============================================================
// Omiyage Go - 商品カードコンポーネント（切符スタイル）
// デザイン哲学: 左端カラーバーの切符スタイル
// ============================================================
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import type { Product } from "@/lib/mockData";
import { RecommendBadge, ConstraintChip, BuyNowTag } from "./Badges";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [, navigate] = useLocation();

  const getChips = (p: Product) => {
    const chips: string[] = [];
    chips.push(`日持ち${p.shelfLifeDays}日`);
    if (p.individuallyWrapped) chips.push("個包装");
    chips.push(`${p.recommendedCount}人向け`);
    return chips.slice(0, 3);
  };

  const primarySeller = product.sellers[0];

  return (
    <div
      className={cn(
        "relative bg-white rounded-xl overflow-hidden shadow-sm border border-stone-200 cursor-pointer",
        "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
        "active:scale-[0.98]",
        className
      )}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* 切符スタイル - 左端カラーバー */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1.5",
          product.stockStatus === "soldout_risk"
            ? "bg-amber-400"
            : "bg-emerald-700"
        )}
      />

      <div className="pl-4 pr-4 pt-4 pb-3">
        {/* 上段: 画像 + 基本情報 */}
        <div className="flex gap-3">
          {/* 商品画像 */}
          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-stone-100">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* 右側情報 */}
          <div className="flex-1 min-w-0">
            {/* バッジ */}
            <div className="flex flex-wrap gap-1 mb-1.5">
              {product.badges.map((badge, i) => (
                <RecommendBadge
                  key={badge}
                  type={badge}
                  label={product.badgeLabels[i]}
                />
              ))}
            </div>

            {/* 商品名 */}
            <h3 className="text-sm font-bold text-stone-900 leading-snug line-clamp-2">
              {product.name}
            </h3>

            {/* 価格 */}
            <p className="text-base font-black text-stone-900 mt-1 tabular-nums">
              {product.priceLabel}
            </p>
          </div>
        </div>

        {/* 制約チップ */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {getChips(product).map((chip) => (
            <ConstraintChip key={chip} label={chip} />
          ))}
        </div>

        {/* 保証ひとこと */}
        <p className="mt-2 text-xs text-stone-600 leading-relaxed line-clamp-2">
          {product.guaranteeOneLiner}
        </p>

        {/* 今買えるタグ */}
        {primarySeller && (
          <div className="mt-2.5">
            <BuyNowTag
              facilityName={primarySeller.facilityName}
              gateStatus={primarySeller.gateStatus}
              walkingMinutes={primarySeller.walkingMinutes}
            />
          </div>
        )}

        {/* 売り切れリスク */}
        {product.stockStatus === "soldout_risk" && (
          <div className="mt-2 flex items-center gap-1.5 bg-amber-50 rounded-lg px-2.5 py-1.5">
            <span className="text-amber-500 text-xs">⚠️</span>
            <span className="text-xs font-bold text-amber-700">在庫：要確認</span>
          </div>
        )}
      </div>
    </div>
  );
}
