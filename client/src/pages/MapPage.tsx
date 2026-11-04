// ============================================================
// Omiyage Go - マップ画面
// デザイン哲学: 駅案内板スタイル - 「どこで買えるか」を地図で即把握
// 機能: 全売り場ピン表示・クラスタリング・施設/改札フィルタ・ボトムシート・商品詳細連携
// データ: 実DB（facilities/sellers/products）を tRPC で取得。モックデータ(@/lib/mockData)は不使用。
// ============================================================
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import {
  MapPin,
  SlidersHorizontal,
  X,
  Navigation,
  Clock,
  Users,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { MapView } from "@/components/Map";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── 実DBの型 ─────────────────────────────────────────────
interface FacilityRow {
  id: string;
  name: string;
  shortLabel: string;
  region: string;
  prefecture: string | null;
  latitude: string | null;
  longitude: string | null;
  insideGate: boolean;
}

interface SellerRow {
  id: string;
  productId: string;
  facilityId: string;
  storeName: string;
  floor: string | null;
  location: string | null;
  insideGate: boolean;
  businessHours: string | null;
  congestionLevel: "low" | "medium" | "high" | null;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock" | null;
  mapUrl: string | null;
  walkMinutes: number | null;
}

interface ProductRow {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  realImageUrl?: string | null;
  category: string;
}

interface SellerWithProduct {
  seller: SellerRow;
  product: ProductRow;
  facility: FacilityRow;
  coords: { lat: number; lng: number };
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&q=80";
function getProductImage(product: ProductRow) {
  return product.realImageUrl || product.imageUrl || DEFAULT_IMAGE;
}

// 改札内外フィルタ
type GateFilter = "all" | "inside" | "outside";

// 混雑レベルの色・ラベル
const CROWD_LABEL: Record<string, string> = { low: "少", medium: "中", high: "多" };
const CROWD_COLOR: Record<string, string> = {
  low: "text-emerald-600",
  medium: "text-amber-600",
  high: "text-red-600",
};

/**
 * 施設の代表座標（緯度経度）を中心に、店舗数に応じて円状に少しずつずらした
 * 表示用座標を作る。売り場テーブルには店舗個別の緯度経度が無いため、
 * 「同一施設内の複数店舗はおおよその位置（施設中心からのジッター）」として表示する。
 */
function jitterCoords(baseLat: number, baseLng: number, index: number, total: number) {
  if (total <= 1) return { lat: baseLat, lng: baseLng };
  const angle = (index / total) * Math.PI * 2;
  const radiusDeg = 0.0006; // 約60m相当
  return {
    lat: baseLat + Math.sin(angle) * radiusDeg,
    lng: baseLng + Math.cos(angle) * radiusDeg,
  };
}

// ── クラスタリングロジック ──────────────────────────────────────
interface ClusterGroup {
  center: { lat: number; lng: number };
  items: SellerWithProduct[];
}

function clusterSellers(
  sellers: SellerWithProduct[],
  zoom: number,
  thresholdPx = 60
): ClusterGroup[] {
  const metersPerPx = (156543.03392 * Math.cos(35.68 * (Math.PI / 180))) / Math.pow(2, zoom);
  const degPerPx = metersPerPx / 111320;
  const threshold = degPerPx * thresholdPx;

  const clusters: ClusterGroup[] = [];
  const assigned = new Set<number>();

  sellers.forEach((item, i) => {
    if (assigned.has(i)) return;

    const group: SellerWithProduct[] = [item];
    assigned.add(i);

    sellers.forEach((other, j) => {
      if (i === j || assigned.has(j)) return;
      const dLat = Math.abs(item.coords.lat - other.coords.lat);
      const dLng = Math.abs(item.coords.lng - other.coords.lng);
      if (dLat < threshold && dLng < threshold) {
        group.push(other);
        assigned.add(j);
      }
    });

    const centerLat = group.reduce((s, g) => s + g.coords.lat, 0) / group.length;
    const centerLng = group.reduce((s, g) => s + g.coords.lng, 0) / group.length;
    clusters.push({ center: { lat: centerLat, lng: centerLng }, items: group });
  });

  return clusters;
}

// 単体ピン要素
function createPinElement(insideGate: boolean, isSelected: boolean) {
  const el = document.createElement("div");
  const color = insideGate ? "#15803d" : "#ea580c";
  const size = isSelected ? 40 : 32;
  el.innerHTML = `
    <div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      transition:all 0.2s;
    "></div>
  `;
  el.style.cursor = "pointer";
  return el;
}

// クラスタバブル要素（複数件まとめ）
function createClusterElement(count: number, hasInsideGate: boolean, hasOutsideGate: boolean) {
  const el = document.createElement("div");
  let bg = "#15803d";
  if (hasInsideGate && hasOutsideGate) bg = "#854d0e";
  else if (hasOutsideGate) bg = "#ea580c";

  const size = count >= 10 ? 48 : 40;
  el.innerHTML = `
    <div style="
      width:${size}px;height:${size}px;
      background:${bg};
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 2px 10px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;
      transition:transform 0.15s;
    ">
      <span style="color:white;font-size:${count >= 10 ? 13 : 14}px;font-weight:900;line-height:1;">${count}</span>
    </div>
  `;
  el.style.cursor = "pointer";
  return el;
}

export default function MapPage() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const currentZoomRef = useRef<number>(13);

  // 施設一覧（実DB）
  const { data: facilities = [], isLoading: facilitiesLoading } = trpc.facilities.list.useQuery();

  // 全施設ぶんの売り場×商品を集約
  const [allSellers, setAllSellers] = useState<SellerWithProduct[]>([]);
  const [sellersLoading, setSellersLoading] = useState(false);

  useEffect(() => {
    if (facilities.length === 0) return;
    let cancelled = false;
    setSellersLoading(true);

    (async () => {
      const results = await Promise.all(
        facilities.map(async (facility) => {
          if (!facility.latitude || !facility.longitude) return [];
          const [sellerRows, productResult] = await Promise.all([
            utils.facilities.getSellers.fetch({ facilityId: facility.id }),
            utils.facilities.getProducts.fetch({ facilityId: facility.id, limit: 200, offset: 0 }),
          ]);
          const productMap = new Map((productResult?.products ?? []).map((p) => [p.id, p as ProductRow]));
          const baseLat = Number(facility.latitude);
          const baseLng = Number(facility.longitude);
          return (sellerRows as SellerRow[])
            .map((seller, i) => {
              const product = productMap.get(seller.productId);
              if (!product) return null;
              return {
                seller,
                product,
                facility: facility as FacilityRow,
                coords: jitterCoords(baseLat, baseLng, i, sellerRows.length),
              } satisfies SellerWithProduct;
            })
            .filter((v): v is SellerWithProduct => v !== null);
        })
      );
      if (!cancelled) {
        setAllSellers(results.flat());
        setSellersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [facilities, utils]);

  // フィルタ状態
  const [facilityFilter, setFacilityFilter] = useState<string>("all");
  const [gateFilter, setGateFilter] = useState<GateFilter>("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // 選択中の売り場
  const [selectedSeller, setSelectedSeller] = useState<SellerWithProduct | null>(null);

  // フィルタ済み売り場
  const filteredSellers = useMemo(
    () =>
      allSellers.filter(({ seller }) => {
        if (facilityFilter !== "all" && seller.facilityId !== facilityFilter) return false;
        if (gateFilter === "inside" && !seller.insideGate) return false;
        if (gateFilter === "outside" && seller.insideGate) return false;
        return true;
      }),
    [allSellers, facilityFilter, gateFilter]
  );

  // ── マーカー（クラスタ対応）を再描画 ──
  const renderMarkers = useCallback(
    (map: google.maps.Map, zoom: number) => {
      markersRef.current.forEach((m) => (m.map = null));
      markersRef.current = [];

      const clusters = clusterSellers(filteredSellers, zoom);

      clusters.forEach((cluster) => {
        const isSingle = cluster.items.length === 1;

        if (isSingle) {
          const item = cluster.items[0];
          const isSelected = selectedSeller?.seller.id === item.seller.id;
          const pinEl = createPinElement(item.seller.insideGate, isSelected);

          const marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: item.coords,
            title: item.seller.storeName,
            content: pinEl,
          });

          marker.addListener("click", () => {
            setSelectedSeller(item);
            map.panTo(item.coords);
            map.setZoom(Math.max(zoom, 16));
          });

          markersRef.current.push(marker);
        } else {
          const hasInside = cluster.items.some((i) => i.seller.insideGate);
          const hasOutside = cluster.items.some((i) => !i.seller.insideGate);
          const clusterEl = createClusterElement(cluster.items.length, hasInside, hasOutside);

          const marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: cluster.center,
            title: `${cluster.items.length}件の売り場`,
            content: clusterEl,
          });

          marker.addListener("click", () => {
            map.panTo(cluster.center);
            map.setZoom(Math.min(zoom + 2, 18));
          });

          markersRef.current.push(marker);
        }
      });
    },
    [filteredSellers, selectedSeller]
  );

  // マップ準備完了時
  const handleMapReady = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      map.setCenter({ lat: 35.6812, lng: 139.7671 });
      map.setZoom(13);

      new google.maps.TransitLayer().setMap(map);

      renderMarkers(map, 13);

      map.addListener("zoom_changed", () => {
        const z = map.getZoom() ?? 13;
        currentZoomRef.current = z;
        renderMarkers(map, z);
      });

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            const userEl = document.createElement("div");
            userEl.innerHTML = `
              <div style="
                width:16px;height:16px;
                background:#3b82f6;
                border-radius:50%;
                border:3px solid white;
                box-shadow:0 0 0 4px rgba(59,130,246,0.3);
              "></div>
            `;
            new google.maps.marker.AdvancedMarkerElement({
              map,
              position: userPos,
              title: "現在地",
              content: userEl,
            });
          },
          () => {}
        );
      }
    },
    [renderMarkers]
  );

  // フィルタ変更時にマーカーを更新
  useEffect(() => {
    if (mapRef.current) {
      renderMarkers(mapRef.current, currentZoomRef.current);
    }
  }, [filteredSellers, renderMarkers]);

  // 現在地に移動
  const goToCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("位置情報がサポートされていません");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        mapRef.current?.setZoom(15);
      },
      () => toast.error("位置情報の取得に失敗しました")
    );
  };

  // 施設にフォーカス
  const focusFacility = (facilityId: string) => {
    const facility = facilities.find((f) => f.id === facilityId);
    if (!facility || !mapRef.current || !facility.latitude || !facility.longitude) return;
    mapRef.current.panTo({ lat: Number(facility.latitude), lng: Number(facility.longitude) });
    mapRef.current.setZoom(16);
    setFacilityFilter(facilityId);
    setShowFilterPanel(false);
  };

  const activeFilterCount =
    (facilityFilter !== "all" ? 1 : 0) + (gateFilter !== "all" ? 1 : 0);

  const isLoading = facilitiesLoading || sellersLoading;

  return (
    <AppLayout className="pb-0 overflow-hidden">
      {/* ヘッダー */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-3 pb-2 bg-gradient-to-b from-white/95 to-white/0 backdrop-blur-[2px]">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-xl shadow-md px-3 py-2.5 border border-stone-200">
            <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            {isLoading ? (
              <span className="flex items-center gap-1.5 text-sm text-stone-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                読み込み中
              </span>
            ) : (
              <span className="text-sm font-bold text-stone-700">
                {filteredSellers.length}件の売り場
              </span>
            )}
            <span className="text-xs text-stone-400 ml-auto">
              {facilityFilter !== "all"
                ? facilities.find((f) => f.id === facilityFilter)?.shortLabel
                : "全施設"}
            </span>
          </div>
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={cn(
              "relative w-10 h-10 flex items-center justify-center rounded-xl shadow-md border transition-colors",
              showFilterPanel
                ? "bg-emerald-700 border-emerald-700 text-white"
                : "bg-white border-stone-200 text-stone-600"
            )}
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* フィルタパネル */}
        {showFilterPanel && (
          <div className="mt-2 bg-white rounded-xl shadow-lg border border-stone-200 p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* 施設フィルタ */}
            <div>
              <p className="text-xs font-bold text-stone-500 mb-2">施設</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFacilityFilter("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-bold border transition-all",
                    facilityFilter === "all"
                      ? "bg-emerald-700 text-white border-emerald-700"
                      : "bg-white text-stone-600 border-stone-200 hover:border-emerald-400"
                  )}
                >
                  すべて
                </button>
                {facilities.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => focusFacility(f.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold border transition-all",
                      facilityFilter === f.id
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-white text-stone-600 border-stone-200 hover:border-emerald-400"
                    )}
                  >
                    {f.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* 改札内外フィルタ */}
            <div>
              <p className="text-xs font-bold text-stone-500 mb-2">改札</p>
              <div className="flex gap-1.5">
                {(
                  [
                    { value: "all", label: "すべて" },
                    { value: "inside", label: "改札内のみ" },
                    { value: "outside", label: "改札外のみ" },
                  ] as { value: GateFilter; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setGateFilter(opt.value)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold border transition-all",
                      gateFilter === opt.value
                        ? "bg-stone-900 text-white border-stone-900"
                        : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* クラスタ凡例 */}
            <div className="bg-stone-50 rounded-lg px-3 py-2">
              <p className="text-[10px] font-bold text-stone-500 mb-1.5">クラスタ凡例</p>
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center">
                    <span className="text-white text-[8px] font-black">N</span>
                  </div>
                  <span className="text-[10px] text-stone-600">改札内のみ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center">
                    <span className="text-white text-[8px] font-black">N</span>
                  </div>
                  <span className="text-[10px] text-stone-600">改札外のみ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-yellow-800 flex items-center justify-center">
                    <span className="text-white text-[8px] font-black">N</span>
                  </div>
                  <span className="text-[10px] text-stone-600">混在</span>
                </div>
              </div>
              <p className="text-[10px] text-stone-400 mt-2 leading-relaxed">
                同一施設内の複数店舗は、店舗ごとの正確な座標が未登録のため施設の代表地点付近に近似表示しています。
              </p>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setFacilityFilter("all");
                  setGateFilter("all");
                }}
                className="w-full py-2 text-xs font-bold text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50"
              >
                フィルタをリセット
              </button>
            )}
          </div>
        )}
      </div>

      {/* 地図本体 */}
      <div className="absolute inset-0 bottom-16">
        <MapView
          className="w-full h-full"
          initialCenter={{ lat: 35.6812, lng: 139.7671 }}
          initialZoom={13}
          onMapReady={handleMapReady}
        />
      </div>

      {/* 現在地ボタン */}
      <button
        onClick={goToCurrentLocation}
        className="absolute right-4 z-10 w-10 h-10 bg-white rounded-xl shadow-md border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors"
        style={{ bottom: selectedSeller ? "calc(200px + 4rem + 16px)" : "calc(4rem + 16px)" }}
      >
        <Navigation className="w-4.5 h-4.5 text-stone-600" />
      </button>

      {/* 凡例 */}
      <div
        className="absolute left-4 z-10 bg-white/95 rounded-xl shadow-md border border-stone-200 px-3 py-2 flex gap-3"
        style={{ bottom: selectedSeller ? "calc(200px + 4rem + 16px)" : "calc(4rem + 16px)" }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-700" />
          <span className="text-[10px] font-bold text-stone-600">改札内</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-[10px] font-bold text-stone-600">改札外</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-800" />
          <span className="text-[10px] font-bold text-stone-600">混在</span>
        </div>
      </div>

      {/* ── ボトムシート（売り場選択時） ── */}
      {selectedSeller && (
        <div className="absolute left-0 right-0 z-30 bg-white rounded-t-2xl shadow-2xl border-t border-stone-200 bottom-16">
          {/* ドラッグハンドル */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-8 h-1 bg-stone-300 rounded-full" />
          </div>

          {/* 閉じるボタン */}
          <button
            onClick={() => setSelectedSeller(null)}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200"
          >
            <X className="w-4 h-4 text-stone-500" />
          </button>

          <div className="px-4 pb-4">
            {/* 改札バッジ + 施設名 */}
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  "text-xs font-black px-2 py-0.5 rounded-full",
                  selectedSeller.seller.insideGate
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-orange-100 text-orange-700"
                )}
              >
                {selectedSeller.seller.insideGate ? "改札内" : "改札外"}
              </span>
              <span className="text-xs text-stone-500 truncate">
                {selectedSeller.facility.name}
              </span>
            </div>

            {/* 店舗名 */}
            <h3 className="text-base font-black text-stone-900 leading-snug">
              {selectedSeller.seller.storeName}
            </h3>

            {/* 場所情報 */}
            {(selectedSeller.seller.floor || selectedSeller.seller.location) && (
              <p className="text-xs text-stone-500 mt-0.5">
                {[selectedSeller.seller.floor, selectedSeller.seller.location].filter(Boolean).join(" · ")}
              </p>
            )}

            {/* メタ情報 */}
            <div className="flex gap-4 mt-2 flex-wrap">
              {selectedSeller.seller.walkMinutes != null && (
                <div className="flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-xs text-stone-600 font-medium">
                    徒歩{selectedSeller.seller.walkMinutes}分
                  </span>
                </div>
              )}
              {selectedSeller.seller.businessHours && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-xs text-stone-600 font-medium">
                    {selectedSeller.seller.businessHours}
                  </span>
                </div>
              )}
              {selectedSeller.seller.congestionLevel && (
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-stone-400" />
                  <span className={cn("text-xs font-bold", CROWD_COLOR[selectedSeller.seller.congestionLevel])}>
                    混雑{CROWD_LABEL[selectedSeller.seller.congestionLevel]}
                  </span>
                </div>
              )}
            </div>

            {/* 商品サマリー */}
            <div className="mt-3 flex gap-3 bg-stone-50 rounded-xl p-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                <img
                  src={getProductImage(selectedSeller.product)}
                  alt={selectedSeller.product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-stone-900 line-clamp-2 leading-snug">
                  {selectedSeller.product.name}
                </p>
                <p className="text-sm font-black text-stone-900 mt-0.5">
                  ¥{selectedSeller.product.price.toLocaleString()}
                </p>
              </div>
            </div>

            {/* 売り切れリスク */}
            {selectedSeller.seller.stockStatus && selectedSeller.seller.stockStatus !== "in_stock" && (
              <div className="mt-2 flex items-center gap-1.5 bg-amber-50 rounded-lg px-2.5 py-1.5">
                <span className="text-amber-500 text-xs">⚠️</span>
                <span className="text-xs font-bold text-amber-700">
                  {selectedSeller.seller.stockStatus === "out_of_stock" ? "在庫：売り切れ" : "在庫：残りわずか"}
                </span>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex gap-2 mt-3">
              <a
                href={
                  selectedSeller.seller.mapUrl ||
                  `https://maps.google.com/?q=${selectedSeller.coords.lat},${selectedSeller.coords.lng}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold text-center hover:bg-stone-200 transition-colors"
              >
                Googleマップで開く
              </a>
              <button
                onClick={() => navigate(`/db-product/${selectedSeller.product.id}`)}
                className="flex-1 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 hover:bg-emerald-800 transition-colors"
              >
                商品詳細へ
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 売り場なし時のメッセージ */}
      {!isLoading && filteredSellers.length === 0 && (
        <div className="absolute bottom-20 left-4 right-4 z-10 bg-white rounded-xl shadow-md border border-stone-200 px-4 py-3 text-center">
          <p className="text-sm font-bold text-stone-600">
            条件に合う売り場が見つかりません
          </p>
          <button
            onClick={() => { setFacilityFilter("all"); setGateFilter("all"); }}
            className="mt-1 text-xs font-bold text-emerald-700"
          >
            フィルタをリセット
          </button>
        </div>
      )}
    </AppLayout>
  );
}
