// ============================================================
// Omiyage Go - お気に入り画面（比較機能付き）
// デザイン哲学: 駅案内板スタイル - 保存した候補を素早く比較
// ============================================================
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Heart,
  Trash2,
  BarChart2,
  X,
  ChevronRight,
  Check,
  AlertCircle,
} from "lucide-react";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { useFavorites } from "@/contexts/FavoritesContext";
import { PRODUCTS } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Favorites() {
  const [, navigate] = useLocation();
  const {
    favorites,
    removeFavorite,
    clearFavorites,
    compareList,
    toggleCompare,
    isInCompare,
    clearCompare,
  } = useFavorites();
  const [showCompare, setShowCompare] = useState(false);

  const favoriteProducts = PRODUCTS.filter((p) => favorites.includes(p.id));
  const compareProducts = PRODUCTS.filter((p) => compareList.includes(p.id));

  const handleRemove = (id: string) => {
    removeFavorite(id);
    toast.success("お気に入りから削除しました");
  };

  const handleClearAll = () => {
    clearFavorites();
    clearCompare();
    toast.success("お気に入りをすべて削除しました");
  };

  const compareRows: { label: string; key: (p: (typeof PRODUCTS)[0]) => string }[] = [
    { label: "価格", key: (p) => p.priceLabel },
    { label: "日持ち", key: (p) => `${p.shelfLifeDays}日` },
    { label: "個包装", key: (p) => (p.individuallyWrapped ? "あり" : "なし") },
    { label: "人数目安", key: (p) => `${p.recommendedCount}人` },
    { label: "温度帯", key: (p) => p.temperature },
    {
      label: "改札内",
      key: (p) =>
        p.sellers.some((s) => s.gateStatus === "改札内") ? "あり" : "改札外のみ",
    },
    { label: "取り置き", key: (p) => (p.canReserve ? "可能" : "不可") },
    { label: "配送", key: (p) => (p.canDeliver ? "可能" : "不可") },
  ];

  return (
    <AppLayout>
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-black text-stone-900">お気に入り</h1>
          <p className="text-xs text-stone-500">{favoriteProducts.length}件保存中</p>
        </div>
        <div className="flex gap-2">
          {compareList.length > 0 && (
            <button
              onClick={() => setShowCompare(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              比較 ({compareList.length})
            </button>
          )}
          {favoriteProducts.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-600 rounded-lg text-xs font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              全削除
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 pb-6">
        {/* 空状態 */}
        {favoriteProducts.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-stone-300" />
            </div>
            <h2 className="text-base font-black text-stone-900 mb-2">
              お気に入りはまだありません
            </h2>
            <p className="text-sm text-stone-500 mb-6 max-w-xs">
              商品詳細画面のハートボタンを押すと、ここに保存されます。
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-emerald-700 text-white rounded-xl text-sm font-black hover:bg-emerald-800 transition-colors"
            >
              お土産を探す
            </button>
          </div>
        ) : (
          <>
            {/* 比較ヒント */}
            {compareList.length === 0 && favoriteProducts.length > 1 && (
              <div className="mb-4 flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  「比較に追加」ボタンで最大3件を並べて比較できます
                </p>
              </div>
            )}

            {/* 商品リスト */}
            <div className="space-y-3">
              {favoriteProducts.map((product) => {
                const inCompare = isInCompare(product.id);
                const isInside = product.sellers.some(
                  (s) => s.gateStatus === "改札内"
                );

                return (
                  <div
                    key={product.id}
                    className={cn(
                      "bg-white border rounded-xl overflow-hidden transition-all",
                      inCompare
                        ? "border-emerald-400 ring-2 ring-emerald-200"
                        : "border-stone-200"
                    )}
                  >
                    {/* 比較選択バー */}
                    <button
                      onClick={() => {
                        if (!inCompare && compareList.length >= 3) {
                          toast.error("比較は最大3件までです");
                          return;
                        }
                        toggleCompare(product.id);
                      }}
                      className={cn(
                        "w-full px-3 py-2 flex items-center gap-2 text-xs font-bold border-b transition-colors",
                        inCompare
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-stone-50 border-stone-100 text-stone-500 hover:bg-stone-100"
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0",
                          inCompare
                            ? "bg-emerald-700 border-emerald-700"
                            : "border-stone-300"
                        )}
                      >
                        {inCompare && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      {inCompare ? "比較に追加済み" : "比較に追加"}
                    </button>

                    {/* 商品情報 */}
                    <div
                      className="flex gap-3 p-3 cursor-pointer"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-stone-900 leading-snug line-clamp-2">
                              {product.name}
                            </p>
                            <p className="text-base font-black text-stone-900 mt-1">
                              {product.priceLabel}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(product.id);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 flex-shrink-0"
                          >
                            <Heart className="w-4 h-4 fill-red-400 text-red-400" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span
                            className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded",
                              isInside
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-orange-100 text-orange-700"
                            )}
                          >
                            {isInside ? "改札内" : "改札外"}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            日持ち{product.shelfLifeDays}日
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {product.temperature}
                          </span>
                        </div>

                        <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">
                          {product.guaranteeOneLiner}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="w-full px-4 py-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
                    >
                      商品詳細を見る
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── 比較モーダル ── */}
      {showCompare && compareProducts.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-white sticky top-0">
            <div>
              <h2 className="text-base font-black text-stone-900">商品比較</h2>
              <p className="text-xs text-stone-500">
                {compareProducts.length}件を比較中
              </p>
            </div>
            <button
              onClick={() => setShowCompare(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100"
            >
              <X className="w-5 h-5 text-stone-600" />
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 bg-stone-50 z-10">
                <tr>
                  <th className="text-left px-3 py-2 text-stone-500 font-medium border-b border-r border-stone-200 w-20">
                    項目
                  </th>
                  {compareProducts.map((p) => (
                    <th
                      key={p.id}
                      className="px-2 py-2 border-b border-stone-200 text-center"
                    >
                      <div className="w-12 h-12 mx-auto rounded-lg overflow-hidden mb-1 bg-stone-100">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="font-black text-stone-900 leading-tight line-clamp-2 text-[10px]">
                        {p.name}
                      </p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={i % 2 === 0 ? "bg-white" : "bg-stone-50"}
                  >
                    <td className="px-3 py-2.5 text-stone-500 font-medium border-r border-stone-200 whitespace-nowrap">
                      {row.label}
                    </td>
                    {compareProducts.map((p) => {
                      const val = row.key(p);
                      const isGood =
                        (row.label === "個包装" && val === "あり") ||
                        (row.label === "改札内" && val === "あり") ||
                        (row.label === "取り置き" && val === "可能") ||
                        (row.label === "配送" && val === "可能");
                      return (
                        <td
                          key={p.id}
                          className={cn(
                            "px-2 py-2.5 text-center font-bold",
                            isGood ? "text-emerald-700" : "text-stone-700"
                          )}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 保証書比較 */}
            <div className="px-4 py-4 border-t border-stone-200">
              <h3 className="text-sm font-black text-stone-900 mb-3">
                保証書の比較
              </h3>
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: `repeat(${compareProducts.length}, 1fr)`,
                }}
              >
                {compareProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-amber-50 border border-amber-200 rounded-xl p-3"
                  >
                    <p className="text-[10px] font-black text-amber-800 mb-1.5 line-clamp-1">
                      {p.name}
                    </p>
                    <ul className="space-y-1">
                      {p.guaranteeReasons.slice(0, 3).map((r, ri) => (
                        <li
                          key={ri}
                          className="text-[10px] text-amber-700 flex items-start gap-1"
                        >
                          <span className="text-amber-500 flex-shrink-0">✓</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* 選択ボタン */}
            <div className="px-4 pb-6 space-y-2">
              {compareProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setShowCompare(false);
                    navigate(`/product/${p.id}`);
                  }}
                  className="w-full py-3 bg-emerald-700 text-white rounded-xl text-sm font-black hover:bg-emerald-800 transition-colors"
                >
                  {p.name}を選ぶ
                </button>
              ))}
              <button
                onClick={() => {
                  clearCompare();
                  setShowCompare(false);
                }}
                className="w-full py-3 bg-white border border-stone-200 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-50 transition-colors"
              >
                比較をリセット
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
