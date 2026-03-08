// ============================================================
// Omiyage Go - データベース検索ページ（強化版）
// 機能: リアルタイム検索・地方/用途/日持ち/個包装フィルタ・ソート・いいね・共有
// ============================================================
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { trpc } from "@/lib/trpc";
import {
  Search, X, SlidersHorizontal, ChevronDown, ChevronUp, MapPin, Loader2,
  Package, Heart, Share2, Clock, CheckSquare, ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useDebounce } from "@/hooks/useDebounce";
import { Helmet } from "react-helmet-async";

// ── 価格帯フィルタ ──────────────────────────────────────────────
const PRICE_FILTERS = [
  { label: "すべて", max: undefined },
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

// ── 地方タブ ──────────────────────────────────────────────────
const REGION_TABS = [
  { id: "", label: "全国" },
  { id: "北海道", label: "北海道" },
  { id: "東北", label: "東北" },
  { id: "関東", label: "関東" },
  { id: "中部", label: "中部" },
  { id: "近畿", label: "近畿" },
  { id: "中国", label: "中国" },
  { id: "四国", label: "四国" },
  { id: "九州・沖縄", label: "九州" },
];

// ── 用途タグ ──────────────────────────────────────────────────
const PURPOSE_TAGS = [
  { id: "", label: "すべて" },
  { id: "greeting", label: "挨拶" },
  { id: "thanks", label: "御礼" },
  { id: "apology", label: "お詫び" },
  { id: "office", label: "社内配布" },
  { id: "snack", label: "差し入れ" },
  { id: "self", label: "自分用" },
  { id: "family", label: "家族へ" },
  { id: "kids", label: "子供向け" },
];

// ── ソート順 ──────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: "popular", label: "人気順" },
  { id: "editorial", label: "おすすめ順" },
  { id: "shelf_life_desc", label: "日持ち長い順" },
  { id: "price_asc", label: "価格が安い順" },
  { id: "newest", label: "新着順" },
] as const;

// ── 人気キーワード ──────────────────────────────────────────────
const POPULAR_KEYWORDS = [
  "白い恋人", "バターサンド", "チョコレート", "フィナンシェ", "クッキー",
  "和菓子", "個包装", "日持ち", "北海道", "京都", "大阪", "沖縄", "博多",
  "温泉まんじゅう", "かまぼこ", "牛タン", "明太子",
];

const ITEMS_PER_PAGE = 20;

// ── セッションID生成（匿名いいね用） ──────────────────────────
function getSessionId(): string {
  let sid = localStorage.getItem("omiyage_session_id");
  if (!sid) {
    sid = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("omiyage_session_id", sid);
  }
  return sid;
}

export default function DBSearchPage() {
  const [, navigate] = useLocation();

  // 検索状態
  const [query, setQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedPrefecture, setSelectedPrefecture] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPriceMax, setSelectedPriceMax] = useState<number | undefined>(undefined);
  const [selectedShelfMin, setSelectedShelfMin] = useState<number>(0);
  const [selectedPurposeTag, setSelectedPurposeTag] = useState("");
  const [isIndividualPackaged, setIsIndividualPackaged] = useState(false);
  const [sortBy, setSortBy] = useState<"popular" | "editorial" | "shelf_life_desc" | "price_asc" | "newest">("popular");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [page, setPage] = useState(0);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const debouncedQuery = useDebounce(query, 400);

  // URLクエリパラメータから初期値を設定
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const pref = params.get("prefecture");
    const region = params.get("region");
    const cat = params.get("category");
    const purposeTag = params.get("purposeTag");
    const minShelfLife = params.get("minShelfLife");
    const indivPkg = params.get("isIndividualPackaged");
    const sort = params.get("sortBy");
    if (q) setQuery(q);
    if (pref) setSelectedPrefecture(pref);
    if (region) setSelectedRegion(region);
    if (cat) setSelectedCategory(cat);
    if (purposeTag) setSelectedPurposeTag(purposeTag);
    if (minShelfLife) setSelectedShelfMin(Number(minShelfLife));
    if (indivPkg === "true") setIsIndividualPackaged(true);
    if (sort && SORT_OPTIONS.some(o => o.id === sort)) setSortBy(sort as typeof sortBy);
  }, []);

  // 都道府県・カテゴリの選択肢を取得
  const { data: prefectures } = trpc.products.prefectures.useQuery();
  const { data: categories } = trpc.products.categories.useQuery();

  // 検索クエリ
  const searchInput = useMemo(() => ({
    query: debouncedQuery || undefined,
    region: selectedRegion || undefined,
    prefecture: selectedPrefecture || undefined,
    category: selectedCategory || undefined,
    maxPrice: selectedPriceMax,
    minPrice: undefined as number | undefined,
    purposeTag: selectedPurposeTag || undefined,
    minShelfLife: selectedShelfMin > 0 ? selectedShelfMin : undefined,
    isIndividualPackaged: isIndividualPackaged ? true : undefined,
    sortBy,
    limit: ITEMS_PER_PAGE,
    offset: page * ITEMS_PER_PAGE,
  }), [debouncedQuery, selectedRegion, selectedPrefecture, selectedCategory, selectedPriceMax,
       selectedPurposeTag, selectedShelfMin, isIndividualPackaged, sortBy, page]);

  const { data: searchResult, isLoading, isFetching } = trpc.products.search.useQuery(searchInput);

  // いいね済みIDを取得
  const sessionId = useMemo(() => getSessionId(), []);
  const { data: likedIds = [], refetch: refetchLikes } = trpc.likes.getLikedIds.useQuery({ sessionId });
  const toggleLike = trpc.likes.toggle.useMutation({
    onSuccess: () => refetchLikes(),
  });

  // 検索条件が変わったらページをリセット
  useEffect(() => {
    setPage(0);
    setAllResults([]);
    setHasMore(true);
  }, [debouncedQuery, selectedRegion, selectedPrefecture, selectedCategory, selectedPriceMax,
      selectedPurposeTag, selectedShelfMin, isIndividualPackaged, sortBy]);

  // 検索結果を蓄積
  useEffect(() => {
    if (!searchResult) return;
    if (page === 0) {
      setAllResults(searchResult.products);
    } else {
      setAllResults(prev => [...prev, ...searchResult.products]);
    }
    setHasMore(searchResult.products.length === ITEMS_PER_PAGE);
  }, [searchResult, page]);

  const loadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setPage(p => p + 1);
    }
  }, [isFetching, hasMore]);

  const clearAll = () => {
    setQuery("");
    setSelectedRegion("");
    setSelectedPrefecture("");
    setSelectedCategory("");
    setSelectedPriceMax(undefined);
    setSelectedShelfMin(0);
    setSelectedPurposeTag("");
    setIsIndividualPackaged(false);
    setSortBy("popular");
    setPage(0);
    setAllResults([]);
  };

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setSelectedPrefecture("");
  };

  const activeFilterCount = [
    !!selectedRegion,
    !!selectedPrefecture,
    !!selectedCategory,
    !!selectedPriceMax,
    selectedShelfMin > 0,
    !!selectedPurposeTag,
    isIndividualPackaged,
  ].filter(Boolean).length;

  const hasQuery = query.trim().length > 0;
  const showSuggestions = isFocused && !hasQuery;
  const totalCount = searchResult?.total ?? 0;

  // 地方に対応する都道府県リスト
  const regionPrefectureMap: Record<string, string[]> = {
    "北海道": ["北海道"],
    "東北": ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
    "関東": ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"],
    "中部": ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"],
    "近畿": ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
    "中国": ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
    "四国": ["徳島県", "香川県", "愛媛県", "高知県"],
    "九州・沖縄": ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"],
  };

  const availablePrefectures = selectedRegion
    ? (regionPrefectureMap[selectedRegion] || []).filter(p => prefectures?.includes(p))
    : (prefectures || []);

  // SEO用ページタイトル生成
  const pageTitle = selectedPrefecture
    ? `${selectedPrefecture}のお土産 | Omiyage Go`
    : selectedRegion
    ? `${selectedRegion}のお土産 | Omiyage Go`
    : selectedPurposeTag
    ? `${PURPOSE_TAGS.find(t => t.id === selectedPurposeTag)?.label ?? ""}向けお土産 | Omiyage Go`
    : hasQuery
    ? `「${query}」のお土産 | Omiyage Go`
    : "お土産を探す | Omiyage Go";

  return (
    <AppLayout>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

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
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 150)}
              placeholder="商品名・ブランド・都道府県・カテゴリで検索"
              className="flex-1 bg-transparent text-sm text-stone-900 placeholder-stone-400 outline-none"
            />
            {(hasQuery || isLoading) && (
              <button
                onClick={() => setQuery("")}
                className="w-5 h-5 rounded-full bg-stone-400 flex items-center justify-center flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                ) : (
                  <X className="w-3 h-3 text-white" />
                )}
              </button>
            )}
          </div>

          {/* フィルタ行 */}
          <div className="flex items-center gap-2 mt-3">
            {/* フィルタボタン */}
            <button
              onClick={() => { setShowFilters(!showFilters); setShowSort(false); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex-shrink-0",
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

            {/* ソートボタン */}
            <button
              onClick={() => { setShowSort(!showSort); setShowFilters(false); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex-shrink-0",
                showSort ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-stone-600 border-stone-200"
              )}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {SORT_OPTIONS.find(o => o.id === sortBy)?.label ?? "並び替え"}
            </button>

            {/* 地方タブ（横スクロール） */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-1.5">
                {REGION_TABS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleRegionChange(r.id)}
                    className={cn(
                      "whitespace-nowrap px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      selectedRegion === r.id
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-white text-stone-500 border-stone-200"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── ソートパネル ── */}
        {showSort && (
          <div className="px-4 pb-3 bg-stone-50 border-t border-stone-100">
            <div className="flex flex-wrap gap-2 pt-3">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setSortBy(opt.id); setShowSort(false); }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                    sortBy === opt.id
                      ? "bg-emerald-700 text-white border-emerald-700"
                      : "bg-white text-stone-600 border-stone-200"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── フィルタパネル（展開） ── */}
        {showFilters && (
          <div className="px-4 pb-4 bg-stone-50 border-t border-stone-100 space-y-4">
            {/* 用途タグ */}
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mt-3 mb-2">用途</p>
              <div className="flex flex-wrap gap-1.5">
                {PURPOSE_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedPurposeTag(tag.id === selectedPurposeTag ? "" : tag.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      selectedPurposeTag === tag.id
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-white text-stone-600 border-stone-200"
                    )}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 日持ち */}
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">日持ち</p>
              <div className="flex flex-wrap gap-1.5">
                {SHELF_FILTERS.map((f) => (
                  <button
                    key={f.label}
                    onClick={() => setSelectedShelfMin(f.min)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      selectedShelfMin === f.min
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-white text-stone-600 border-stone-200"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 個包装トグル */}
            <div>
              <button
                onClick={() => setIsIndividualPackaged(!isIndividualPackaged)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-colors",
                  isIndividualPackaged
                    ? "bg-emerald-700 text-white border-emerald-700"
                    : "bg-white text-stone-600 border-stone-200"
                )}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                個包装のみ表示
              </button>
            </div>

            {/* 都道府県 */}
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">
                都道府県 {selectedRegion && <span className="text-emerald-600">（{selectedRegion}）</span>}
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                <button
                  onClick={() => setSelectedPrefecture("")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    !selectedPrefecture
                      ? "bg-emerald-700 text-white border-emerald-700"
                      : "bg-white text-stone-600 border-stone-200"
                  )}
                >
                  すべて
                </button>
                {availablePrefectures.map((pref) => (
                  <button
                    key={pref}
                    onClick={() => setSelectedPrefecture(pref === selectedPrefecture ? "" : pref)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      selectedPrefecture === pref
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-white text-stone-600 border-stone-200"
                    )}
                  >
                    {pref.replace("県", "").replace("府", "").replace("都", "").replace("道", "")}
                  </button>
                ))}
              </div>
            </div>

            {/* カテゴリ */}
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">カテゴリ</p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    !selectedCategory
                      ? "bg-emerald-700 text-white border-emerald-700"
                      : "bg-white text-stone-600 border-stone-200"
                  )}
                >
                  すべて
                </button>
                {(categories || []).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === selectedCategory ? "" : cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      selectedCategory === cat
                        ? "bg-emerald-700 text-white border-emerald-700"
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
                {PRICE_FILTERS.map((f) => (
                  <button
                    key={f.label}
                    onClick={() => setSelectedPriceMax(f.max)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      selectedPriceMax === f.max
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-white text-stone-600 border-stone-200"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* クリアボタン */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="w-full py-2 bg-stone-200 text-stone-700 text-xs font-bold rounded-xl"
              >
                すべてクリア
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 人気キーワード（未検索時） ── */}
      {showSuggestions && (
        <div className="px-4 py-4 bg-white border-b border-stone-100">
          <p className="text-xs font-bold text-stone-500 mb-2">人気キーワード</p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_KEYWORDS.map((kw) => (
              <button
                key={kw}
                onClick={() => setQuery(kw)}
                className="px-3 py-1.5 bg-stone-100 text-stone-700 text-xs font-medium rounded-full hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 結果ヘッダー ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-100">
        <div>
          {isLoading && page === 0 ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              <p className="text-sm text-stone-500">検索中...</p>
            </div>
          ) : (
            <p className="text-sm font-bold text-stone-800">
              {selectedPurposeTag
                ? `${PURPOSE_TAGS.find(t => t.id === selectedPurposeTag)?.label ?? ""}向けお土産`
                : selectedPrefecture
                ? `${selectedPrefecture}のお土産`
                : selectedRegion
                ? `${selectedRegion}のお土産`
                : selectedCategory
                ? `${selectedCategory} 一覧`
                : hasQuery
                ? `「${query}」の検索結果`
                : "全国のお土産"}
            </p>
          )}
          <p className="text-xs text-stone-500 mt-0.5">
            {totalCount.toLocaleString()}件
          </p>
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

      {/* ── 検索結果リスト ── */}
      <div className="px-4 pb-24 space-y-3 pt-3">
        {isLoading && page === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            <p className="text-sm text-stone-500">お土産を検索中...</p>
          </div>
        ) : allResults.length === 0 ? (
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
            {(hasQuery || activeFilterCount > 0) && (
              <button
                onClick={clearAll}
                className="px-6 py-2.5 bg-stone-100 text-stone-700 text-sm font-bold rounded-xl"
              >
                絞り込みをリセット
              </button>
            )}
          </div>
        ) : (
          <>
            {allResults.map((product) => (
              <DBProductCard
                key={product.id}
                product={product}
                isLiked={likedIds.includes(product.id)}
                onToggleLike={() => toggleLike.mutate({ productId: product.id, sessionId })}
              />
            ))}

            {/* もっと見るボタン */}
            {hasMore && (
              <div className="pt-4 pb-2 text-center">
                <button
                  onClick={loadMore}
                  disabled={isFetching}
                  className="px-6 py-2.5 bg-emerald-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      読み込み中...
                    </>
                  ) : (
                    "もっと見る"
                  )}
                </button>
              </div>
            )}

            {!hasMore && allResults.length > 0 && (
              <div className="pt-4 pb-2 text-center">
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

// ── DBから取得した商品のカードコンポーネント ──────────────────────
interface DBProductCardProps {
  product: {
    id: string;
    name: string;
    brand: string;
    price: number;
    prefecture: string;
    region: string;
    category: string;
    description: string | null;
    imageUrl: string | null;
    realImageUrl?: string | null;
    shelfLife: number | null;
    isIndividualPackaged: boolean;
    badges: string | null;
    likeCount?: number | null;
  };
  isLiked: boolean;
  onToggleLike: () => void;
}

function DBProductCard({ product, isLiked, onToggleLike }: DBProductCardProps) {
  const [, navigate] = useLocation();
  const [localLiked, setLocalLiked] = useState(isLiked);

  useEffect(() => {
    setLocalLiked(isLiked);
  }, [isLiked]);

  const badges = (() => {
    try {
      return product.badges ? JSON.parse(product.badges) : [];
    } catch {
      return [];
    }
  })();

  const isEditorial = badges.includes("editorial");
  const isBestseller = badges.includes("bestseller");
  const isLocal = badges.includes("local");

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalLiked(!localLiked); // 楽観的更新
    onToggleLike();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/db-product/${product.id}`;
    if (navigator.share) {
      navigator.share({ title: product.name, url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert("URLをコピーしました");
      });
    }
  };

  return (
    <div
      className={cn(
        "relative bg-white rounded-xl overflow-hidden shadow-sm border border-stone-200 cursor-pointer",
        "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
        "active:scale-[0.98]"
      )}
      onClick={() => navigate(`/db-product/${product.id}`)}
    >
      {/* 切符スタイル - 左端カラーバー */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-700" />

      <div className="pl-4 pr-4 pt-4 pb-3">
        <div className="flex gap-3">
          {/* 商品画像 */}
          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-stone-100 flex items-center justify-center">
            {(product.realImageUrl || product.imageUrl) ? (
              <img
                src={product.realImageUrl || product.imageUrl || ""}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Package className="w-8 h-8 text-stone-300" />
            )}
          </div>

          {/* 商品情報 */}
          <div className="flex-1 min-w-0">
            {/* バッジ */}
            <div className="flex gap-1 mb-1 flex-wrap">
              {isEditorial && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">
                  編集部推薦
                </span>
              )}
              {isBestseller && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">
                  人気
                </span>
              )}
              {isLocal && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">
                  地元産
                </span>
              )}
            </div>

            {/* 商品名 */}
            <p className="text-sm font-black text-stone-900 leading-tight line-clamp-2">
              {product.name}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">{product.brand}</p>

            {/* チップ */}
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-medium rounded-full">
                {product.category}
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded-full flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />
                {product.prefecture}
              </span>
              {product.shelfLife && (
                <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-medium rounded-full flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {product.shelfLife}日
                </span>
              )}
              {product.isIndividualPackaged && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full">
                  個包装
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 価格 + アクション */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100">
          <p className="text-base font-black text-stone-900">
            ¥{product.price.toLocaleString()}
            <span className="text-xs font-normal text-stone-400 ml-1">（税込）</span>
          </p>
          <div className="flex items-center gap-2">
            {/* いいねボタン */}
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all",
                localLiked
                  ? "bg-rose-50 border-rose-300 text-rose-600"
                  : "bg-white border-stone-200 text-stone-500 hover:border-rose-300 hover:text-rose-500"
              )}
            >
              <Heart className={cn("w-3.5 h-3.5", localLiked && "fill-rose-500")} />
              {product.likeCount != null && product.likeCount > 0 ? product.likeCount : ""}
            </button>

            {/* 共有ボタン */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-500 hover:border-stone-300 text-xs font-bold transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* 詳細ボタン */}
            <button
              className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/db-product/${product.id}`);
              }}
            >
              詳細
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
