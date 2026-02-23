// ============================================================
// Omiyage Go - 検索結果画面（カード一覧）
// デザイン哲学: 候補を3〜10件に絞り、詳細へ誘導
// ============================================================
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, SlidersHorizontal, X } from "lucide-react";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { ProductCard } from "@/components/omiyage/ProductCard";
import { ConstraintChip } from "@/components/omiyage/Badges";
import { useSearch } from "@/contexts/SearchContext";
import { filterProducts, PRODUCTS, FACILITIES } from "@/lib/mockData";
import { cn } from "@/lib/utils";

type SortType = "guarantee" | "near" | "crowd";

const SORT_OPTIONS: { value: SortType; label: string }[] = [
  { value: "guarantee", label: "保証度" },
  { value: "near", label: "近い" },
  { value: "crowd", label: "混雑少" },
];

export default function Results() {
  const [, navigate] = useLocation();
  const { conditions, updateCondition } = useSearch();
  const [sortBy, setSortBy] = useState<SortType>("guarantee");

  const filteredProducts = useMemo(() => {
    return filterProducts(conditions);
  }, [conditions]);

  // 並び替えロジック
  const sortedProducts = useMemo(() => {
    const arr = [...filteredProducts];
    if (sortBy === "near") {
      return arr.sort(
        (a, b) =>
          (a.sellers[0]?.walkingMinutes ?? 99) -
          (b.sellers[0]?.walkingMinutes ?? 99)
      );
    }
    if (sortBy === "crowd") {
      const crowdOrder = { 少: 0, 中: 1, 多: 2 };
      return arr.sort(
        (a, b) =>
          crowdOrder[a.sellers[0]?.crowdLevel ?? "多"] -
          crowdOrder[b.sellers[0]?.crowdLevel ?? "多"]
      );
    }
    // guarantee: 保証理由の数が多い順
    return arr.sort(
      (a, b) => b.guaranteeReasons.length - a.guaranteeReasons.length
    );
  }, [filteredProducts, sortBy]);

  // 条件チップ表示用
  const activeChips: { label: string; key: keyof typeof conditions }[] = [];
  if (conditions.purpose) activeChips.push({ label: conditions.purpose, key: "purpose" });
  if (conditions.budget) activeChips.push({ label: `〜${conditions.budget.toLocaleString()}円`, key: "budget" });
  if (conditions.shelfLife !== null) {
    const label = conditions.shelfLife === 0 ? "当日" : `日持ち${conditions.shelfLife}日`;
    activeChips.push({ label, key: "shelfLife" });
  }
  if (conditions.individuallyWrapped === true) activeChips.push({ label: "個包装必須", key: "individuallyWrapped" });
  if (conditions.count) activeChips.push({ label: `${conditions.count}人向け`, key: "count" });
  if (conditions.temperature) activeChips.push({ label: conditions.temperature, key: "temperature" });
  if (conditions.facilityId && conditions.facilityId !== "all") {
    const facility = FACILITIES.find((f) => f.id === conditions.facilityId);
    if (facility) activeChips.push({ label: facility.shortLabel, key: "facilityId" });
  }

  return (
    <AppLayout>
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/conditions")}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100"
          >
            <ChevronLeft className="w-5 h-5 text-stone-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-black text-stone-900">検索結果</h1>
            <p className="text-xs text-stone-500">
              {sortedProducts.length}件の候補
            </p>
          </div>
          <button
            onClick={() => navigate("/conditions")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 rounded-lg text-xs font-bold text-stone-600"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            条件変更
          </button>
        </div>

        {/* 条件チップ */}
        {activeChips.length > 0 && (
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => updateCondition(chip.key, null as any)}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-medium text-emerald-800"
              >
                {chip.label}
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}

        {/* 並び替え */}
        <div className="px-4 pb-3 flex gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                sortBy === opt.value
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-6">
        {/* 0件エラー */}
        {sortedProducts.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-base font-black text-stone-900 mb-2">
              条件に合う候補が見つかりませんでした
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              条件を少し緩めると見つかる可能性があります
            </p>
            <div className="space-y-2.5">
              {conditions.individuallyWrapped === true && (
                <button
                  onClick={() => updateCondition("individuallyWrapped", null)}
                  className="w-full py-3 px-4 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  個包装を「どちらでも」にする
                </button>
              )}
              {conditions.budget !== null && (
                <button
                  onClick={() => {
                    const budgets = [1000, 2000, 3000, 5000];
                    const idx = budgets.indexOf(conditions.budget!);
                    if (idx < budgets.length - 1) {
                      updateCondition("budget", budgets[idx + 1] as any);
                    } else {
                      updateCondition("budget", null);
                    }
                  }}
                  className="w-full py-3 px-4 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  予算を広げる
                </button>
              )}
              {conditions.shelfLife !== null && (
                <button
                  onClick={() => updateCondition("shelfLife", null)}
                  className="w-full py-3 px-4 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  日持ち条件を外す
                </button>
              )}
              <button
                onClick={() => navigate("/conditions")}
                className="w-full py-3 px-4 bg-emerald-700 rounded-xl text-sm font-bold text-white hover:bg-emerald-800 transition-colors"
              >
                条件を変更する
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
