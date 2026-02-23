// ============================================================
// Omiyage Go - マップ画面
// デザイン哲学: 駅案内板スタイル - 「どこで買えるか」を地図で即把握
// 機能: 全売り場ピン表示・クラスタリング・施設/改札フィルタ・ボトムシート・商品詳細連携
// ============================================================
import { useRef, useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import {
  MapPin,
  SlidersHorizontal,
  X,
  Navigation,
  Clock,
  Users,
  ChevronRight,
} from "lucide-react";
import { MapView } from "@/components/Map";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { PRODUCTS, FACILITIES, type FacilityId, type Seller, type Product } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 全売り場を商品と紐付けて一覧化
interface SellerWithProduct {
  seller: Seller;
  product: Product;
}

function getAllSellers(): SellerWithProduct[] {
  const result: SellerWithProduct[] = [];
  PRODUCTS.forEach((product) => {
    product.sellers.forEach((seller) => {
      result.push({ seller, product });
    });
  });
  return result;
}

const ALL_SELLERS = getAllSellers();

// 改札内外フィルタ
type GateFilter = "all" | "inside" | "outside";

// 混雑レベルの色
const crowdColor = {
  少: "text-emerald-600",
  中: "text-amber-600",
  多: "text-red-600",
};

// ── クラスタリングロジック ──────────────────────────────────────
// ズームレベルに応じて近接ピンをグループ化する純粋JS実装
interface ClusterGroup {
  center: { lat: number; lng: number };
  items: SellerWithProduct[];
}

/**
 * ズームレベルから1ピクセルあたりの緯度/経度を計算し、
 * 近接閾値（ピクセル単位）内のマーカーをクラスタ化する
 */
function clusterSellers(
  sellers: SellerWithProduct[],
  zoom: number,
  thresholdPx = 60
): ClusterGroup[] {
  // ズームレベルから1ピクセルあたりの度数を計算
  // Google Maps: zoom=0 で全世界が256px
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
      const dLat = Math.abs(item.seller.coords.lat - other.seller.coords.lat);
      const dLng = Math.abs(item.seller.coords.lng - other.seller.coords.lng);
      if (dLat < threshold && dLng < threshold) {
        group.push(other);
        assigned.add(j);
      }
    });

    // クラスタ中心 = グループの重心
    const centerLat = group.reduce((s, g) => s + g.seller.coords.lat, 0) / group.length;
    const centerLng = group.reduce((s, g) => s + g.seller.coords.lng, 0) / group.length;
    clusters.push({ center: { lat: centerLat, lng: centerLng }, items: group });
  });

  return clusters;
}

// 単体ピン要素
function createPinElement(gateStatus: "改札内" | "改札外", isSelected: boolean) {
  const el = document.createElement("div");
  const color = gateStatus === "改札内" ? "#15803d" : "#ea580c";
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
  // 改札内のみ→緑、改札外のみ→橙、混在→グラデーション
  let bg = "#15803d";
  if (hasInsideGate && hasOutsideGate) bg = "#854d0e"; // 混在=茶
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
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const currentZoomRef = useRef<number>(13);

  // フィルタ状態
  const [facilityFilter, setFacilityFilter] = useState<FacilityId | "all">("all");
  const [gateFilter, setGateFilter] = useState<GateFilter>("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // 選択中の売り場
  const [selectedSeller, setSelectedSeller] = useState<SellerWithProduct | null>(null);

  // フィルタ済み売り場
  const filteredSellers = ALL_SELLERS.filter(({ seller }) => {
    if (facilityFilter !== "all" && seller.facilityId !== facilityFilter) return false;
    if (gateFilter === "inside" && seller.gateStatus !== "改札内") return false;
    if (gateFilter === "outside" && seller.gateStatus !== "改札外") return false;
    return true;
  });

  // ── マーカー（クラスタ対応）を再描画 ──
  const renderMarkers = useCallback(
    (map: google.maps.Map, zoom: number) => {
      // 既存マーカーを全削除
      markersRef.current.forEach((m) => (m.map = null));
      markersRef.current = [];

      const clusters = clusterSellers(filteredSellers, zoom);

      clusters.forEach((cluster) => {
        const isSingle = cluster.items.length === 1;

        if (isSingle) {
          // 単体ピン
          const { seller, product } = cluster.items[0];
          const isSelected = selectedSeller?.seller.id === seller.id;
          const pinEl = createPinElement(seller.gateStatus, isSelected);

          const marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: seller.coords,
            title: seller.shopName,
            content: pinEl,
          });

          marker.addListener("click", () => {
            setSelectedSeller({ seller, product });
            map.panTo(seller.coords);
            map.setZoom(Math.max(zoom, 16));
          });

          markersRef.current.push(marker);
        } else {
          // クラスタバブル
          const hasInside = cluster.items.some((i) => i.seller.gateStatus === "改札内");
          const hasOutside = cluster.items.some((i) => i.seller.gateStatus === "改札外");
          const clusterEl = createClusterElement(cluster.items.length, hasInside, hasOutside);

          const marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: cluster.center,
            title: `${cluster.items.length}件の売り場`,
            content: clusterEl,
          });

          marker.addListener("click", () => {
            // クラスタをクリック → ズームイン
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

      // 交通レイヤー
      new google.maps.TransitLayer().setMap(map);

      renderMarkers(map, 13);

      // ズーム変更時にクラスタを再計算
      map.addListener("zoom_changed", () => {
        const z = map.getZoom() ?? 13;
        currentZoomRef.current = z;
        renderMarkers(map, z);
      });

      // 現在地取得
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
  const focusFacility = (facilityId: FacilityId) => {
    const facility = FACILITIES.find((f) => f.id === facilityId);
    if (!facility || !mapRef.current) return;
    mapRef.current.panTo(facility.coords);
    mapRef.current.setZoom(16);
    setFacilityFilter(facilityId);
    setShowFilterPanel(false);
  };

  const activeFilterCount =
    (facilityFilter !== "all" ? 1 : 0) + (gateFilter !== "all" ? 1 : 0);

  return (
    <AppLayout className="pb-0 overflow-hidden">
      {/* ヘッダー */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-3 pb-2 bg-gradient-to-b from-white/95 to-white/0 backdrop-blur-[2px]">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-xl shadow-md px-3 py-2.5 border border-stone-200">
            <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span className="text-sm font-bold text-stone-700">
              {filteredSellers.length}件の売り場
            </span>
            <span className="text-xs text-stone-400 ml-auto">
              {facilityFilter !== "all"
                ? FACILITIES.find((f) => f.id === facilityFilter)?.shortLabel
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
          <div className="mt-2 bg-white rounded-xl shadow-lg border border-stone-200 p-4 space-y-4">
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
                {FACILITIES.filter((f) => f.id !== "all").map((f) => (
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
                  selectedSeller.seller.gateStatus === "改札内"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-orange-100 text-orange-700"
                )}
              >
                {selectedSeller.seller.gateStatus}
              </span>
              <span className="text-xs text-stone-500 truncate">
                {selectedSeller.seller.facilityName}
              </span>
            </div>

            {/* 店舗名 */}
            <h3 className="text-base font-black text-stone-900 leading-snug">
              {selectedSeller.seller.shopName}
            </h3>

            {/* 場所情報 */}
            <p className="text-xs text-stone-500 mt-0.5">
              {selectedSeller.seller.floor} · {selectedSeller.seller.landmark}
            </p>

            {/* メタ情報 */}
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-xs text-stone-600 font-medium">
                  徒歩{selectedSeller.seller.walkingMinutes}分
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-xs text-stone-600 font-medium">
                  {selectedSeller.seller.openHours}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-stone-400" />
                <span className={cn("text-xs font-bold", crowdColor[selectedSeller.seller.crowdLevel])}>
                  混雑{selectedSeller.seller.crowdLevel}
                </span>
              </div>
            </div>

            {/* 商品サマリー */}
            <div className="mt-3 flex gap-3 bg-stone-50 rounded-xl p-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                <img
                  src={selectedSeller.product.imageUrl}
                  alt={selectedSeller.product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-stone-900 line-clamp-2 leading-snug">
                  {selectedSeller.product.name}
                </p>
                <p className="text-sm font-black text-stone-900 mt-0.5">
                  {selectedSeller.product.priceLabel}
                </p>
                <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">
                  {selectedSeller.product.guaranteeOneLiner}
                </p>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex gap-2 mt-3">
              <a
                href={selectedSeller.seller.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold text-center hover:bg-stone-200 transition-colors"
              >
                Googleマップで開く
              </a>
              <button
                onClick={() => navigate(`/product/${selectedSeller.product.id}`)}
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
      {filteredSellers.length === 0 && (
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
