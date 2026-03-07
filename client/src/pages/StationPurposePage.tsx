// ============================================================
// Omiyage Go - 施設×用途 複合SEOページ
// URL: /station/:facilityId/purpose/:purposeId
// SEO: 「東京駅 挨拶 お土産」「羽田空港 手土産 日持ち」等のキーワードで流入
// 14施設 × 8用途 = 112 固定URLページ
// ============================================================
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { trpc } from "@/lib/trpc";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft, MapPin, ChevronRight, Package, Loader2, AlertCircle,
  Clock, Heart, Share2, Building2, Train, Plane, Gift, CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

// ── 施設メタ情報 ──────────────────────────────────────────
const FACILITY_META: Record<string, {
  name: string;
  type: "station" | "airport";
  prefecture: string;
  region: string;
  shortName: string;
}> = {
  "tokyo": { name: "東京駅", shortName: "東京駅", type: "station", prefecture: "東京都", region: "関東" },
  "haneda_t1": { name: "羽田空港 第1ターミナル", shortName: "羽田空港T1", type: "airport", prefecture: "東京都", region: "関東" },
  "haneda_t2": { name: "羽田空港 第2ターミナル", shortName: "羽田空港T2", type: "airport", prefecture: "東京都", region: "関東" },
  "haneda_t3": { name: "羽田空港 第3ターミナル（国際線）", shortName: "羽田空港T3", type: "airport", prefecture: "東京都", region: "関東" },
  "shinagawa": { name: "品川駅", shortName: "品川駅", type: "station", prefecture: "東京都", region: "関東" },
  "shinjuku": { name: "新宿駅", shortName: "新宿駅", type: "station", prefecture: "東京都", region: "関東" },
  "shibuya": { name: "渋谷駅", shortName: "渋谷駅", type: "station", prefecture: "東京都", region: "関東" },
  "chitose": { name: "新千歳空港", shortName: "新千歳空港", type: "airport", prefecture: "北海道", region: "北海道" },
  "kyoto": { name: "京都駅", shortName: "京都駅", type: "station", prefecture: "京都府", region: "近畿" },
  "osaka": { name: "大阪駅・梅田", shortName: "大阪駅", type: "station", prefecture: "大阪府", region: "近畿" },
  "fukuoka": { name: "博多駅", shortName: "博多駅", type: "station", prefecture: "福岡県", region: "九州" },
  "naha": { name: "那覇空港", shortName: "那覇空港", type: "airport", prefecture: "沖縄県", region: "九州・沖縄" },
  "hiroshima": { name: "広島駅", shortName: "広島駅", type: "station", prefecture: "広島県", region: "中国" },
  "nagoya": { name: "名古屋駅", shortName: "名古屋駅", type: "station", prefecture: "愛知県", region: "中部" },
  "sendai": { name: "仙台駅", shortName: "仙台駅", type: "station", prefecture: "宮城県", region: "東北" },
  "kanazawa": { name: "金沢駅", shortName: "金沢駅", type: "station", prefecture: "石川県", region: "中部" },
};

// ── 用途メタ情報 ──────────────────────────────────────────
const PURPOSE_META: Record<string, {
  label: string;
  icon: string;
  description: string;
  tips: string[];
  keywords: string[];
}> = {
  "greeting": {
    label: "挨拶・手土産", icon: "🤝",
    description: "初対面の方への挨拶や訪問時の手土産に最適。日持ちするもの・個包装・見栄えの良い品を厳選。",
    tips: ["個包装タイプが配りやすくおすすめ", "価格帯は1,500〜3,000円が一般的", "日持ち1週間以上のものが安心"],
    keywords: ["手土産", "挨拶 お土産", "手土産 日持ち", "手土産 個包装"],
  },
  "thanks": {
    label: "御礼・感謝", icon: "🙏",
    description: "お世話になった方への御礼や感謝の気持ちを伝えるお土産。特別感・高級感のある品を厳選。",
    tips: ["価格帯3,000〜5,000円が誠意を伝えます", "産地や製法にこだわりのある品は特別感が出る", "のし対応の商品を選ぶと丁寧な印象に"],
    keywords: ["御礼 お土産", "感謝 手土産", "お礼 お菓子", "御礼 日持ち"],
  },
  "apology": {
    label: "お詫び・謝罪", icon: "🙇",
    description: "お詫びの気持ちを伝えるお土産。相手に誠意が伝わる、上質で日持ちする品を厳選。",
    tips: ["お詫びには少し高めの品を選ぶと誠意が伝わります", "派手すぎず、上品なパッケージが好ましい", "のし（熨斗）をつけると礼儀正しい印象に"],
    keywords: ["お詫び お土産", "謝罪 手土産", "お詫び 菓子折り", "謝罪 お菓子"],
  },
  "office": {
    label: "社内配布・職場", icon: "🏢",
    description: "職場や社内への配布に最適なお土産。個包装で数が多く、日持ちする品を厳選。",
    tips: ["個包装で1個ずつ配れるタイプが便利", "アレルギー対応の商品も確認しておくと安心", "賞味期限が長いものを選ぶと余裕を持って配れる"],
    keywords: ["社内配布 お土産", "職場 お土産 個包装", "会社 お土産 日持ち", "職場 お菓子"],
  },
  "snack": {
    label: "友人・気軽なギフト", icon: "🎁",
    description: "友人や気軽な贈り物に最適なお土産。話題性・ユニーク感のある品を厳選。",
    tips: ["話題になりやすいユニークな品が喜ばれます", "SNSで映えるパッケージも人気", "相手の好みに合わせて選ぶと◎"],
    keywords: ["友人 お土産", "気軽 ギフト", "プチギフト", "友達 お土産"],
  },
  "self": {
    label: "自分用・ご褒美", icon: "😊",
    description: "旅行の記念や自分へのご褒美に。地元でしか買えない限定品・名物を厳選。",
    tips: ["その土地でしか買えない限定品がおすすめ", "旅の記念になるパッケージも◎", "普段食べられない高級品をご褒美に"],
    keywords: ["自分用 お土産", "ご褒美 お菓子", "旅行 自分用", "お土産 限定"],
  },
  "family": {
    label: "家族・親族", icon: "👨‍👩‍👧",
    description: "家族や親族への帰省土産・旅行土産に。みんなで楽しめる量・種類の品を厳選。",
    tips: ["家族の人数に合わせた量を選びましょう", "子供から大人まで楽しめる品が無難", "地元の名産品は話題のきっかけにも"],
    keywords: ["家族 お土産", "帰省 お土産", "親族 お菓子", "家族 旅行 お土産"],
  },
  "kids": {
    label: "子供・キッズ", icon: "🧒",
    description: "子供が喜ぶお土産。見た目が楽しく、食べやすい小さめサイズの品を厳選。",
    tips: ["アレルギー成分を必ず確認しましょう", "キャラクターものや見た目が楽しい品が人気", "小さめサイズで食べやすいものを選ぶと◎"],
    keywords: ["子供 お土産", "キッズ お菓子", "子供 喜ぶ お土産", "お土産 子供向け"],
  },
};

// ── カテゴリ別フォールバック画像 ──────────────────────────
const CATEGORY_IMAGES: Record<string, string> = {
  "和菓子": "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80",
  "洋菓子": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80",
  "焼き菓子": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80",
  "チョコレート": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&q=80",
  "その他": "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=400&q=80",
};

function getCategoryImage(category: string): string {
  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES["その他"];
}

// ── 商品カード ──────────────────────────────────────────
function ProductCard({ product }: { product: any }) {
  const [, navigate] = useLocation();
  const imageUrl = product.imageUrl || getCategoryImage(product.category || "");
  const minPrice = product.minPrice ? `¥${product.minPrice.toLocaleString()}〜` : null;

  return (
    <div
      className="flex gap-3 bg-white border border-stone-100 rounded-xl p-3 cursor-pointer hover:border-emerald-200 hover:shadow-sm transition-all"
      onClick={() => navigate(`/db-product/${product.id}`)}
    >
      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
        <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-stone-400 mb-0.5">{product.brand || product.prefecture}</p>
        <p className="text-sm font-bold text-stone-900 leading-snug line-clamp-2">{product.name}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {minPrice && (
            <span className="text-xs font-bold text-emerald-700">{minPrice}</span>
          )}
          {product.shelfLifeDays && (
            <span className="text-xs text-stone-400 flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {product.shelfLifeDays}日
            </span>
          )}
          {product.isIndividuallyWrapped && (
            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">個包装</span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0 self-center" />
    </div>
  );
}

// ── メインコンポーネント ──────────────────────────────────
export default function StationPurposePage() {
  const params = useParams<{ facilityId: string; purposeId: string }>();
  const [, navigate] = useLocation();
  const facilityId = params.facilityId;
  const purposeId = params.purposeId;

  const facilityMeta = FACILITY_META[facilityId];
  const purposeMeta = PURPOSE_META[purposeId];

  const [page, setPage] = useState(0);
  const LIMIT = 12;

  // 商品検索（施設ID + 用途タグ）
  const searchInput = useMemo(() => ({
    facilityId,
    purposeTag: purposeId,
    limit: LIMIT,
    offset: page * LIMIT,
  }), [facilityId, purposeId, page]);

  const { data, isLoading } = trpc.products.search.useQuery(searchInput, {
    enabled: !!facilityId && !!purposeId,
  });

  // 施設の全商品（用途タグなし）
  const allProductsInput = useMemo(() => ({
    facilityId,
    limit: 6,
    offset: 0,
  }), [facilityId]);

  const { data: allFacilityData } = trpc.products.search.useQuery(allProductsInput, {
    enabled: !!facilityId,
  });

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const allFacilityProducts = allFacilityData?.products ?? [];

  // 施設・用途が不明の場合は404
  if (!facilityMeta || !purposeMeta) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4 px-4">
          <AlertCircle className="w-12 h-12 text-stone-300" />
          <p className="text-base font-bold text-stone-600">ページが見つかりません</p>
          <button onClick={() => navigate("/")} className="text-sm text-emerald-600 font-bold">
            トップへ戻る
          </button>
        </div>
      </AppLayout>
    );
  }

  const FacilityIcon = facilityMeta.type === "airport" ? Plane : Train;
  const pageTitle = `${facilityMeta.name}の${purposeMeta.label}おすすめお土産`;
  const pageDescription = `${facilityMeta.name}で買える${purposeMeta.label}に最適なお土産を紹介。${purposeMeta.description}`;
  const keywords = [
    `${facilityMeta.shortName} ${purposeMeta.label} お土産`,
    `${facilityMeta.shortName} お土産 ${purposeMeta.label}`,
    ...purposeMeta.keywords.map(k => `${facilityMeta.shortName} ${k}`),
  ].join(", ");

  // JSON-LD構造化データ
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": pageTitle,
    "description": pageDescription,
    "numberOfItems": total,
    "itemListElement": products.slice(0, 5).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": p.name,
      "url": `${typeof window !== "undefined" ? window.location.origin : ""}/db-product/${p.id}`,
    })),
  };

  return (
    <AppLayout>
      <Helmet>
        <title>{pageTitle} | Omiyage Go</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={keywords} />
        <meta property="og:title" content={`${pageTitle} | Omiyage Go`} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${typeof window !== "undefined" ? window.location.origin : ""}/station/${facilityId}/purpose/${purposeId}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* ヘッダー */}
      <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 px-4 pt-4 pb-6">
        <button
          onClick={() => navigate(`/station/${facilityId}`)}
          className="flex items-center gap-1.5 text-emerald-200 text-sm mb-4 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {facilityMeta.name}のお土産一覧へ
        </button>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">{purposeMeta.icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FacilityIcon className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-emerald-200 text-xs">{facilityMeta.name}</span>
            </div>
            <h1 className="text-xl font-black text-white leading-tight">
              {purposeMeta.label}に<br />おすすめのお土産
            </h1>
            <p className="text-emerald-200 text-xs mt-1">
              {total > 0 ? `${total}件` : ""}の商品が見つかりました
            </p>
          </div>
        </div>

        {/* パンくずリスト */}
        <div className="flex items-center gap-1.5 mt-4 text-xs text-emerald-300 flex-wrap">
          <button onClick={() => navigate("/")} className="hover:text-white">ホーム</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => navigate(`/station/${facilityId}`)} className="hover:text-white">
            {facilityMeta.shortName}
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white">{purposeMeta.label}</span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-8 space-y-5">
        {/* 選び方のヒント */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h2 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1.5">
            <Gift className="w-4 h-4" />
            {facilityMeta.shortName}で{purposeMeta.label}を選ぶコツ
          </h2>
          <ul className="space-y-1.5">
            {purposeMeta.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                <CheckSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* 商品一覧 */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : products.length > 0 ? (
          <>
            <div>
              <h2 className="text-base font-black text-stone-900 mb-3">
                {facilityMeta.shortName}で買える{purposeMeta.label}のお土産
                <span className="text-sm font-normal text-stone-400 ml-2">{total}件</span>
              </h2>
              <div className="space-y-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>

            {/* ページネーション */}
            {total > LIMIT && (
              <div className="flex justify-center gap-3">
                {page > 0 && (
                  <button
                    onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 text-sm font-bold text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50"
                  >
                    前へ
                  </button>
                )}
                {(page + 1) * LIMIT < total && (
                  <button
                    onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                  >
                    次の{Math.min(LIMIT, total - (page + 1) * LIMIT)}件
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          /* 用途タグ一致なし → 施設の全商品を表示 */
          <div>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-4 text-center">
              <p className="text-sm text-stone-500 mb-1">
                「{purposeMeta.label}」に絞り込んだ商品が見つかりませんでした
              </p>
              <p className="text-xs text-stone-400">
                {facilityMeta.name}で買えるお土産を表示しています
              </p>
            </div>
            {allFacilityProducts.length > 0 && (
              <div className="space-y-3">
                {allFacilityProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 関連ページへの導線 */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-stone-700">他の用途でも探す</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PURPOSE_META)
              .filter(([id]) => id !== purposeId)
              .slice(0, 4)
              .map(([id, meta]) => (
                <button
                  key={id}
                  onClick={() => navigate(`/station/${facilityId}/purpose/${id}`)}
                  className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2.5 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left"
                >
                  <span className="text-lg">{meta.icon}</span>
                  <span className="text-xs font-bold text-stone-700 leading-tight">{meta.label}</span>
                </button>
              ))}
          </div>
        </div>

        {/* 施設ページへの導線 */}
        <button
          onClick={() => navigate(`/station/${facilityId}`)}
          className="w-full flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 hover:bg-emerald-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FacilityIcon className="w-4 h-4 text-emerald-600" />
            <div className="text-left">
              <p className="text-sm font-bold text-emerald-800">{facilityMeta.name}のお土産を全て見る</p>
              <p className="text-xs text-emerald-600">用途を絞らずに全商品を検索</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-500" />
        </button>

        {/* 全国検索への導線 */}
        <button
          onClick={() => navigate(`/purpose/${purposeId}`)}
          className="w-full flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 hover:bg-stone-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{purposeMeta.icon}</span>
            <div className="text-left">
              <p className="text-sm font-bold text-stone-700">全国の{purposeMeta.label}お土産を見る</p>
              <p className="text-xs text-stone-500">施設を絞らずに全国から検索</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>
      </div>
    </AppLayout>
  );
}
