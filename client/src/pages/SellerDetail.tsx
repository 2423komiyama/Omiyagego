// ============================================================
// Omiyage Go - 売り場詳細画面
// デザイン哲学: 改札内外を最大強調、迷わずたどり着ける
// ============================================================
import { useLocation, useParams } from "wouter";
import { ChevronLeft, MapPin, Clock, Users, Navigation } from "lucide-react";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { PRODUCTS } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SellerDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  // 売り場IDから商品と売り場を検索
  const found = PRODUCTS.flatMap((p) =>
    p.sellers.map((s) => ({ product: p, seller: s }))
  ).find(({ seller }) => seller.id === id);

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

  const { product, seller } = found;
  const isInside = seller.gateStatus === "改札内";

  return (
    <AppLayout>
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
          <p className="text-xs text-stone-500">{product.name}</p>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* 改札内外 - 最大強調 */}
        <div
          className={cn(
            "rounded-2xl p-6 text-center",
            isInside
              ? "bg-emerald-700"
              : "bg-orange-500"
          )}
        >
          <p className="text-white/80 text-sm font-medium mb-1">
            {seller.facilityName}
          </p>
          <p className="text-white font-black text-4xl tracking-tight mb-2">
            {seller.gateStatus}
          </p>
          <p className="text-white/90 text-sm">
            {isInside
              ? "改札内に入ってから購入できます"
              : "改札内に入る前に購入できます"}
          </p>
        </div>

        {/* 売り場詳細情報 */}
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100">
            <h2 className="text-sm font-black text-stone-900">売り場詳細</h2>
          </div>

          {[
            {
              icon: MapPin,
              label: "フロア・目印",
              value: `${seller.floor} · ${seller.landmark}`,
            },
            {
              icon: Clock,
              label: "営業時間",
              value: seller.openHours,
            },
            {
              icon: Navigation,
              label: "所要時間",
              value: `徒歩${seller.walkingMinutes}分`,
            },
            {
              icon: Users,
              label: "混雑目安",
              value: `${seller.crowdLevel}（目安）`,
              valueClass:
                seller.crowdLevel === "少"
                  ? "text-emerald-700 font-bold"
                  : seller.crowdLevel === "中"
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
                  <p
                    className={cn(
                      "text-sm text-stone-800 mt-0.5",
                      item.valueClass
                    )}
                  >
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ルート案内 */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-stone-700 mb-2">
            ルート案内
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            現在地 → {seller.facilityName} {seller.floor} {seller.landmark}
          </p>
          <p className="text-xs text-stone-400 mt-1">
            所要時間: 徒歩約{seller.walkingMinutes}分
          </p>
        </div>

        {/* 地図リンク */}
        <div className="space-y-2.5">
          <button
            onClick={() => window.open(seller.mapUrl, "_blank")}
            className="w-full py-4 bg-emerald-700 text-white rounded-xl text-sm font-black hover:bg-emerald-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            地図で開く（Google Maps）
          </button>
          <button
            onClick={() =>
              window.open(
                `maps://maps.apple.com/?q=${encodeURIComponent(seller.facilityName)}`,
                "_blank"
              )
            }
            className="w-full py-3.5 bg-white border-2 border-stone-200 text-stone-700 rounded-xl text-sm font-bold hover:bg-stone-50 active:scale-[0.98] transition-all"
          >
            Apple Mapsで開く
          </button>
        </div>

        {/* 商品に戻る */}
        <button
          onClick={() => navigate(`/product/${product.id}`)}
          className="w-full py-3.5 bg-white border border-stone-200 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-50 transition-colors"
        >
          商品詳細に戻る
        </button>

        <div className="h-4" />
      </div>
    </AppLayout>
  );
}
