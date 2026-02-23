// ============================================================
// Omiyage Go - 売り場詳細画面（Google Maps連携）
// デザイン哲学: 改札内外を最大強調、迷わずたどり着ける
// ============================================================
import { useRef, useState, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import {
  ChevronLeft,
  MapPin,
  Clock,
  Users,
  Navigation,
  Train,
  Layers,
  Route,
} from "lucide-react";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { MapView } from "@/components/Map";
import { PRODUCTS } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 施設ごとの座標データ
const FACILITY_COORDS: Record<string, google.maps.LatLngLiteral> = {
  "東京駅 八重洲地下街": { lat: 35.6812, lng: 139.7671 },
  "羽田空港 第1ターミナル": { lat: 35.5494, lng: 139.7798 },
  "東京駅 グランスタ": { lat: 35.6812, lng: 139.7671 },
  "東京駅 エキュート東京": { lat: 35.6812, lng: 139.7671 },
  "東京駅 グランスタ東京": { lat: 35.6812, lng: 139.7671 },
  "銀座本店": { lat: 35.6717, lng: 139.7650 },
  "品川駅 エキュート品川": { lat: 35.6284, lng: 139.7387 },
  "新宿駅 NEWoMan": { lat: 35.6896, lng: 139.7006 },
  "渋谷駅 渋谷ヒカリエ": { lat: 35.6591, lng: 139.7030 },
};

// 施設名から座標を取得（部分一致）
function getCoords(facilityName: string): google.maps.LatLngLiteral {
  for (const [key, coords] of Object.entries(FACILITY_COORDS)) {
    if (facilityName.includes(key) || key.includes(facilityName)) {
      return coords;
    }
  }
  // デフォルト: 東京駅
  return { lat: 35.6812, lng: 139.7671 };
}

type MapMode = "location" | "route" | "transit";

export default function SellerDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const transitLayerRef = useRef<google.maps.TransitLayer | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>("location");
  const [routeInfo, setRouteInfo] = useState<string | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // 売り場IDから商品と売り場を検索
  const found = PRODUCTS.flatMap((p) =>
    p.sellers.map((s) => ({ product: p, seller: s }))
  ).find(({ seller }) => seller.id === id);

  const seller = found?.seller;
  const product = found?.product;

  const sellerCoords = seller ? getCoords(seller.facilityName) : { lat: 35.6812, lng: 139.7671 };

  // 地図初期化
  const handleMapReady = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      map.setCenter(sellerCoords);
      map.setZoom(17);

      // 売り場マーカー（カスタムDOM）
      const markerEl = document.createElement("div");
      markerEl.innerHTML = `
        <div style="
          background: #15803d;
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid white;
        ">
          📍 ${seller?.facilityName ?? "売り場"}
        </div>
      `;

      markerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: sellerCoords,
        content: markerEl,
        title: seller?.facilityName,
      });

      // 交通機関レイヤー
      transitLayerRef.current = new google.maps.TransitLayer();
    },
    [sellerCoords, seller]
  );

  // ルート案内（現在地 → 売り場）
  const handleShowRoute = useCallback(() => {
    if (!mapRef.current) return;

    setIsLoadingRoute(true);
    setMapMode("route");

    // 既存のDirectionsRendererをクリア
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map: mapRef.current,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: "#15803d",
        strokeWeight: 5,
        strokeOpacity: 0.8,
      },
    });
    directionsRendererRef.current = directionsRenderer;

    // 現在地を取得してルート計算
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const origin = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          directionsService.route(
            {
              origin,
              destination: sellerCoords,
              travelMode: google.maps.TravelMode.WALKING,
            },
            (result, status) => {
              setIsLoadingRoute(false);
              if (status === "OK" && result) {
                directionsRenderer.setDirections(result);
                const leg = result.routes[0]?.legs[0];
                if (leg) {
                  setRouteInfo(
                    `徒歩 ${leg.duration?.text} (${leg.distance?.text})`
                  );
                }
                mapRef.current?.setZoom(15);
              } else {
                toast.error("ルート取得に失敗しました");
                setMapMode("location");
              }
            }
          );
        },
        () => {
          // 位置情報が取得できない場合は東京駅からのルートを表示
          setIsLoadingRoute(false);
          directionsService.route(
            {
              origin: { lat: 35.6812, lng: 139.7671 },
              destination: sellerCoords,
              travelMode: google.maps.TravelMode.WALKING,
            },
            (result, status) => {
              if (status === "OK" && result) {
                directionsRenderer.setDirections(result);
                const leg = result.routes[0]?.legs[0];
                if (leg) {
                  setRouteInfo(
                    `東京駅から徒歩 ${leg.duration?.text} (${leg.distance?.text})`
                  );
                }
                mapRef.current?.setZoom(15);
              }
            }
          );
          toast.info("位置情報が取得できないため、東京駅からのルートを表示します");
        }
      );
    } else {
      setIsLoadingRoute(false);
      toast.error("このブラウザは位置情報に対応していません");
    }
  }, [sellerCoords]);

  // 交通情報レイヤー切り替え
  const handleToggleTransit = useCallback(() => {
    if (!mapRef.current || !transitLayerRef.current) return;
    if (mapMode === "transit") {
      transitLayerRef.current.setMap(null);
      setMapMode("location");
    } else {
      transitLayerRef.current.setMap(mapRef.current);
      setMapMode("transit");
      // ルートをクリア
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
      setRouteInfo(null);
    }
  }, [mapMode]);

  // 売り場に戻る
  const handleResetMap = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.setCenter(sellerCoords);
    mapRef.current.setZoom(17);
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }
    if (transitLayerRef.current) {
      transitLayerRef.current.setMap(null);
    }
    setMapMode("location");
    setRouteInfo(null);
  }, [sellerCoords]);

  if (!found) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <p className="text-stone-500 mb-4">売り場情報が見つかりませんでした</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-emerald-700 text-white rounded-xl text-sm font-bold"
          >
            ホームに戻る
          </button>
        </div>
      </AppLayout>
    );
  }

  const isInside = seller!.gateStatus === "改札内";

  return (
    <AppLayout className="pb-0">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1 as any)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100"
        >
          <ChevronLeft className="w-5 h-5 text-stone-600" />
        </button>
        <div>
          <h1 className="text-base font-black text-stone-900">売り場情報</h1>
          <p className="text-xs text-stone-500">{product!.name}</p>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* 改札内外 - 最大強調 */}
        <div
          className={cn(
            "rounded-2xl p-5 text-center",
            isInside ? "bg-emerald-700" : "bg-orange-500"
          )}
        >
          <p className="text-white/80 text-sm font-medium mb-1">
            {seller!.facilityName}
          </p>
          <p className="text-white font-black text-4xl tracking-tight mb-1">
            {seller!.gateStatus}
          </p>
          <p className="text-white/90 text-sm">
            {isInside
              ? "改札内に入ってから購入できます"
              : "改札内に入る前に購入できます"}
          </p>
        </div>

        {/* 売り場詳細情報 */}
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          {[
            {
              icon: MapPin,
              label: "フロア・目印",
              value: `${seller!.floor} · ${seller!.landmark}`,
            },
            { icon: Clock, label: "営業時間", value: seller!.openHours },
            {
              icon: Navigation,
              label: "所要時間",
              value: `徒歩${seller!.walkingMinutes}分`,
            },
            {
              icon: Users,
              label: "混雑目安",
              value: `${seller!.crowdLevel}（目安）`,
              valueClass:
                seller!.crowdLevel === "少"
                  ? "text-emerald-700 font-bold"
                  : seller!.crowdLevel === "中"
                  ? "text-amber-600 font-bold"
                  : "text-red-500 font-bold",
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3 border-b border-stone-100 last:border-0"
              >
                <Icon className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-stone-400">{item.label}</p>
                  <p className={cn("text-sm text-stone-800 mt-0.5", item.valueClass)}>
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Google Maps インタラクティブ地図 ── */}
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              地図
            </h2>
            {/* 地図モード切り替えボタン */}
            <div className="flex gap-1.5">
              <button
                onClick={handleResetMap}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all",
                  mapMode === "location"
                    ? "bg-emerald-700 text-white border-emerald-700"
                    : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                )}
              >
                <MapPin className="w-3 h-3" />
                売り場
              </button>
              <button
                onClick={handleShowRoute}
                disabled={isLoadingRoute}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all",
                  mapMode === "route"
                    ? "bg-emerald-700 text-white border-emerald-700"
                    : "bg-white text-stone-500 border-stone-200 hover:border-stone-400",
                  isLoadingRoute && "opacity-60 cursor-not-allowed"
                )}
              >
                <Route className="w-3 h-3" />
                {isLoadingRoute ? "取得中..." : "ルート"}
              </button>
              <button
                onClick={handleToggleTransit}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all",
                  mapMode === "transit"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                )}
              >
                <Train className="w-3 h-3" />
                交通
              </button>
            </div>
          </div>

          {/* ルート情報バナー */}
          {routeInfo && (
            <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
              <Route className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <p className="text-sm font-bold text-emerald-800">{routeInfo}</p>
            </div>
          )}

          {/* 地図本体 */}
          <MapView
            initialCenter={sellerCoords}
            initialZoom={17}
            onMapReady={handleMapReady}
            className="h-64 w-full"
          />
        </div>

        {/* 外部マップリンク */}
        <div className="space-y-2.5">
          <button
            onClick={() =>
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  seller!.facilityName + " " + seller!.floor
                )}`,
                "_blank"
              )
            }
            className="w-full py-3.5 bg-emerald-700 text-white rounded-xl text-sm font-black hover:bg-emerald-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Google Mapsで開く
          </button>
        </div>

        {/* 商品に戻る */}
        <button
          onClick={() => navigate(`/product/${product!.id}`)}
          className="w-full py-3.5 bg-white border border-stone-200 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-50 transition-colors"
        >
          商品詳細に戻る
        </button>

        <div className="h-4" />
      </div>
    </AppLayout>
  );
}
