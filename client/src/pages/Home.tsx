// ============================================================
// Omiyage Go - ホーム画面（SEO流入最大化版）
// デザイン哲学: 駅案内板スタイル - 最短で用途を選ばせる
// 機能: カルーセル特集・2導線（今すぐ/用途別）・位置情報・検索履歴
// ============================================================
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import {
  Search, MapPin, ChevronRight, WifiOff,
  Navigation, Loader2, AlertCircle, CheckCircle2,
  Clock, Package, Heart, ChevronLeft, Sparkles, Users
} from "lucide-react";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { useSearch } from "@/contexts/SearchContext";
import { useHistory } from "@/contexts/HistoryContext";
import {
  FACILITIES, type FacilityId, type FacilityInfo
} from "@/lib/mockData";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

// ── 用途プリセット（SEOキーワード対応） ──────────────────────
const PURPOSE_PRESETS = [
  { id: "greeting", label: "挨拶", icon: "🤝", description: "初対面・訪問時", purposeTag: "greeting" },
  { id: "thanks", label: "御礼", icon: "🙏", description: "お礼・感謝", purposeTag: "thanks" },
  { id: "apology", label: "お詫び", icon: "💐", description: "謝罪・お詫び", purposeTag: "apology" },
  { id: "office", label: "社内配布", icon: "🏢", description: "大人数向け", purposeTag: "office" },
  { id: "snack", label: "差し入れ", icon: "☕", description: "差し入れ・おやつ", purposeTag: "snack" },
  { id: "self", label: "自分用", icon: "🎁", description: "自分へのご褒美", purposeTag: "self" },
  { id: "family", label: "家族へ", icon: "👨‍👩‍👧", description: "家族・親戚", purposeTag: "family" },
  { id: "kids", label: "子供向け", icon: "🧒", description: "子供が喜ぶ", purposeTag: "kids" },
];

// ── 制約プリセット ──────────────────────────────────────────
const CONSTRAINT_PRESETS = [
  { label: "3日以上", icon: <Clock className="w-3.5 h-3.5" />, params: { minShelfLife: 3 } },
  { label: "7日以上", icon: <Clock className="w-3.5 h-3.5" />, params: { minShelfLife: 7 } },
  { label: "14日以上", icon: <Clock className="w-3.5 h-3.5" />, params: { minShelfLife: 14 } },
  { label: "個包装", icon: <Package className="w-3.5 h-3.5" />, params: { isIndividualPackaged: true } },
  { label: "〜1,000円", icon: null, params: { maxPrice: 1000 } },
  { label: "〜3,000円", icon: null, params: { maxPrice: 3000 } },
  { label: "10人以上", icon: <Users className="w-3.5 h-3.5" />, params: { minShelfLife: 7, isIndividualPackaged: true } },
];

// ── 距離計算（Haversine公式） ──────────────────────────────────
function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type LocationState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "granted"; lat: number; lng: number; nearestFacility: FacilityInfo; distanceKm: number }
  | { status: "denied" }
  | { status: "error"; message: string };

// ── カルーセルコンポーネント ──────────────────────────────────
interface CarouselSlide {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl: string;
  badgeText?: string;
}

const DEFAULT_SLIDES: CarouselSlide[] = [
  {
    id: "slide-1",
    title: "東京駅で買える\n日持ち14日以上のお土産",
    subtitle: "新幹線乗車前でも安心",
    imageUrl: "https://private-us-east-1.manuscdn.com/sessionFile/PzmyGBA8B4SwIi3RcwaikB/sandbox/hveQjdnUbdiIB1lgDKtpHG-img-1_1771832768000_na1fn_aGVyby1iYW5uZXI.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUHpteUdCQThCNFN3SWkzUmN3YWlrQi9zYW5kYm94L2h2ZVFqZG5VYmRpSUIxbGdES3RwSEctaW1nLTFfMTc3MTgzMjc2ODAwMF9uYTFmbl9hR1Z5YnkxaVlXNXVaWEkuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=b8wDwdVugzhFKEkJ8D0XoHbodWxeVv2hqI6YJCsAYqC7bYO0jGta~F6LrFZRURgxjGGBxJVRICBO6WcbRN5HEaKXGOhoFvmUnEptS6t1iyBXWdUWEsgMertjjCnwlr7siwhyoPC8L52STb2dBzP8Yv56ISE6RjIOvt6MMrVexWymW7JnKQE-eOF5omFxXXodEP5rmcu2gco2sM9QAtHANoHbPCDfa9Ef26RkO54FdiGZNAKiznac4xOkef213tOz6hH858LZ2z1jrP3u6rJIYuvuO5Pqdx2CSRSXpGtW-iYKVJqPxlNYF3IMG6zrlH-DR71xyOxIUhZeKTauCtdMjw__",
    linkUrl: "/db-search?minShelfLife=14",
    badgeText: "日持ち特集",
  },
  {
    id: "slide-2",
    title: "個包装で配りやすい\nオフィス向けお土産",
    subtitle: "20人以上の社内配布に",
    linkUrl: "/db-search?isIndividualPackaged=true&purposeTag=office",
    badgeText: "社内配布",
  },
  {
    id: "slide-3",
    title: "羽田空港で買える\n手土産セレクション",
    subtitle: "国内線・国際線ターミナル別",
    linkUrl: "/station/haneda-t1",
    badgeText: "空港特集",
  },
];

function HeroCarousel({ slides }: { slides: CarouselSlide[] }) {
  const [, navigate] = useLocation();
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length);
    }, 5000);
  }, [slides.length]);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const goTo = (idx: number) => {
    setCurrent(idx);
    startTimer();
  };

  const slide = slides[current];

  return (
    <div className="relative h-52 overflow-hidden cursor-pointer" onClick={() => navigate(slide.linkUrl)}>
      {/* 背景画像 */}
      {slide.imageUrl ? (
        <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900/30 via-stone-900/10 to-stone-900/70" />

      {/* コンテンツ */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 pb-8">
        {slide.badgeText && (
          <span className="inline-flex self-start mb-1.5 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
            {slide.badgeText}
          </span>
        )}
        <h2 className="text-white font-black text-lg leading-snug whitespace-pre-line drop-shadow">
          {slide.title}
        </h2>
        {slide.subtitle && (
          <p className="text-white/80 text-xs mt-0.5">{slide.subtitle}</p>
        )}
      </div>

      {/* ドットインジケーター */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); goTo(i); }}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              i === current ? "bg-white w-4" : "bg-white/50"
            )}
          />
        ))}
      </div>

      {/* 前後ボタン（PCのみ） */}
      <button
        onClick={(e) => { e.stopPropagation(); goTo((current - 1 + slides.length) % slides.length); startTimer(); }}
        className="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center"
      >
        <ChevronLeft className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); goTo((current + 1) % slides.length); startTimer(); }}
        className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center"
      >
        <ChevronRight className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}

// ── メインコンポーネント ──────────────────────────────────────
export default function Home() {
  const [, navigate] = useLocation();
  const { updateCondition, conditions } = useSearch();
  const [searchText, setSearchText] = useState("");
  const [locationState, setLocationState] = useState<LocationState>({ status: "idle" });

  // 検索フォーム送信
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchText.trim()) {
      navigate(`/db-search?q=${encodeURIComponent(searchText.trim())}`);
    }
  };

  // 用途選択
  const handlePurposeSelect = (purposeTag: string) => {
    navigate(`/db-search?purposeTag=${encodeURIComponent(purposeTag)}`);
  };

  // 制約プリセット選択
  const handleConstraintSelect = (params: Record<string, unknown>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => qs.set(k, String(v)));
    navigate(`/db-search?${qs.toString()}`);
  };

  // 施設選択
  const handleFacilitySelect = (facilityId: string) => {
    navigate(`/station/${facilityId}`);
  };

  // 位置情報取得
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationState({ status: "error", message: "このブラウザは位置情報に対応していません" });
      return;
    }
    setLocationState({ status: "requesting" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const facs = FACILITIES.filter((f) => f.id !== "all");
        let nearest = facs[0];
        let minDist = calcDistance(latitude, longitude, nearest.coords.lat, nearest.coords.lng);
        for (const f of facs) {
          const d = calcDistance(latitude, longitude, f.coords.lat, f.coords.lng);
          if (d < minDist) { minDist = d; nearest = f; }
        }
        setLocationState({ status: "granted", lat: latitude, lng: longitude, nearestFacility: nearest, distanceKm: minDist });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocationState({ status: "denied" });
        } else {
          setLocationState({ status: "error", message: "位置情報の取得に失敗しました" });
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") requestLocation();
      });
    }
  }, [requestLocation]);

  // DB: 最寄り施設の商品（位置情報取得後）
  const nearbyFacilityId = locationState.status === "granted" ? locationState.nearestFacility.id : undefined;
  const nearbyInput = useMemo(
    () => nearbyFacilityId ? { facilityId: nearbyFacilityId, limit: 5, offset: 0 } : null,
    [nearbyFacilityId]
  );
  const { data: nearbyData, isLoading: isNearbyLoading } = trpc.products.search.useQuery(
    nearbyInput ?? { facilityId: "__none__", limit: 0, offset: 0 },
    { enabled: !!nearbyFacilityId }
  );
  const nearbyProducts = nearbyData?.products ?? [];
  // DB: 人気商品（いいね数順）
  const popularInput = useMemo(() => ({ sortBy: "popular" as const, limit: 6, offset: 0 }), []);
  const { data: popularData, isLoading: isPopularLoading } = trpc.products.search.useQuery(popularInput);
  const popularProducts = popularData?.products ?? [];
  // DB: 編集部おすすめ
  const editorialInput = useMemo(() => ({ badges: ["editorial"], limit: 4, offset: 0 }), []);
  const { data: editorialData } = trpc.products.search.useQuery(editorialInput);
  const editorialProducts = editorialData?.products ?? [];;

  return (
    <AppLayout>
      <Helmet>
        <title>Omiyage Go - 外さないお土産を最短距離で | 駅・空港別お土産検索</title>
        <meta name="description" content="東京駅・羽田空港・新宿など全国の駅・空港で買えるお土産を用途・日持ち・予算で絞り込み。挨拶・御礼・社内配布など場面別に最適な手土産が見つかります。" />
        <meta property="og:title" content="Omiyage Go - 外さないお土産を最短距離で" />
        <meta property="og:description" content="駅・空港で買えるお土産を用途・日持ち・予算で絞り込み。場面別に最適な手土産が見つかります。" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://omiyagego-axrcumbv.manus.space/" />
      </Helmet>

      {/* ── カルーセルヒーロー ── */}
      <HeroCarousel slides={DEFAULT_SLIDES} />

      <div className="px-4 pt-4 space-y-6">
        {/* ── 検索バー ── */}
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="例：東京駅で日持ちする手土産"
              className="w-full pl-9 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent shadow-sm"
            />
          </div>
        </form>

        {/* ── 位置情報バナー ── */}
        {locationState.status === "idle" && (
          <button
            onClick={requestLocation}
            className="w-full flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 hover:bg-emerald-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-600" />
              <div className="text-left">
                <p className="text-sm font-bold text-emerald-800">現在地近くのお土産を表示</p>
                <p className="text-xs text-emerald-600">位置情報を使って最寄りの売り場を案内</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-200 px-2 py-1 rounded-full flex-shrink-0">許可する</span>
          </button>
        )}

        {locationState.status === "requesting" && (
          <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
            <Loader2 className="w-4 h-4 text-emerald-600 animate-spin flex-shrink-0" />
            <p className="text-sm text-stone-600">現在地を取得中...</p>
          </div>
        )}

        {locationState.status === "granted" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">最寄り: {locationState.nearestFacility.shortLabel}</p>
                  <p className="text-xs text-emerald-600">
                    現在地から約{locationState.distanceKm < 1
                      ? `${Math.round(locationState.distanceKm * 1000)}m`
                      : `${locationState.distanceKm.toFixed(1)}km`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/station/${locationState.nearestFacility.id}`)}
                className="text-xs font-bold text-emerald-700 bg-emerald-200 px-2 py-1 rounded-full flex-shrink-0 hover:bg-emerald-300 transition-colors"
              >
                周辺を探す
              </button>
            </div>
          </div>
        )}

        {/* ── 現在地近くのお土産（位置情報取得済み時） ── */}
        {locationState.status === "granted" && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <div>
                  <h2 className="text-base font-black text-stone-900">
                    {locationState.nearestFacility.shortLabel}のお土産
                  </h2>
                  <p className="text-xs text-stone-500">
                    現在地から{locationState.distanceKm < 1
                      ? `${Math.round(locationState.distanceKm * 1000)}m`
                      : `${locationState.distanceKm.toFixed(1)}km`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/station/${locationState.nearestFacility.id}`)}
                className="flex items-center gap-1 text-xs font-bold text-emerald-700"
              >
                すべて見る <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {isNearbyLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
              </div>
            ) : nearbyProducts.length > 0 ? (
              <div className="space-y-3">
                {nearbyProducts.map((product) => (
                  <DBHomeCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-stone-400 text-sm">この施設の商品情報を読み込み中...</div>
            )}
          </section>
        )}
        {locationState.status === "denied" && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <WifiOff className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-amber-700">位置情報がオフです。施設を選んで探せます。</span>
          </div>
        )}

        {locationState.status === "error" && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{locationState.message}</span>
          </div>
        )}

        {/* ── 導線A: 今すぐ近くで買える（施設選択） ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-stone-700">今すぐ近くで買える</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FACILITIES.filter((f) => f.id !== "all").map((facility) => (
              <button
                key={facility.id}
                onClick={() => handleFacilitySelect(facility.id)}
                className="flex-shrink-0 px-3 py-2 rounded-lg text-sm font-bold bg-white border border-stone-200 text-stone-700 hover:border-emerald-400 hover:text-emerald-700 transition-all"
              >
                {facility.shortLabel}
              </button>
            ))}
          </div>
        </section>

        {/* ── 導線B: どんなお土産を探す？（用途＋制約プリセット） ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-stone-900">どんなお土産を探す？</h2>
          </div>

          {/* 用途カード */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {PURPOSE_PRESETS.map((purpose) => (
              <button
                key={purpose.id}
                onClick={() => handlePurposeSelect(purpose.purposeTag)}
                className="flex flex-col items-center justify-center gap-1 py-3 px-1 bg-white border border-stone-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 active:scale-95 transition-all duration-150"
              >
                <span className="text-xl">{purpose.icon}</span>
                <span className="text-xs font-bold text-stone-800">{purpose.label}</span>
              </button>
            ))}
          </div>

          {/* 制約プリセット（横スクロール） */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CONSTRAINT_PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => handleConstraintSelect(preset.params as Record<string, unknown>)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-full text-xs font-bold text-stone-700 hover:border-emerald-400 hover:text-emerald-700 transition-all"
              >
                {preset.icon}
                {preset.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── 人気のお土産 ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <h2 className="text-base font-black text-stone-900">人気のお土産</h2>
            </div>
            <button
              onClick={() => navigate("/db-search?sortBy=popular")}
              className="flex items-center gap-1 text-xs font-bold text-emerald-700"
            >
              すべて見る <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {isPopularLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
            </div>
          ) : popularProducts.length > 0 ? (
            <div className="space-y-3">
              {popularProducts.slice(0, 4).map((product) => (
                <DBHomeCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-stone-400 text-sm">商品を読み込み中...</div>
          )}
        </section>

        {/* ── 編集部おすすめ ── */}
        {editorialProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-black text-stone-900">編集部おすすめ</h2>
              </div>
              <button
                onClick={() => navigate("/db-search?sortBy=editorial")}
                className="flex items-center gap-1 text-xs font-bold text-emerald-700"
              >
                すべて見る <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              {editorialProducts.slice(0, 3).map((product) => (
                <DBHomeCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ── SEO内部リンク（駅/空港ページへ） ── */}
        <section className="pb-4">
          <h2 className="text-sm font-bold text-stone-600 mb-3">駅・空港別お土産ガイド</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "tokyo-station", label: "東京駅のお土産" },
              { id: "haneda-t1", label: "羽田空港のお土産" },
              { id: "shinagawa", label: "品川駅のお土産" },
              { id: "shinjuku", label: "新宿駅のお土産" },
              { id: "kyoto", label: "京都駅のお土産" },
              { id: "osaka", label: "大阪駅のお土産" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/station/${item.id}`)}
                className="flex items-center justify-between px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-700 hover:border-emerald-300 hover:text-emerald-700 transition-all text-left"
              >
                <span>{item.label}</span>
                <ChevronRight className="w-3 h-3 text-stone-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

// ── DBHomeCard: DBデータ対応の商品カード ──────────────────────
function DBHomeCard({ product }: { product: any }) {
  const [, navigate] = useLocation();
  return (
    <div
      className="relative bg-white rounded-xl border border-stone-200 overflow-hidden cursor-pointer hover:shadow-md transition-all"
      onClick={() => navigate(`/db-product/${product.id}`)}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-700" />
      <div className="pl-4 pr-4 pt-3 pb-3">
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-6 h-6 text-stone-300" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-stone-900 line-clamp-2 leading-tight">{product.name}</p>
            <p className="text-xs text-stone-500 mt-0.5">{product.brand}</p>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded-full">
                {product.prefecture}
              </span>
              {product.shelfLife && (
                <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-medium rounded-full">
                  {product.shelfLife}日
                </span>
              )}
            </div>
          </div>
          <p className="text-sm font-black text-stone-900 flex-shrink-0">¥{product.price?.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
