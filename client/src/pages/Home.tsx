// ============================================================
// Omiyage Go - ホーム画面（位置情報連携対応版）
// デザイン哲学: 駅案内板スタイル - 最短で用途を選ばせる
// 機能: 現在地近くのお土産表示・施設フィルタ・用途選択・検索履歴
// ============================================================
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Search, MapPin, ChevronRight, WifiOff, Clock, RotateCcw, Eye, X,
  Navigation, Loader2, AlertCircle, CheckCircle2, Sparkles, Package
} from "lucide-react";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { ProductCard } from "@/components/omiyage/ProductCard";
import { useSearch } from "@/contexts/SearchContext";
import { useHistory } from "@/contexts/HistoryContext";
import {
  PURPOSE_LIST, ALL_PRODUCTS, FACILITIES,
  type FacilityId, type FacilityInfo
} from "@/lib/mockData";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const HERO_IMAGE =
  "https://private-us-east-1.manuscdn.com/sessionFile/PzmyGBA8B4SwIi3RcwaikB/sandbox/hveQjdnUbdiIB1lgDKtpHG-img-1_1771832768000_na1fn_aGVyby1iYW5uZXI.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUHpteUdCQThCNFN3SWkzUmN3YWlrQi9zYW5kYm94L2h2ZVFqZG5VYmRpSUIxbGdES3RwSEctaW1nLTFfMTc3MTgzMjc2ODAwMF9uYTFmbl9hR1Z5YnkxaVlXNXVaWEkuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=b8wDwdVugzhFKEkJ8D0XoHbodWxeVv2hqI6YJCsAYqC7bYO0jGta~F6LrFZRURgxjGGBxJVRICBO6WcbRN5HEaKXGOhoFvmUnEptS6t1iyBXWdUWEsgMertjjCnwlr7siwhyoPC8L52STb2dBzP8Yv56ISE6RjIOvt6MMrVexWymW7JnKQE-eOF5omFxXXodEP5rmcu2gco2sM9QAtHANoHbPCDfa9Ef26RkO54FdiGZNAKiznac4xOkef213tOz6hH858LZ2z1jrP3u6rJIYuvuO5Pqdx2CSRSXpGtW-iYKVJqPxlNYF3IMG6zrlH-DR71xyOxIUhZeKTauCtdMjw__";

// ── 距離計算（Haversine公式） ──────────────────────────────────
function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
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

// ── 位置情報の状態型 ──────────────────────────────────────────
type LocationState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "granted"; lat: number; lng: number; nearestFacility: FacilityInfo; distanceKm: number }
  | { status: "denied" }
  | { status: "error"; message: string };

export default function Home() {
  const [, navigate] = useLocation();
  const { updateCondition, conditions, setConditions } = useSearch();
  const { searchHistory, viewHistory, removeSearchHistory } = useHistory();
  const [searchText, setSearchText] = useState("");
  const [locationState, setLocationState] = useState<LocationState>({ status: "idle" });

  // 前回の条件で再検索
  const handleReSearch = (historyConditions: typeof conditions) => {
    setConditions(historyConditions);
    navigate("/results");
  };

  const handlePurposeSelect = (purposeId: string) => {
    updateCondition("purpose", purposeId);
    navigate("/conditions");
  };

  const handleFacilitySelect = (facilityId: FacilityId) => {
    updateCondition("facilityId", facilityId === conditions.facilityId ? null : facilityId);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchText.trim()) {
      navigate(`/db-search?q=${encodeURIComponent(searchText.trim())}`);
    }
  };

  // 位置情報を取得して最寄り施設を特定
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationState({ status: "error", message: "このブラウザは位置情報に対応していません" });
      return;
    }
    setLocationState({ status: "requesting" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // 最寄り施設を計算（allを除く）
        const facilities = FACILITIES.filter((f) => f.id !== "all");
        let nearest = facilities[0];
        let minDist = calcDistance(latitude, longitude, nearest.coords.lat, nearest.coords.lng);
        for (const f of facilities) {
          const d = calcDistance(latitude, longitude, f.coords.lat, f.coords.lng);
          if (d < minDist) { minDist = d; nearest = f; }
        }
        setLocationState({
          status: "granted",
          lat: latitude,
          lng: longitude,
          nearestFacility: nearest,
          distanceKm: minDist,
        });
        // 最寄り施設を自動選択
        updateCondition("facilityId", nearest.id);
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
  }, [updateCondition]);

  // 初回マウント時に位置情報を自動取得（permissionが既に許可済みの場合）
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
          requestLocation();
        }
      });
    }
  }, [requestLocation]);

  // 現在地近くのお土産を取得
  const nearbyProducts = (() => {
    if (locationState.status !== "granted") return [];
    const { nearestFacility } = locationState;
    // 最寄り施設の商品を優先表示
    const facilityProducts = ALL_PRODUCTS.filter((p) =>
      p.sellers.some((s) => s.facilityId === nearestFacility.id)
    );
    // 施設商品が少ない場合は同地方の商品も追加
    if (facilityProducts.length >= 3) return facilityProducts.slice(0, 5);
    return ALL_PRODUCTS.filter((p) =>
      p.sellers.some((s) => {
        const facilityInfo = FACILITIES.find((f) => f.id === s.facilityId);
        if (!facilityInfo) return false;
        const nearestCoords = nearestFacility.coords;
        const dist = calcDistance(nearestCoords.lat, nearestCoords.lng, facilityInfo.coords.lat, facilityInfo.coords.lng);
        return dist < 50; // 50km以内
      })
    ).slice(0, 5);
  })();

  // DB: 全国ピックアップ（bestseller商品 上位4件）
  const nationalPickupInput = useMemo(() => ({
    badges: ["bestseller"],
    limit: 4,
    offset: 0,
  }), []);
  const { data: nationalPickupData, isLoading: isNationalLoading } = trpc.products.search.useQuery(nationalPickupInput);
  const nationalPickupProducts = nationalPickupData?.products ?? [];

  // DB: 編集部おすすめ（editorial商品 上位4件）
  const editorialInput = useMemo(() => ({
    badges: ["editorial"],
    limit: 4,
    offset: 0,
  }), []);
  const { data: editorialData, isLoading: isEditorialLoading } = trpc.products.search.useQuery(editorialInput);  
  const editorialProducts = editorialData?.products ?? [];

  return (
    <AppLayout>
      {/* ヒーローバナー */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="東京駅のお土産"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/40 via-stone-900/20 to-stone-900/60" />
        <div className="absolute inset-0 flex flex-col justify-end p-4 pb-5">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-black">O</span>
            </div>
            <span className="text-white font-black text-lg tracking-tight">
              Omiyage Go
            </span>
          </div>
          <p className="text-white/90 text-sm font-medium leading-snug">
            外さない手土産、15分で。
          </p>
          <p className="text-white/70 text-xs mt-0.5">
            用途と条件を入れるだけで、保証つき候補と「今買える場所」まで
          </p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* 検索バー */}
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
            <span className="text-xs font-bold text-emerald-700 bg-emerald-200 px-2 py-1 rounded-full flex-shrink-0">
              許可する
            </span>
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
                  <p className="text-sm font-bold text-emerald-800">
                    最寄り: {locationState.nearestFacility.shortLabel}
                  </p>
                  <p className="text-xs text-emerald-600">
                    現在地から約{locationState.distanceKm < 1
                      ? `${Math.round(locationState.distanceKm * 1000)}m`
                      : `${locationState.distanceKm.toFixed(1)}km`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/search`)}
                className="text-xs font-bold text-emerald-700 bg-emerald-200 px-2 py-1 rounded-full flex-shrink-0 hover:bg-emerald-300 transition-colors"
              >
                周辺を探す
              </button>
            </div>
          </div>
        )}

        {locationState.status === "denied" && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-700">
                位置情報がオフです。施設を選ぶと探せます。
              </span>
            </div>
          </div>
        )}

        {locationState.status === "error" && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{locationState.message}</span>
          </div>
        )}

        {/* ── 現在地近くのお土産（位置情報取得済み時） ── */}
        {locationState.status === "granted" && nearbyProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <div>
                  <h2 className="text-base font-black text-stone-900">
                    {locationState.nearestFacility.shortLabel}のお土産
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    現在地から{locationState.distanceKm < 1
                      ? `${Math.round(locationState.distanceKm * 1000)}m`
                      : `${locationState.distanceKm.toFixed(1)}km`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  updateCondition("facilityId", locationState.nearestFacility.id);
                  navigate("/search");
                }}
                className="flex items-center gap-1 text-xs font-bold text-emerald-700"
              >
                すべて見る
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              {nearbyProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* ── 施設選択 ── */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-stone-700">施設を選ぶ</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FACILITIES.filter((f) => f.id !== "all").map((facility) => (
              <button
                key={facility.id}
                onClick={() => handleFacilitySelect(facility.id)}
                className={cn(
                  "flex-shrink-0 px-3 py-2 rounded-lg text-sm font-bold transition-all",
                  conditions.facilityId === facility.id
                    ? "bg-emerald-700 text-white"
                    : "bg-white border border-stone-200 text-stone-700 hover:border-emerald-400 hover:text-emerald-700"
                )}
              >
                {facility.shortLabel}
              </button>
            ))}
          </div>
        </div>

        {/* ── 用途カード ── */}
        <div>
          <h2 className="text-base font-black text-stone-900 mb-3">
            何のためのお土産ですか？
          </h2>
          <div className="grid grid-cols-3 gap-2.5">
            {PURPOSE_LIST.map((purpose) => (
              <button
                key={purpose.id}
                onClick={() => handlePurposeSelect(purpose.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 py-4 px-2",
                  "bg-white border border-stone-200 rounded-xl",
                  "hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-sm",
                  "active:scale-95 transition-all duration-150"
                )}
              >
                <span className="text-2xl">{purpose.icon}</span>
                <span className="text-sm font-bold text-stone-800">
                  {purpose.label}
                </span>
                <span className="text-[10px] text-stone-400 text-center leading-tight">
                  {purpose.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── ニッチ土産特集バナー ── */}
        <button
          onClick={() => navigate("/niche")}
          className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 p-4 text-left hover:opacity-95 active:scale-[0.98] transition-all"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Niche Picks</span>
            </div>
            <p className="text-white font-black text-base leading-tight mb-0.5">
              知る人ぞ知る<br />ニッチなお土産
            </p>
            <p className="text-white/75 text-xs">地元で愛される隠れた逸品を特集</p>
          </div>
          <div className="absolute right-4 bottom-4 flex items-center gap-1 text-white/80">
            <span className="text-xs font-bold">特集を見る</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* ── 全国のお土産ピックアップ（DB連携） ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-black text-stone-900">全国のお土産</h2>
              <p className="text-xs text-stone-500 mt-0.5">全国1,500件以上から厳選</p>
            </div>
            <button
              onClick={() => navigate("/db-search")}
              className="flex items-center gap-1 text-xs font-bold text-emerald-700"
            >
              すべて見る
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* 地方ショートカット */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
            {[
              { label: "🐻 北海道", region: "北海道", pref: "北海道" },
              { label: "⛩ 京都", region: "近畿", pref: "京都府" },
              { label: "🦀 大阪", region: "近畿", pref: "大阪府" },
              { label: "🌺 沖縄", region: "九州・沖縄", pref: "沖縄県" },
              { label: "🍜 福岡", region: "九州・沖縄", pref: "福岡県" },
              { label: "🍵 静岡", region: "中部", pref: "静岡県" },
              { label: "🦌 奈良", region: "近畿", pref: "奈良県" },
              { label: "🎯 広島", region: "中国", pref: "広島県" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(`/db-search?prefecture=${encodeURIComponent(item.pref)}`)}
                className="flex-shrink-0 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-700 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all whitespace-nowrap"
              >
                {item.label}
              </button>
            ))}
          </div>
          {/* DBから取得したピックアップ商品 */}
          {isNationalLoading ? (
            <div className="py-6 flex justify-center">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
            </div>
          ) : nationalPickupProducts.length > 0 ? (
            <div className="space-y-3">
              {nationalPickupProducts.map((product) => (
                <HomeDBProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <button
              onClick={() => navigate("/db-search")}
              className="w-full py-8 flex flex-col items-center gap-2 bg-white border border-stone-200 rounded-xl hover:border-emerald-400 transition-colors"
            >
              <Package className="w-8 h-8 text-stone-300" />
              <p className="text-sm text-stone-500">全国1,500件以上のお土産を探す</p>
            </button>
          )}
        </div>

        {/* ── 編集部のおすすめ（DB連携） ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-black text-stone-900">
                編集部のおすすめ
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">外しにくい定番品</p>
            </div>
            <button
              onClick={() => navigate("/db-search?badges=editorial")}
              className="flex items-center gap-1 text-xs font-bold text-emerald-700"
            >
              すべて見る
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {isEditorialLoading ? (
            <div className="py-6 flex justify-center">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
            </div>
          ) : editorialProducts.length > 0 ? (
            <div className="space-y-3">
              {editorialProducts.map((product) => (
                <HomeDBProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <button
              onClick={() => navigate("/db-search")}
              className="w-full py-8 flex flex-col items-center gap-2 bg-white border border-stone-200 rounded-xl hover:border-emerald-400 transition-colors"
            >
              <Package className="w-8 h-8 text-stone-300" />
              <p className="text-sm text-stone-500">おすすめ商品を探す</p>
            </button>
          )}
        </div>

        {/* ── 検索履歴 ── */}
        {searchHistory.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-stone-400" />
                <h2 className="text-sm font-bold text-stone-700">最近の検索</h2>
              </div>
            </div>
            <div className="space-y-2">
              {searchHistory.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2.5 hover:border-emerald-300 transition-colors"
                >
                  <button
                    onClick={() => handleReSearch(entry.conditions)}
                    className="flex-1 flex items-center gap-2 text-left"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-800 truncate">{entry.label}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {entry.resultCount}件 · {new Date(entry.timestamp).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => removeSearchHistory(entry.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-100 flex-shrink-0"
                  >
                    <X className="w-3 h-3 text-stone-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 閲覧履歴 ── */}
        {viewHistory.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Eye className="w-4 h-4 text-stone-400" />
              <h2 className="text-sm font-bold text-stone-700">最近見た商品</h2>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              {viewHistory.slice(0, 8).map((entry) => (
                <button
                  key={entry.productId}
                  onClick={() => navigate(`/product/${entry.productId}`)}
                  className="flex-shrink-0 w-20 flex flex-col items-center gap-1 group"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-stone-200 group-hover:border-emerald-400 transition-colors">
                    <img
                      src={entry.productImage}
                      alt={entry.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-[10px] text-stone-600 font-medium text-center leading-tight line-clamp-2 w-full">
                    {entry.productName}
                  </p>
                  <p className="text-[10px] text-stone-400 font-bold">{entry.productPrice}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 法人モード入口 ── */}
        <div className="bg-stone-900 rounded-xl p-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-sm">
              法人の手配をまとめて任せる
            </h3>
            <p className="text-stone-400 text-xs mt-0.5">
              のし・宛名・請求書・複数送付先に対応（準備中）
            </p>
          </div>
          <button className="flex-shrink-0 ml-3 px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg">
            相談する
          </button>
        </div>

        <div className="h-2" />
      </div>
    </AppLayout>
  );
}

// ── ホーム用DBProductCardコンポーネント ──────────────────────────────
interface HomeDBProduct {
  id: string;
  name: string;
  brand: string | null;
  price: number | null;
  imageUrl: string | null;
  prefecture: string | null;
  category: string | null;
  badges: string | null;
  shelfLife: number | null;
  isIndividualPackaged: boolean | null;
}

const CATEGORY_IMAGES: Record<string, string> = {
  "和菓子": "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=75",
  "洋菓子": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=75",
  "スイーツ": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=75",
  "せんべい": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75",
  "海産物": "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&q=75",
  "酒類": "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&q=75",
  "調味料": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=75",
  "漬物": "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400&q=75",
  "乾物": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=75",
  "その他": "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=400&q=75",
};

function getProductImage(product: HomeDBProduct): string {
  if (product.imageUrl) return product.imageUrl;
  const cat = product.category ?? "その他";
  return CATEGORY_IMAGES[cat] ?? CATEGORY_IMAGES["その他"];
}

function parseBadgesHome(badgesStr: string | null): string[] {
  try { return badgesStr ? JSON.parse(badgesStr) : []; }
  catch { return []; }
}

const BADGE_LABELS: Record<string, { label: string; color: string }> = {
  bestseller: { label: "定番", color: "bg-amber-100 text-amber-700" },
  editorial: { label: "編集部推薦", color: "bg-emerald-100 text-emerald-700" },
  popular: { label: "人気", color: "bg-blue-100 text-blue-700" },
  niche: { label: "ニッチ", color: "bg-orange-100 text-orange-700" },
  regional: { label: "地域限定", color: "bg-purple-100 text-purple-700" },
};

function HomeDBProductCard({ product }: { product: HomeDBProduct }) {
  const [, navigate] = useLocation();
  const badges = parseBadgesHome(product.badges).slice(0, 2);
  const imgSrc = getProductImage(product);

  return (
    <button
      onClick={() => navigate(`/db-product/${product.id}`)}
      className="w-full flex items-center gap-3 bg-white border border-stone-200 rounded-xl p-3 hover:border-emerald-400 hover:shadow-sm active:scale-[0.98] transition-all text-left"
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
        <img
          src={imgSrc}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = CATEGORY_IMAGES["その他"];
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          {badges.map((b) => {
            const info = BADGE_LABELS[b];
            if (!info) return null;
            return (
              <span key={b} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${info.color}`}>
                {info.label}
              </span>
            );
          })}
        </div>
        <p className="text-sm font-bold text-stone-900 truncate">{product.name}</p>
        <p className="text-xs text-stone-500 truncate">{product.brand ?? ""}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-bold text-emerald-700">
            {product.price ? `¥${product.price.toLocaleString()}` : "価格要確認"}
          </span>
          {product.prefecture && (
            <span className="text-[10px] text-stone-400">{product.prefecture}</span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
    </button>
  );
}
