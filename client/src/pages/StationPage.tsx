// ============================================================
// Omiyage Go - 施設（駅/空港）SEO入口ページ
// URL: /station/:facilityId
// SEO: 「東京駅 お土産」「羽田空港 お土産」等のキーワードで流入
// ============================================================
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { trpc } from "@/lib/trpc";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft, MapPin, ChevronRight, Package, Loader2, AlertCircle,
  Clock, Heart, Share2, Building2, Train, Plane
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

// 施設ID → メタ情報マッピング
const FACILITY_META: Record<string, {
  name: string;
  nameKana: string;
  type: "station" | "airport";
  prefecture: string;
  region: string;
  description: string;
  keywords: string[];
  image?: string;
}> = {
  "tokyo": {
    name: "東京駅", nameKana: "とうきょうえき", type: "station",
    prefecture: "東京都", region: "関東",
    description: "東京駅のお土産を徹底紹介。グランスタ東京・東京銘品館など改札内外の売り場情報、日持ちするお土産・個包装・手土産まで1,000種類以上から検索できます。",
    keywords: ["東京駅 お土産", "東京駅 手土産", "グランスタ お土産", "東京駅 お土産 日持ち", "東京駅 お土産 個包装"],
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
  },
  "haneda_t1": {
    name: "羽田空港 第1ターミナル", nameKana: "はねだくうこう だいいちたーみなる", type: "airport",
    prefecture: "東京都", region: "関東",
    description: "羽田空港第1ターミナルのお土産を紹介。ANAフライト前に買えるお土産・日持ちする手土産・空港限定品を一覧で比較できます。",
    keywords: ["羽田空港 お土産", "羽田 第1ターミナル お土産", "羽田空港 手土産", "空港 お土産 日持ち"],
  },
  "haneda_t2": {
    name: "羽田空港 第2ターミナル", nameKana: "はねだくうこう だいにたーみなる", type: "airport",
    prefecture: "東京都", region: "関東",
    description: "羽田空港第2ターミナルのお土産を紹介。JALフライト前に買えるお土産・日持ちする手土産・空港限定品を一覧で比較できます。",
    keywords: ["羽田空港 お土産", "羽田 第2ターミナル お土産", "羽田空港 手土産"],
  },
  "haneda_t3": {
    name: "羽田空港 第3ターミナル（国際線）", nameKana: "はねだくうこう だいさんたーみなる", type: "airport",
    prefecture: "東京都", region: "関東",
    description: "羽田空港国際線ターミナルのお土産を紹介。出国前・帰国時に買えるお土産・外国人向けギフト・日本のお菓子を一覧で比較できます。",
    keywords: ["羽田空港 国際線 お土産", "羽田 第3ターミナル お土産", "空港 お土産 外国人"],
  },
  "shinagawa": {
    name: "品川駅", nameKana: "しながわえき", type: "station",
    prefecture: "東京都", region: "関東",
    description: "品川駅のお土産を紹介。エキュート品川・品川エキュートエディションなど売り場情報、出張帰りの手土産・日持ちするお土産を検索できます。",
    keywords: ["品川駅 お土産", "品川駅 手土産", "エキュート品川 お土産", "品川 お土産 日持ち"],
  },
  "shinjuku": {
    name: "新宿駅", nameKana: "しんじゅくえき", type: "station",
    prefecture: "東京都", region: "関東",
    description: "新宿駅のお土産を紹介。NEWoMan・小田急百貨店・高島屋など売り場情報、手土産・贈り物・日持ちするお菓子を検索できます。",
    keywords: ["新宿駅 お土産", "新宿 手土産", "新宿 お土産 日持ち"],
  },
  "shibuya": {
    name: "渋谷駅", nameKana: "しぶやえき", type: "station",
    prefecture: "東京都", region: "関東",
    description: "渋谷駅のお土産を紹介。渋谷ヒカリエ・渋谷スクランブルスクエアなど売り場情報、手土産・贈り物を検索できます。",
    keywords: ["渋谷駅 お土産", "渋谷 手土産"],
  },
  "chitose": {
    name: "新千歳空港", nameKana: "しんちとせくうこう", type: "airport",
    prefecture: "北海道", region: "北海道",
    description: "新千歳空港のお土産を紹介。白い恋人・六花亭・ロイズなど北海道の定番お土産から空港限定品まで一覧で比較できます。",
    keywords: ["新千歳空港 お土産", "北海道 お土産 空港", "白い恋人 空港", "北海道 お土産 人気"],
    image: "https://images.unsplash.com/photo-1578637387939-43c525550085?w=800&q=80",
  },
  "kyoto": {
    name: "京都駅", nameKana: "きょうとえき", type: "station",
    prefecture: "京都府", region: "近畿",
    description: "京都駅のお土産を紹介。八ッ橋・京菓子・漬物など京都の定番お土産から日持ちする手土産まで一覧で比較できます。",
    keywords: ["京都駅 お土産", "京都 お土産", "八ッ橋 京都駅", "京都 手土産 日持ち"],
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
  },
  "osaka": {
    name: "大阪駅・新大阪駅", nameKana: "おおさかえき しんおおさかえき", type: "station",
    prefecture: "大阪府", region: "近畿",
    description: "大阪・新大阪駅のお土産を紹介。551蓬莱・りくろーおじさん・たこ焼きなど大阪の定番お土産から日持ちする手土産まで一覧で比較できます。",
    keywords: ["大阪 お土産", "新大阪 お土産", "大阪 手土産 日持ち", "551蓬莱 新大阪"],
    image: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&q=80",
  },
  "fukuoka": {
    name: "博多駅・福岡空港", nameKana: "はかたえき ふくおかくうこう", type: "station",
    prefecture: "福岡県", region: "九州・沖縄",
    description: "博多駅・福岡空港のお土産を紹介。明太子・博多通りもん・博多ラーメンなど福岡の定番お土産から日持ちする手土産まで一覧で比較できます。",
    keywords: ["博多 お土産", "福岡 お土産", "博多駅 お土産", "明太子 博多", "博多通りもん"],
  },
  "naha": {
    name: "那覇空港・国際通り", nameKana: "なはくうこう こくさいどおり", type: "airport",
    prefecture: "沖縄県", region: "九州・沖縄",
    description: "那覇空港・国際通りのお土産を紹介。ちんすこう・紅芋タルト・泡盛など沖縄の定番お土産から日持ちする手土産まで一覧で比較できます。",
    keywords: ["沖縄 お土産", "那覇 お土産", "ちんすこう", "紅芋タルト 沖縄", "沖縄 お土産 日持ち"],
  },
  "hiroshima": {
    name: "広島駅・広島空港", nameKana: "ひろしまえき ひろしまくうこう", type: "station",
    prefecture: "広島県", region: "中国",
    description: "広島駅・広島空港のお土産を紹介。もみじ饅頭・牡蠣など広島の定番お土産から日持ちする手土産まで一覧で比較できます。",
    keywords: ["広島 お土産", "広島駅 お土産", "もみじ饅頭", "広島 手土産"],
  },
  "nagoya": {
    name: "名古屋駅・中部国際空港", nameKana: "なごやえき ちゅうぶこくさいくうこう", type: "station",
    prefecture: "愛知県", region: "中部",
    description: "名古屋駅・中部国際空港のお土産を紹介。ういろう・えびせんべい・きしめんなど名古屋の定番お土産から日持ちする手土産まで一覧で比較できます。",
    keywords: ["名古屋 お土産", "名古屋駅 お土産", "ういろう", "名古屋 手土産"],
  },
  "sendai": {
    name: "仙台駅・仙台空港", nameKana: "せんだいえき せんだいくうこう", type: "station",
    prefecture: "宮城県", region: "東北",
    description: "仙台駅・仙台空港のお土産を紹介。萩の月・牛タン・ずんだ餅など仙台の定番お土産から日持ちする手土産まで一覧で比較できます。",
    keywords: ["仙台 お土産", "仙台駅 お土産", "萩の月", "ずんだ餅 仙台", "牛タン 仙台"],
  },
  "kanazawa": {
    name: "金沢駅", nameKana: "かなざわえき", type: "station",
    prefecture: "石川県", region: "中部",
    description: "金沢駅のお土産を紹介。和菓子・加賀棒茶・金箔など金沢の定番お土産から日持ちする手土産まで一覧で比較できます。",
    keywords: ["金沢 お土産", "金沢駅 お土産", "金沢 和菓子", "金沢 手土産"],
  },
};

// セッションID取得
function getSessionId(): string {
  let sid = localStorage.getItem("omiyage_session_id");
  if (!sid) {
    sid = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("omiyage_session_id", sid);
  }
  return sid;
}

export default function StationPage() {
  const params = useParams<{ facilityId: string }>();
  const [, navigate] = useLocation();
  const facilityId = params.facilityId;

  const meta = FACILITY_META[facilityId];

  // 施設の商品を取得
  const { data: facilityProducts, isLoading } = trpc.facilities.getProducts.useQuery(
    { facilityId, limit: 20, offset: 0 },
    { enabled: !!facilityId }
  );

  // 施設情報を取得
  const { data: facility } = trpc.facilities.get.useQuery(
    { id: facilityId },
    { enabled: !!facilityId }
  );

  // いいね
  const sessionId = useMemo(() => getSessionId(), []);
  const { data: likedIds = [], refetch: refetchLikes } = trpc.likes.getLikedIds.useQuery({ sessionId });
  const toggleLike = trpc.likes.toggle.useMutation({ onSuccess: () => refetchLikes() });

  if (!meta) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4 px-4">
          <AlertCircle className="w-10 h-10 text-stone-300" />
          <p className="text-base font-bold text-stone-700">施設が見つかりませんでした</p>
          <button onClick={() => navigate("/")} className="px-6 py-2.5 bg-emerald-700 text-white text-sm font-bold rounded-xl">
            トップへ戻る
          </button>
        </div>
      </AppLayout>
    );
  }

  const pageTitle = `${meta.name}のお土産 おすすめ${facilityProducts?.total ?? ""}選 | Omiyage Go`;
  const canonicalUrl = `https://omiyagego-axrcumbv.manus.space/station/${facilityId}`;

  return (
    <AppLayout>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords.join(", ")} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="website" />
        {meta.image && <meta property="og:image" content={meta.image} />}
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": `${meta.name}のお土産`,
          "description": meta.description,
          "url": canonicalUrl,
        })}</script>
      </Helmet>

      {/* ── ヘッダー ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => window.history.back()}
            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-stone-600" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-stone-900 truncate">{meta.name}のお土産</p>
            <p className="text-xs text-stone-500">{meta.prefecture}</p>
          </div>
        </div>
      </div>

      <div className="pb-24">
        {/* ── ヒーロー ── */}
        <div className="relative h-40 bg-gradient-to-br from-emerald-800 to-emerald-600 overflow-hidden">
          {meta.image && (
            <img src={meta.image} alt={meta.name} className="w-full h-full object-cover opacity-30" />
          )}
          <div className="absolute inset-0 flex flex-col justify-end p-4">
            <div className="flex items-center gap-2 mb-1">
              {meta.type === "airport" ? (
                <Plane className="w-5 h-5 text-white" />
              ) : (
                <Train className="w-5 h-5 text-white" />
              )}
              <p className="text-white font-black text-xl">{meta.name}</p>
            </div>
            <p className="text-white/80 text-sm">
              {facilityProducts?.total ?? ""}件のお土産を掲載中
            </p>
          </div>
        </div>

        {/* ── 施設説明 ── */}
        <div className="px-4 py-4 border-b border-stone-100 bg-stone-50">
          <p className="text-sm text-stone-600 leading-relaxed">{meta.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {meta.keywords.slice(0, 4).map((kw) => (
              <span key={kw} className="px-2.5 py-1 bg-white border border-stone-200 text-stone-600 text-xs rounded-full">
                #{kw}
              </span>
            ))}
          </div>
        </div>

        {/* ── 用途別クイックリンク ── */}
        <div className="px-4 py-4 border-b border-stone-100">
          <h2 className="text-sm font-bold text-stone-700 mb-3">用途から探す</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "greeting", label: "挨拶・手土産", icon: "🤝" },
              { id: "office", label: "社内配布", icon: "🏢" },
              { id: "thanks", label: "御礼・感謝", icon: "🙏" },
              { id: "snack", label: "差し入れ", icon: "☕" },
              { id: "family", label: "家族へ", icon: "👨‍👩‍👧" },
              { id: "self", label: "自分用", icon: "🎁" },
            ].map((purpose) => (
              <button
                key={purpose.id}
                onClick={() => navigate(`/station/${facilityId}/purpose/${purpose.id}`)}
                className="flex flex-col items-center gap-1 py-3 bg-stone-50 rounded-xl border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
              >
                <span className="text-xl">{purpose.icon}</span>
                <span className="text-[10px] font-bold text-stone-700 text-center leading-tight">{purpose.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 日持ち別クイックリンク ── */}
        <div className="px-4 py-4 border-b border-stone-100">
          <h2 className="text-sm font-bold text-stone-700 mb-3">日持ちから探す</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { min: 3, label: "3日以上" },
              { min: 7, label: "7日以上" },
              { min: 14, label: "2週間以上" },
              { min: 30, label: "1ヶ月以上" },
            ].map((shelf) => (
              <button
                key={shelf.min}
                onClick={() => navigate(`/db-search?facilityId=${facilityId}&minShelfLife=${shelf.min}`)}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                {shelf.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 商品一覧 ── */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-stone-700 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              {meta.name}で買えるお土産
            </h2>
            <button
              onClick={() => navigate(`/db-search?facilityId=${facilityId}`)}
              className="text-xs text-emerald-700 font-bold flex items-center gap-0.5"
            >
              すべて見る <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-sm text-stone-500">読み込み中...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(facilityProducts?.products ?? []).map((product) => {
                const isLiked = likedIds.includes(product.id);
                return (
                  <div
                    key={product.id}
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
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded-full flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />{product.prefecture}
                            </span>
                            {product.shelfLife && (
                              <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-medium rounded-full flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />{product.shelfLife}日
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                        <p className="text-sm font-black text-stone-900">¥{product.price.toLocaleString()}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleLike.mutate({ productId: product.id, sessionId }); }}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold transition-all",
                              isLiked ? "bg-rose-50 border-rose-300 text-rose-600" : "bg-white border-stone-200 text-stone-500"
                            )}
                          >
                            <Heart className={cn("w-3 h-3", isLiked && "fill-rose-500")} />
                          </button>
                          <button
                            className="px-3 py-1 bg-emerald-700 text-white text-xs font-bold rounded-lg"
                            onClick={(e) => { e.stopPropagation(); navigate(`/db-product/${product.id}`); }}
                          >
                            詳細
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* もっと見るボタン */}
          <button
            onClick={() => navigate(`/db-search?facilityId=${facilityId}`)}
            className="w-full mt-4 py-3 bg-stone-100 text-stone-700 text-sm font-bold rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center justify-center gap-2"
          >
            {meta.name}のお土産をすべて見る
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── 関連施設リンク ── */}
        <div className="px-4 py-4 border-t border-stone-100">
          <h2 className="text-sm font-bold text-stone-700 mb-3">他の施設のお土産</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(FACILITY_META)
              .filter(([id]) => id !== facilityId)
              .slice(0, 8)
              .map(([id, m]) => (
                <button
                  key={id}
                  onClick={() => navigate(`/station/${id}`)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-700 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                >
                  {m.type === "airport" ? <Plane className="w-3 h-3 text-stone-400" /> : <Train className="w-3 h-3 text-stone-400" />}
                  {m.name}
                </button>
              ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
