// ============================================================
// Omiyage Go - 売り場詳細画面（DB対応版 + Google Maps連携）
// ============================================================
import { useRef, useState, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import {
  ChevronLeft,
  MapPin,
  Clock,
  Navigation,
  Train,
  Route,
  Loader2,
  AlertCircle,
  Store,
  Package,
} from "lucide-react";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { MapView } from "@/components/Map";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// facilityIdから座標を取得するマッピング
const FACILITY_COORDS: Record<string, google.maps.LatLngLiteral> = {
  "tokyo-station": { lat: 35.6812, lng: 139.7671 },
  "haneda-t1": { lat: 35.5494, lng: 139.7798 },
  "haneda-t2": { lat: 35.5494, lng: 139.7798 },
  "haneda-t3": { lat: 35.5494, lng: 139.7798 },
  "narita-t1": { lat: 35.7647, lng: 140.3864 },
  "narita-t2": { lat: 35.7647, lng: 140.3864 },
  "shin-osaka": { lat: 34.7335, lng: 135.5001 },
  "osaka-station": { lat: 34.7024, lng: 135.4959 },
  "kyoto-station": { lat: 34.9857, lng: 135.7588 },
  "hakata-station": { lat: 33.5902, lng: 130.4208 },
  "shin-chitose": { lat: 42.7752, lng: 141.6922 },
  "sapporo-station": { lat: 43.0686, lng: 141.3507 },
  "nagoya-station": { lat: 35.1706, lng: 136.8816 },
  "sendai-station": { lat: 38.2604, lng: 140.8824 },
  "hiroshima-station": { lat: 34.3966, lng: 132.4759 },
  "naha-airport": { lat: 26.1958, lng: 127.6464 },
  "naha-station": { lat: 26.2124, lng: 127.6792 },
};

// facilityIdから日本語名を取得
const FACILITY_NAMES: Record<string, string> = {
  "tokyo-station": "東京駅",
  "haneda-t1": "羽田空港 第1ターミナル",
  "haneda-t2": "羽田空港 第2ターミナル",
  "haneda-t3": "羽田空港 第3ターミナル（国際線）",
  "narita-t1": "成田空港 第1ターミナル",
  "narita-t2": "成田空港 第2ターミナル",
  "shin-osaka": "新大阪駅",
  "osaka-station": "大阪駅",
  "kyoto-station": "京都駅",
  "hakata-station": "博多駅",
  "shin-chitose": "新千歳空港",
  "sapporo-station": "札幌駅",
  "nagoya-station": "名古屋駅",
  "sendai-station": "仙台駅",
  "hiroshima-station": "広島駅",
  "naha-airport": "那覇空港",
  "naha-station": "那覇駅",
};

function getFacilityCoords(facilityId: string): google.maps.LatLngLiteral {
  return FACILITY_COORDS[facilityId] ?? { lat: 35.6812, lng: 139.7671 };
}

function getFacilityName(facilityId: string): string {
  return FACILITY_NAMES[facilityId] ?? facilityId;
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

  // DBから売り場情報を取得
  const { data: sellerData, isLoading, error } = trpc.sellers.getById.useQuery(
    { id: id ?? "" },
    { enabled: !!id }
  );

  const seller = sellerData;
  const product = sellerData?.product;
  const facilityCoords = seller ? getFacilityCoords(seller.facilityId) : { lat: 35.6812, lng: 139.7671 };
  const facilityName = seller ? getFacilityName(seller.facilityId) : "";

  // 地図初期化
  const handleMapReady = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      map.setCenter(facilityCoords);
      map.setZoom(17);

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
          📍 ${seller?.storeName ?? "売り場"}
        </div>
      `;

      markerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: facilityCoords,
        content: markerEl,
        title: seller?.storeName,
      });

      transitLayerRef.current = new google.maps.TransitLayer();
    },
    [facilityCoords, seller]
  );

  // ルート案内
  const handleShowRoute = useCallback(() => {
    if (!mapRef.current) return;
    setIsLoadingRoute(true);
    setMapMode("route");

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

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          directionsService.route(
            { origin, destination: facilityCoords, travelMode: google.maps.TravelMode.WALKING },
            (result, status) => {
              setIsLoadingRoute(false);
              if (status === "OK" && result) {
                directionsRenderer.setDirections(result);
                const leg = result.routes[0]?.legs[0];
                if (leg) setRouteInfo(`徒歩 ${leg.duration?.text} (${leg.distance?.text})`);
                mapRef.current?.setZoom(15);
              } else {
                toast.error("ルート取得に失敗しました");
                setMapMode("location");
              }
            }
          );
        },
        () => {
          setIsLoadingRoute(false);
          directionsService.route(
            { origin: { lat: 35.6812, lng: 139.7671 }, destination: facilityCoords, travelMode: google.maps.TravelMode.WALKING },
            (result, status) => {
              if (status === "OK" && result) {
                directionsRenderer.setDirections(result);
                const leg = result.routes[0]?.legs[0];
                if (leg) setRouteInfo(`東京駅から徒歩 ${leg.duration?.text} (${leg.distance?.text})`);
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
  }, [facilityCoords]);

  // 交通情報レイヤー切り替え
  const handleToggleTransit = useCallback(() => {
    if (!mapRef.current || !transitLayerRef.current) return;
    if (mapMode === "transit") {
      transitLayerRef.current.setMap(null);
      setMapMode("location");
    } else {
      transitLayerRef.current.setMap(mapRef.current);
      setMapMode("transit");
      if (directionsRendererRef.current) directionsRendererRef.current.setMap(null);
      setRouteInfo(null);
    }
  }, [mapMode]);

  // 売り場に戻る
  const handleResetMap = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.setCenter(facilityCoords);
    mapRef.current.setZoom(17);
    if (directionsRendererRef.current) directionsRendererRef.current.setMap(null);
    if (transitLayerRef.current) transitLayerRef.current.setMap(null);
    setMapMode("location");
    setRouteInfo(null);
  }, [facilityCoords]);

  // ローディング状態
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-stone-500 text-sm">売り場情報を読み込み中...</p>
        </div>
      </AppLayout>
    );
  }

  // エラー・データなし
  if (error || !seller) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 gap-3">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-stone-500 text-sm">売り場情報が見つかりませんでした</p>
          <button
            onClick={() => navigate(-1 as any)}
            className="px-6 py-3 bg-emerald-700 text-white rounded-xl text-sm font-bold"
          >
            戻る
          </button>
        </div>
      </AppLayout>
    );
  }

  const isInside = seller.insideGate;

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
          {product && <p className="text-xs text-stone-500">{product.name}</p>}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4 pb-8">
        {/* 改札内外 - 最大強調 */}
        <div
          className={cn(
            "rounded-2xl p-5 text-center",
            isInside ? "bg-emerald-700" : "bg-orange-500"
          )}
        >
          <p className="text-white/80 text-sm font-medium mb-1">{facilityName}</p>
          <p className="text-white font-black text-4xl tracking-tight mb-1">
            {isInside ? "改札内" : "改札外"}
          </p>
          <p className="text-white/90 text-sm">
            {isInside
              ? "改札内に入ってから購入できます"
              : "改札内に入る前に購入できます"}
          </p>
        </div>

        {/* 売り場詳細情報 */}
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="flex items-start gap-3 px-4 py-3 border-b border-stone-100">
            <Store className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-stone-400">店舗名</p>
              <p className="text-sm text-stone-800 mt-0.5 font-bold">{seller.storeName}</p>
            </div>
          </div>
          {seller.floor && (
            <div className="flex items-start gap-3 px-4 py-3 border-b border-stone-100">
              <MapPin className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-stone-400">フロア</p>
                <p className="text-sm text-stone-800 mt-0.5">{seller.floor}</p>
              </div>
            </div>
          )}
          {seller.location && (
            <div className="flex items-start gap-3 px-4 py-3 border-b border-stone-100">
              <Navigation className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-stone-400">場所の詳細</p>
                <p className="text-sm text-stone-800 mt-0.5">{seller.location}</p>
              </div>
            </div>
          )}
          {seller.businessHours && (
            <div className="flex items-start gap-3 px-4 py-3 border-b border-stone-100">
              <Clock className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-stone-400">営業時間</p>
                <p className="text-sm text-stone-800 mt-0.5">{seller.businessHours}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3 px-4 py-3">
            <Package className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-stone-400">在庫状況</p>
              <p className={cn("text-sm mt-0.5 font-bold",
                seller.stockStatus === "in_stock" ? "text-green-700" :
                seller.stockStatus === "low_stock" ? "text-amber-600" : "text-red-500"
              )}>
                {seller.stockStatus === "in_stock" ? "在庫あり" :
                 seller.stockStatus === "low_stock" ? "残りわずか" : "在庫なし"}
              </p>
            </div>
          </div>
        </div>

        {/* Google Maps タブ */}
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-800">地図</h2>
            <div className="flex gap-1.5">
              {[
                { mode: "location" as MapMode, icon: MapPin, label: "地図" },
                { mode: "route" as MapMode, icon: Route, label: "ルート" },
                { mode: "transit" as MapMode, icon: Train, label: "交通" },
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => {
                    if (mode === "route") handleShowRoute();
                    else if (mode === "transit") handleToggleTransit();
                    else handleResetMap();
                  }}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors",
                    mapMode === mode
                      ? "bg-emerald-700 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  )}
                >
                  {isLoadingRoute && mode === "route" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Icon className="w-3 h-3" />
                  )}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {routeInfo && (
            <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100">
              <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                {routeInfo}
              </p>
            </div>
          )}

          <div className="h-64">
            <MapView
              onMapReady={handleMapReady}
              className="w-full h-full"
            />
          </div>

          <div className="px-4 py-3">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(seller.storeName + " " + facilityName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-700 text-white text-sm font-bold rounded-xl hover:bg-emerald-800 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Google Mapsで開く
            </a>
          </div>
        </div>

        {/* 商品に戻るボタン */}
        {product && (
          <button
            onClick={() => navigate(`/db-product/${product.id}`)}
            className="w-full py-3 border border-stone-200 text-stone-700 text-sm font-bold rounded-xl hover:bg-stone-50 transition-colors"
          >
            商品詳細に戻る
          </button>
        )}
      </div>
    </AppLayout>
  );
}
