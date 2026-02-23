// ============================================================
// Omiyage Go - ホーム画面
// デザイン哲学: 駅案内板スタイル - 最短で用途を選ばせる
// ============================================================
import { useState } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, ChevronRight, Wifi, WifiOff } from "lucide-react";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { ProductCard } from "@/components/omiyage/ProductCard";
import { useSearch } from "@/contexts/SearchContext";
import { PURPOSE_LIST, PRODUCTS } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const HERO_IMAGE =
  "https://private-us-east-1.manuscdn.com/sessionFile/PzmyGBA8B4SwIi3RcwaikB/sandbox/hveQjdnUbdiIB1lgDKtpHG-img-1_1771832768000_na1fn_aGVyby1iYW5uZXI.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUHpteUdCQThCNFN3SWkzUmN3YWlrQi9zYW5kYm94L2h2ZVFqZG5VYmRpSUIxbGdES3RwSEctaW1nLTFfMTc3MTgzMjc2ODAwMF9uYTFmbl9hR1Z5YnkxaVlXNXVaWEkuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=b8wDwdVugzhFKEkJ8D0XoHbodWxeVv2hqI6YJCsAYqC7bYO0jGta~F6LrFZRURgxjGGBxJVRICBO6WcbRN5HEaKXGOhoFvmUnEptS6t1iyBXWdUWEsgMertjjCnwlr7siwhyoPC8L52STb2dBzP8Yv56ISE6RjIOvt6MMrVexWymW7JnKQE-eOF5omFxXXodEP5rmcu2gco2sM9QAtHANoHbPCDfa9Ef26RkO54FdiGZNAKiznac4xOkef213tOz6hH858LZ2z1jrP3u6rJIYuvuO5Pqdx2CSRSXpGtW-iYKVJqPxlNYF3IMG6zrlH-DR71xyOxIUhZeKTauCtdMjw__";

const FACILITIES = ["東京駅", "羽田空港", "品川駅", "新宿駅", "渋谷駅"];

export default function Home() {
  const [, navigate] = useLocation();
  const { updateCondition } = useSearch();
  const [searchText, setSearchText] = useState("");
  const [locationEnabled] = useState(true);

  const handlePurposeSelect = (purposeId: string) => {
    updateCondition("purpose", purposeId);
    navigate("/conditions");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchText.trim()) {
      navigate("/results");
    }
  };

  // 特集商品（編集部推薦のもの）
  const featuredProducts = PRODUCTS.filter((p) => p.badges.includes("editorial")).slice(0, 3);

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

        {/* 位置情報バナー */}
        {!locationEnabled && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-700">
                位置情報がオフです。施設を選ぶと探せます。
              </span>
            </div>
            <button className="text-xs font-bold text-emerald-700 whitespace-nowrap ml-2">
              施設を選ぶ
            </button>
          </div>
        )}

        {/* 施設選択 */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-stone-700">施設を選ぶ</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-emerald-700 text-white rounded-lg text-sm font-bold">
              <MapPin className="w-3.5 h-3.5" />
              現在地周辺
            </button>
            {FACILITIES.map((f) => (
              <button
                key={f}
                className="flex-shrink-0 px-3 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg text-sm font-medium hover:border-emerald-400 hover:text-emerald-700 transition-colors"
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* 用途カード */}
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

        {/* 特集バナー */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-black text-stone-900">
                編集部のおすすめ
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">外しにくい定番品</p>
            </div>
            <button
              onClick={() => navigate("/results")}
              className="flex items-center gap-1 text-xs font-bold text-emerald-700"
            >
              すべて見る
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* 法人モード入口 */}
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
