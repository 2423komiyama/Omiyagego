// ============================================================
// Omiyage Go - 「探す」フリーワード検索画面
// デザイン哲学: 駅案内板スタイル - 検索速度最優先
// 機能: リアルタイム検索・施設フィルタ・カテゴリフィルタ・価格帯フィルタ
// ============================================================
import { useState, useMemo, useRef, useEffect } from "react";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { ProductCard } from "@/components/omiyage/ProductCard";
import {
  PRODUCTS,
  FACILITIES,
  CATEGORY_LIST,
  searchProducts,
  type FacilityId,
} from "@/lib/mockData";
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

// ── 人気キーワード ──────────────────────────────────────────────
const POPULAR_KEYWORDS = [
  "バター", "チョコレート", "フィナンシェ", "クッキー", "和菓子",
  "個包装", "日持ち", "改札内", "羽田空港", "東京駅",
];

// ── 価格帯フィルタ ──────────────────────────────────────────────
const PRICE_FILTERS = [
  { label: "すべて", max: Infinity },
  { label: "〜1,000円", max: 1000 },
  { label: "〜2,000円", max: 2000 },
  { label: "〜3,000円", max: 3000 },
  { label: "〜5,000円", max: 5000 },
];

// ── 日持ちフィルタ ──────────────────────────────────────────────
const SHELF_FILTERS = [
  { label: "すべて", min: 0 },
  { label: "3日以上", min: 3 },
  { label: "7日以上", min: 7 },
  { label: "14日以上", min: 14 },
  { label: "30日以上", min: 30 },
];

// ── ソート ──────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: "recommend", label: "おすすめ順" },
  { id: "price_asc", label: "価格が安い順" },
  { id: "price_desc", label: "価格が高い順" },
  { id: "shelf_desc", label: "日持ちが長い順" },
];

export default function SearchPage() {
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // 検索状態
  const [query, setQuery] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<FacilityId | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [selectedPriceMax, setSelectedPriceMax] = useState<number>(Infinity);
  const [selectedShelfMin, setSelectedShelfMin] = useState<number>(0);
  const [individuallyWrapped, setIndividuallyWrapped] = useState(false);
  const [sortId, setSortId] = useState("recommend");
  const [showFilters, setShowFilters] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // 検索結果
  const results = useMemo(() => {
    let list = searchProducts(query, selectedFacility, selectedCategory);
    // 価格フィルタ
    if (selectedPriceMax !== Infinity) {
      list = list.filter((p) => p.price <= selectedPriceMax);
    }
    // 日持ちフィルタ
    if (selectedShelfMin > 0) {
      list = list.filter((p) => p.shelfLifeDays >= selectedShelfMin);
    }
    // 個包装フィルタ
    if (individuallyWrapped) {
      list = list.filter((p) => p.individuallyWrapped);
    }
    // ソート
    switch (sortId) {
      case "price_asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "shelf_desc":
        list = [...list].sort((a, b) => b.shelfLifeDays - a.shelfLifeDays);
        break;
      default:
        break;
    }
    return list;
  }, [query, selectedFacility, selectedCategory, selectedPriceMax, selectedShelfMin, individuallyWrapped, sortId]);

  // アクティブなフィルタ数
  const activeFilterCount = [
    selectedFacility !== null,
    selectedCategory !== "すべて",
    selectedPriceMax !== Infinity,
    selectedShelfMin > 0,
    individuallyWrapped,
  ].filter(Boolean).length;

  const clearAll = () => {
    setQuery("");
    setSelectedFacility(null);
    setSelectedCategory("すべて");
    setSelectedPriceMax(Infinity);
    setSelectedShelfMin(0);
    setIndividuallyWrapped(false);
    setSortId("recommend");
    inputRef.current?.focus();
  };

  const hasQuery = query.trim().length > 0;
  const showSuggestions = isFocused && !hasQuery;

  return (
    <AppLayout>
      {/* ── 検索バー（スティッキー） ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-stone-100 shadow-sm">
        <div className="px-4 pt-4 pb-3">
          {/* 検索入力 */}
          <div
            className={cn(
              "flex items-center gap-2 bg-stone-100 rounded-2xl px-4 py-3 transition-all",
              isFocused && "bg-white ring-2 ring-emerald-600 shadow-sm"
            )}
          >
            <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 150)}
              placeholder="商品名・ブランド・施設名で検索"
              className="flex-1 bg-transparent text-sm text-stone-900 placeholder-stone-400 outline-none"
            />
            {hasQuery && (
              <button
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="w-5 h-5 rounded-full bg-stone-400 flex items-center justify-center flex-shrink-0"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>

          {/* フィルタ行 */}
          <div className="flex items-center gap-2 mt-3">
            {/* フィルタ開閉ボタン */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                showFilters || activeFilterCount > 0
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-white text-stone-600 border-stone-200"
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              絞り込み
              {activeFilterCount > 0 && (
                <span className="bg-white text-emerald-700 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* ソート */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex gap-1.5">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSortId(opt.id)}
                    className={cn(
                      "whitespace-nowrap px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      sortId === opt.id
                        ? "bg-stone-800 text-white border-stone-800"
                        : "bg-white text-stone-500 border-stone-200"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── フィルタパネル（展開） ── */}
        {showFilters && (
          <div className="px-4 pb-4 bg-stone-50 border-t border-stone-100 space-y-4">
            {/* 施設 */}
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mt-3 mb-2">施設</p>
              <div className="flex flex-wrap gap-1.5">
                {FACILITIES.filter((f) => f.id !== "all").map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFacility(selectedFacility === f.id ? null : f.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      selectedFacility === f.id
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-white text-stone-600 border-stone-200"
                    )}
                  >
                    {f.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* カテゴリ */}
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">カテゴリ</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_LIST.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      selectedCategory === cat
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-stone-600 border-stone-200"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 価格帯 */}
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">価格帯</p>
              <div className="flex flex-wrap gap-1.5">
                {PRICE_FILTERS.map((pf) => (
                  <button
                    key={pf.label}
                    onClick={() => setSelectedPriceMax(pf.max)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      selectedPriceMax === pf.max
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-white text-stone-600 border-stone-200"
                    )}
                  >
                    {pf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 日持ち */}
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">日持ち</p>
              <div className="flex flex-wrap gap-1.5">
                {SHELF_FILTERS.map((sf) => (
                  <button
                    key={sf.label}
                    onClick={() => setSelectedShelfMin(sf.min)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      selectedShelfMin === sf.min
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-white text-stone-600 border-stone-200"
                    )}
                  >
                    {sf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 個包装 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-stone-800">個包装のみ</p>
                <p className="text-xs text-stone-500">配布・ばらまきに便利</p>
              </div>
              <button
                onClick={() => setIndividuallyWrapped(!individuallyWrapped)}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  individuallyWrapped ? "bg-emerald-600" : "bg-stone-200"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                    individuallyWrapped ? "translate-x-6" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>

            {/* リセット */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="w-full py-2 text-xs font-bold text-stone-500 border border-stone-200 rounded-xl hover:bg-stone-100 transition-colors"
              >
                すべてリセット
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 人気キーワード（未入力時） ── */}
      {showSuggestions && (
        <div className="px-4 py-4 bg-white border-b border-stone-100">
          <p className="text-xs font-bold text-stone-500 mb-3">人気のキーワード</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_KEYWORDS.map((kw) => (
              <button
                key={kw}
                onClick={() => { setQuery(kw); setIsFocused(false); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 rounded-full text-sm text-stone-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                <Search className="w-3 h-3 text-stone-400" />
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 検索結果ヘッダー ── */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          {hasQuery ? (
            <p className="text-sm font-bold text-stone-800">
              「<span className="text-emerald-700">{query}</span>」の検索結果
            </p>
          ) : (
            <p className="text-sm font-bold text-stone-800">
              {selectedFacility
                ? `${FACILITIES.find((f) => f.id === selectedFacility)?.shortLabel} のお土産`
                : selectedCategory !== "すべて"
                ? `${selectedCategory} 一覧`
                : "すべてのお土産"}
            </p>
          )}
          <p className="text-xs text-stone-500 mt-0.5">{results.length}件</p>
        </div>
        {(hasQuery || activeFilterCount > 0) && (
          <button
            onClick={clearAll}
            className="text-xs text-stone-400 hover:text-stone-600 underline"
          >
            クリア
          </button>
        )}
      </div>

      {/* ── 施設クイックフィルタ（スクロール） ── */}
      {!showFilters && (
        <div className="px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFacility(null)}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex-shrink-0",
                selectedFacility === null
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-white text-stone-600 border-stone-200"
              )}
            >
              すべて
            </button>
            {FACILITIES.filter((f) => f.id !== "all").map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFacility(selectedFacility === f.id ? null : f.id)}
                className={cn(
                  "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex-shrink-0",
                  selectedFacility === f.id
                    ? "bg-emerald-700 text-white border-emerald-700"
                    : "bg-white text-stone-600 border-stone-200"
                )}
              >
                {f.shortLabel}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── カテゴリクイックフィルタ ── */}
      {!showFilters && (
        <div className="px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2">
            {CATEGORY_LIST.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex-shrink-0",
                  selectedCategory === cat
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-stone-600 border-stone-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 検索結果リスト ── */}
      <div className="px-4 pb-24 space-y-3">
        {results.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
              <Search className="w-8 h-8 text-stone-300" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-stone-700">
                {hasQuery ? `「${query}」は見つかりませんでした` : "条件に合うお土産がありません"}
              </p>
              <p className="text-sm text-stone-500 mt-1">
                キーワードを変えるか、絞り込みを緩めてみてください
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {hasQuery && (
                <button
                  onClick={() => setQuery("")}
                  className="py-2.5 bg-emerald-700 text-white text-sm font-bold rounded-xl"
                >
                  キーワードをクリア
                </button>
              )}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAll}
                  className="py-2.5 bg-stone-100 text-stone-700 text-sm font-bold rounded-xl"
                >
                  絞り込みをリセット
                </button>
              )}
              <button
                onClick={() => navigate("/conditions")}
                className="py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl"
              >
                条件から探す
              </button>
            </div>
          </div>
        ) : (
          <>
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}

            {/* 全件表示後のCTA */}
            {results.length > 0 && (
              <div className="pt-4 pb-2 text-center">
                <p className="text-xs text-stone-400 mb-3">
                  {results.length}件すべて表示しました
                </p>
                <button
                  onClick={() => navigate("/conditions")}
                  className="px-6 py-2.5 bg-emerald-700 text-white text-sm font-bold rounded-xl"
                >
                  条件を指定して絞り込む
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
