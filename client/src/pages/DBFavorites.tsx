/**
 * DBFavorites - お気に入りページ（DBベース）
 * お気に入り商品の一覧表示・近接通知設定・プッシュ通知管理
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { Heart, Bell, BellOff, MapPin, Navigation, Loader2, Trash2, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// カテゴリ別フォールバック画像
const CATEGORY_IMAGES: Record<string, string> = {
  "和菓子": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80",
  "洋菓子": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  "スナック": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80",
  "飲料": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80",
  "食品": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
  "工芸品": "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80",
};
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&q=80";

function getProductImage(imageUrl?: string | null, realImageUrl?: string | null, category?: string): string {
  if (realImageUrl) return realImageUrl;
  if (imageUrl) return imageUrl;
  return CATEGORY_IMAGES[category ?? ""] ?? DEFAULT_IMAGE;
}

export default function DBFavorites() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    permission,
    isSubscribed,
    isLoading: pushLoading,
    isSupported,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [locationState, setLocationState] = useState<
    | { status: "idle" }
    | { status: "requesting" }
    | { status: "granted"; lat: number; lng: number }
    | { status: "denied" }
  >({ status: "idle" });

  const { data: favoritesData, isLoading, refetch } = trpc.notifications.getFavorites.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const removeFavoriteMutation = trpc.notifications.removeFavorite.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("お気に入りから削除しました");
    },
  });

  const checkNearbyMutation = trpc.notifications.checkNearby.useMutation({
    onSuccess: (data) => {
      if (data.notified > 0) {
        toast.success(`${data.notified}件の近隣通知を送信しました`);
      } else if (data.nearby.length > 0) {
        toast.success(`近くに売り場があります: ${data.nearby.map((f) => `${f.facilityName}（${f.distanceMeters}m）`).join("、")}`);
      } else {
        toast("近くにお気に入りの売り場はありません");
      }
    },
  });

  // 位置情報を取得して近接チェック
  const handleCheckNearby = () => {
    if (!navigator.geolocation) {
      toast.error("位置情報に対応していません");
      return;
    }
    setLocationState({ status: "requesting" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationState({ status: "granted", lat: latitude, lng: longitude });
        checkNearbyMutation.mutate({ latitude, longitude, radiusMeters: 500 });
      },
      () => {
        setLocationState({ status: "denied" });
        toast.error("位置情報の取得に失敗しました");
      },
      { timeout: 10000 }
    );
  };

  // ログインしていない場合
  if (!authLoading && !isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <Heart className="w-16 h-16 text-stone-300 mb-4" />
          <h2 className="text-xl font-black text-stone-800 mb-2">お気に入りを使うにはログインが必要です</h2>
          <p className="text-sm text-stone-500 mb-6">ログインすると、気になるお土産を保存して、近くに来たら通知を受け取れます。</p>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => { window.location.href = getLoginUrl(); }}
          >
            ログインする
          </Button>
        </div>
      </AppLayout>
    );
  }

  const favorites = favoritesData ?? [];

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-24 space-y-5">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-stone-900">お気に入り</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              {favorites.length}件のお土産を保存中
            </p>
          </div>
          {isAuthenticated && (
            <button
              onClick={handleCheckNearby}
              disabled={checkNearbyMutation.isPending || locationState.status === "requesting"}
              className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-full disabled:opacity-50"
            >
              {locationState.status === "requesting" || checkNearbyMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              近くをチェック
            </button>
          )}
        </div>

        {/* プッシュ通知設定バナー */}
        {isSupported && isAuthenticated && (
          <div className={cn(
            "flex items-center justify-between rounded-xl px-4 py-3 border",
            isSubscribed
              ? "bg-emerald-50 border-emerald-200"
              : "bg-amber-50 border-amber-200"
          )}>
            <div className="flex items-center gap-2">
              {isSubscribed ? (
                <Bell className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <BellOff className="w-4 h-4 text-amber-500 flex-shrink-0" />
              )}
              <div>
                <p className={cn(
                  "text-sm font-bold",
                  isSubscribed ? "text-emerald-800" : "text-amber-800"
                )}>
                  {isSubscribed ? "プッシュ通知オン" : "プッシュ通知をオンにする"}
                </p>
                <p className={cn(
                  "text-xs",
                  isSubscribed ? "text-emerald-600" : "text-amber-600"
                )}>
                  {isSubscribed
                    ? "お気に入りの売り場に近づくと通知します"
                    : "近くに来たら自動でお知らせします"}
                </p>
              </div>
            </div>
            <Switch
              checked={isSubscribed}
              disabled={pushLoading || permission === "denied"}
              onCheckedChange={async (checked) => {
                if (checked) {
                  const ok = await subscribe();
                  if (!ok && permission === "denied") {
                    toast.error("通知がブロックされています。ブラウザの設定から通知を許可してください");
                  }
                } else {
                  await unsubscribe();
                }
              }}
            />
          </div>
        )}

        {/* ローディング */}
        {(isLoading || authLoading) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
          </div>
        )}

        {/* お気に入りリスト */}
        {!isLoading && !authLoading && favorites.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="w-12 h-12 text-stone-200 mb-3" />
            <p className="text-stone-500 font-bold">まだお気に入りがありません</p>
            <p className="text-xs text-stone-400 mt-1">商品ページのハートマークをタップして保存しましょう</p>
            <Button
              variant="outline"
              className="mt-4 text-emerald-700 border-emerald-300"
              onClick={() => navigate("/search")}
            >
              お土産を探す
            </Button>
          </div>
        )}

        {!isLoading && favorites.length > 0 && (
          <div className="space-y-3">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm"
              >
                <div className="flex items-center gap-3 p-3">
                  {/* 商品画像 */}
                  <div
                    className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                    onClick={() => navigate(`/db-product/${fav.productId}`)}
                  >
                    <img
                      src={getProductImage(fav.product.imageUrl, fav.product.realImageUrl, fav.product.category)}
                      alt={fav.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                      }}
                    />
                  </div>

                  {/* 商品情報 */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/db-product/${fav.productId}`)}
                  >
                    <p className="text-xs text-stone-400">{fav.product.prefecture} · {fav.product.category}</p>
                    <p className="text-sm font-bold text-stone-900 leading-tight line-clamp-2 mt-0.5">
                      {fav.product.name}
                    </p>
                    <p className="text-sm font-black text-emerald-700 mt-1">
                      ¥{fav.product.price.toLocaleString()}
                    </p>
                  </div>

                  {/* アクション */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/db-product/${fav.productId}`)}
                      className="text-stone-400 hover:text-emerald-600 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => removeFavoriteMutation.mutate({ productId: fav.productId })}
                      disabled={removeFavoriteMutation.isPending}
                      className="text-stone-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 近接通知設定 */}
                <div className="border-t border-stone-100 px-3 py-2 flex items-center justify-between bg-stone-50">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span className="text-xs text-stone-500">近くに来たら通知</span>
                  </div>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    fav.notifyNearby
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-stone-100 text-stone-500"
                  )}>
                    {fav.notifyNearby ? "オン" : "オフ"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 使い方説明 */}
        {isAuthenticated && favorites.length > 0 && (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Navigation className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-stone-700">近接通知の使い方</p>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  「近くをチェック」ボタンを押すと、現在地から500m以内にお気に入り商品の売り場があれば通知します。プッシュ通知をオンにすると、アプリを開かなくても自動でお知らせします。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
