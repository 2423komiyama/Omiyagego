// ============================================================
// Omiyage Go - 用途別SEO入口ページ
// URL: /purpose/:purposeId
// SEO: 「手土産 日持ち」「社内配布 お土産 個包装」等のキーワードで流入
// ============================================================
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { trpc } from "@/lib/trpc";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft, MapPin, ChevronRight, Package, Loader2,
  Clock, Heart, Gift, CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

// 用途ID → メタ情報マッピング
const PURPOSE_META: Record<string, {
  label: string;
  icon: string;
  title: string;
  description: string;
  keywords: string[];
  tips: string[];
  relatedPurposes: string[];
}> = {
  "greeting": {
    label: "挨拶・手土産", icon: "🤝",
    title: "挨拶・手土産におすすめのお土産",
    description: "初対面の方への挨拶や訪問時の手土産に最適なお土産を紹介。日持ちするもの・個包装・見栄えの良い品を厳選しています。",
    keywords: ["手土産 おすすめ", "手土産 日持ち", "挨拶 お土産", "訪問 手土産", "手土産 個包装"],
    tips: [
      "初対面の方には日持ちする個包装のお菓子が無難です",
      "価格帯は1,500〜3,000円が一般的なマナーとされています",
      "相手の人数に合わせて量を調整できる個包装タイプが便利",
    ],
    relatedPurposes: ["thanks", "office", "apology"],
  },
  "thanks": {
    label: "御礼・感謝", icon: "🙏",
    title: "御礼・感謝に贈るお土産",
    description: "お世話になった方への御礼や感謝の気持ちを伝えるお土産を紹介。特別感のある品・高級感のある手土産を厳選しています。",
    keywords: ["御礼 お土産", "感謝 手土産", "お礼 お菓子", "御礼 日持ち", "感謝 ギフト"],
    tips: [
      "御礼には少し高めの価格帯（3,000〜5,000円）が誠意を伝えます",
      "産地や製法にこだわりのある品は特別感が出ます",
      "相手の好みを知っている場合はそれに合わせた品を選びましょう",
    ],
    relatedPurposes: ["greeting", "apology"],
  },
  "apology": {
    label: "お詫び", icon: "💐",
    title: "お詫び・謝罪に贈るお土産",
    description: "お詫びや謝罪の場面に適したお土産を紹介。誠意が伝わる品・日持ちする上品なお菓子を厳選しています。",
    keywords: ["お詫び お土産", "謝罪 手土産", "お詫び お菓子", "謝罪 ギフト"],
    tips: [
      "お詫びには派手すぎず、上品で日持ちするお菓子が適切です",
      "価格帯は3,000〜5,000円程度が誠意を示す目安です",
      "個包装で相手が配りやすいものを選ぶと喜ばれます",
    ],
    relatedPurposes: ["greeting", "thanks"],
  },
  "office": {
    label: "社内配布", icon: "🏢",
    title: "社内配布・職場へのお土産",
    description: "職場や社内での配布に最適なお土産を紹介。個包装・大容量・日持ちする商品を厳選しています。",
    keywords: ["社内配布 お土産", "職場 お土産 個包装", "社内 お菓子 配布", "職場 お土産 大容量", "社内配布 日持ち"],
    tips: [
      "社内配布には個包装が必須です。人数分＋αの量を用意しましょう",
      "アレルギー対応（小麦・乳不使用など）の商品も検討を",
      "1人あたり300〜500円程度が職場配布の相場です",
    ],
    relatedPurposes: ["snack", "greeting"],
  },
  "snack": {
    label: "差し入れ", icon: "☕",
    title: "差し入れ・おやつにおすすめのお土産",
    description: "職場や友人への差し入れ・おやつに最適なお土産を紹介。みんなで楽しめる・食べやすい商品を厳選しています。",
    keywords: ["差し入れ お菓子", "差し入れ おすすめ", "おやつ お土産", "差し入れ 個包装"],
    tips: [
      "差し入れは気軽に食べられる小分けタイプが喜ばれます",
      "甘いものと塩系を混ぜると好みの差をカバーできます",
      "常温保存できる日持ちするものが持ち運びに便利です",
    ],
    relatedPurposes: ["office", "self"],
  },
  "self": {
    label: "自分用", icon: "🎁",
    title: "自分へのご褒美・自分用お土産",
    description: "旅行の記念に自分用に買いたいお土産を紹介。地域限定品・珍しいもの・食べ比べセットなど自分だけのお土産を厳選しています。",
    keywords: ["自分用 お土産", "旅行 お土産 自分用", "地域限定 お菓子", "お土産 珍しい"],
    tips: [
      "自分用なら普段買えない地域限定品や珍しい食材がおすすめ",
      "食べ比べセットや詰め合わせで旅の余韻を楽しめます",
      "保存食・調味料など日常使いできる品も人気です",
    ],
    relatedPurposes: ["snack"],
  },
  "family": {
    label: "家族へ", icon: "👨‍👩‍👧",
    title: "家族へのお土産・家族向けギフト",
    description: "家族みんなで楽しめるお土産を紹介。子供から大人まで喜ばれる・ファミリー向けの商品を厳選しています。",
    keywords: ["家族 お土産", "家族向け お菓子", "子供 お土産", "家族 ギフト"],
    tips: [
      "家族全員が楽しめる詰め合わせタイプが人気です",
      "子供がいる家庭には個包装で食べやすいものを",
      "地域の特産品を使ったお菓子は話のネタにもなります",
    ],
    relatedPurposes: ["kids", "self"],
  },
  "kids": {
    label: "子供向け", icon: "🧒",
    title: "子供向けお土産・子供が喜ぶお菓子",
    description: "子供が喜ぶお土産を紹介。かわいいパッケージ・食べやすいサイズ・アレルギー対応商品を厳選しています。",
    keywords: ["子供 お土産", "子供向け お菓子", "子供 喜ぶ お土産", "キッズ お菓子"],
    tips: [
      "子供向けにはかわいいキャラクターや動物モチーフが人気",
      "食べやすい小さめサイズや個包装タイプを選びましょう",
      "アレルギーが心配な場合は原材料を確認してください",
    ],
    relatedPurposes: ["family", "snack"],
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

export default function PurposePage() {
  const params = useParams<{ purposeId: string }>();
  const [, navigate] = useLocation();
  const purposeId = params.purposeId;

  const meta = PURPOSE_META[purposeId];

  // 用途に合った商品を検索
  const searchInput = useMemo(() => ({
    purposeTag: purposeId,
    sortBy: "popular" as const,
    limit: 20,
    offset: 0,
  }), [purposeId]);

  const { data: searchResult, isLoading } = trpc.products.search.useQuery(searchInput, {
    enabled: !!purposeId,
  });

  // 個包装フィルター版
  const searchInputPkg = useMemo(() => ({
    purposeTag: purposeId,
    isIndividualPackaged: true,
    sortBy: "popular" as const,
    limit: 8,
    offset: 0,
  }), [purposeId]);

  const { data: pkgResult } = trpc.products.search.useQuery(searchInputPkg, {
    enabled: !!purposeId && (purposeId === "office" || purposeId === "greeting"),
  });

  // 日持ちフィルター版（14日以上）
  const searchInputShelf = useMemo(() => ({
    purposeTag: purposeId,
    minShelfLife: 14,
    sortBy: "popular" as const,
    limit: 8,
    offset: 0,
  }), [purposeId]);

  const { data: shelfResult } = trpc.products.search.useQuery(searchInputShelf, {
    enabled: !!purposeId && (purposeId === "greeting" || purposeId === "thanks"),
  });

  // いいね
  const sessionId = useMemo(() => getSessionId(), []);
  const { data: likedIds = [], refetch: refetchLikes } = trpc.likes.getLikedIds.useQuery({ sessionId });
  const toggleLike = trpc.likes.toggle.useMutation({ onSuccess: () => refetchLikes() });

  if (!meta) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4 px-4">
          <p className="text-base font-bold text-stone-700">用途が見つかりませんでした</p>
          <button onClick={() => navigate("/")} className="px-6 py-2.5 bg-emerald-700 text-white text-sm font-bold rounded-xl">
            トップへ戻る
          </button>
        </div>
      </AppLayout>
    );
  }

  const pageTitle = `${meta.title} | Omiyage Go`;
  const canonicalUrl = `https://omiyagego-axrcumbv.manus.space/purpose/${purposeId}`;

  return (
    <AppLayout>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords.join(", ")} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={meta.description} />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": meta.title,
          "description": meta.description,
          "url": canonicalUrl,
        })}</script>
      </Helmet>

      {/* ── ヘッダー ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => window.history.back()} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-stone-600" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-stone-900 truncate">{meta.label}のお土産</p>
            <p className="text-xs text-stone-500">{searchResult?.total ?? ""}件</p>
          </div>
        </div>
      </div>

      <div className="pb-24">
        {/* ── ヒーロー ── */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-600 px-4 py-8">
          <div className="text-4xl mb-3">{meta.icon}</div>
          <h1 className="text-white font-black text-2xl leading-tight">{meta.title}</h1>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">{meta.description}</p>
        </div>

        {/* ── 選び方のコツ ── */}
        <div className="px-4 py-4 bg-amber-50 border-b border-amber-100">
          <h2 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1.5">
            <Gift className="w-4 h-4" />
            {meta.label}の選び方のコツ
          </h2>
          <div className="space-y-1.5">
            {meta.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs text-amber-800 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 絞り込みクイックリンク ── */}
        <div className="px-4 py-4 border-b border-stone-100">
          <h2 className="text-sm font-bold text-stone-700 mb-3">条件を絞り込む</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`/db-search?purposeTag=${purposeId}&isIndividualPackaged=true`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              個包装のみ
            </button>
            <button
              onClick={() => navigate(`/db-search?purposeTag=${purposeId}&minShelfLife=7`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              7日以上日持ち
            </button>
            <button
              onClick={() => navigate(`/db-search?purposeTag=${purposeId}&minShelfLife=14`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              2週間以上日持ち
            </button>
            <button
              onClick={() => navigate(`/db-search?purposeTag=${purposeId}&maxPrice=2000`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors"
            >
              〜2,000円
            </button>
            <button
              onClick={() => navigate(`/db-search?purposeTag=${purposeId}&maxPrice=3000`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors"
            >
              〜3,000円
            </button>
          </div>
        </div>

        {/* ── 個包装セクション（挨拶・社内配布のみ） ── */}
        {pkgResult && pkgResult.products.length > 0 && (
          <div className="px-4 py-4 border-b border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-stone-700 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                個包装で配りやすい
              </h2>
              <button
                onClick={() => navigate(`/db-search?purposeTag=${purposeId}&isIndividualPackaged=true`)}
                className="text-xs text-emerald-700 font-bold flex items-center gap-0.5"
              >
                すべて見る <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {pkgResult.products.slice(0, 5).map((product) => (
                <MiniProductCard
                  key={product.id}
                  product={product}
                  isLiked={likedIds.includes(product.id)}
                  onLike={() => toggleLike.mutate({ productId: product.id, sessionId })}
                  onClick={() => navigate(`/db-product/${product.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── 日持ちセクション（挨拶・御礼のみ） ── */}
        {shelfResult && shelfResult.products.length > 0 && (
          <div className="px-4 py-4 border-b border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-stone-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                2週間以上日持ちする
              </h2>
              <button
                onClick={() => navigate(`/db-search?purposeTag=${purposeId}&minShelfLife=14`)}
                className="text-xs text-emerald-700 font-bold flex items-center gap-0.5"
              >
                すべて見る <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {shelfResult.products.slice(0, 5).map((product) => (
                <MiniProductCard
                  key={product.id}
                  product={product}
                  isLiked={likedIds.includes(product.id)}
                  onLike={() => toggleLike.mutate({ productId: product.id, sessionId })}
                  onClick={() => navigate(`/db-product/${product.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── メイン商品リスト ── */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-stone-700">
              {meta.label}向けお土産 一覧
            </h2>
            <span className="text-xs text-stone-500">{searchResult?.total ?? 0}件</span>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-sm text-stone-500">読み込み中...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(searchResult?.products ?? []).slice(0, 10).map((product) => {
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
                            {product.isIndividualPackaged && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full">
                                個包装
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

          <button
            onClick={() => navigate(`/db-search?purposeTag=${purposeId}`)}
            className="w-full mt-4 py-3 bg-stone-100 text-stone-700 text-sm font-bold rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center justify-center gap-2"
          >
            {meta.label}向けお土産をすべて見る
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── 施設別リンク（複合SEOページへ） ── */}
        <div className="px-4 py-4 border-t border-stone-100">
          <h2 className="text-sm font-bold text-stone-700 mb-3">駅・空港から探す</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "tokyo", label: "東京駅", icon: "🚄" },
              { id: "haneda_t1", label: "羽田空港T1", icon: "✈️" },
              { id: "haneda_t2", label: "羽田空港T2", icon: "✈️" },
              { id: "chitose", label: "新千歳空港", icon: "✈️" },
              { id: "kyoto", label: "京都駅", icon: "🚄" },
              { id: "osaka", label: "大阪駅", icon: "🚄" },
              { id: "fukuoka", label: "博多駅", icon: "🚄" },
              { id: "naha", label: "那覇空港", icon: "✈️" },
            ].map((facility) => (
              <button
                key={facility.id}
                onClick={() => navigate(`/station/${facility.id}/purpose/${purposeId}`)}
                className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2.5 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left"
              >
                <span className="text-base">{facility.icon}</span>
                <span className="text-xs font-bold text-stone-700 leading-tight">{facility.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 関連用途リンク ── */}
        <div className="px-4 py-4 border-t border-stone-100">
          <h2 className="text-sm font-bold text-stone-700 mb-3">関連する用途</h2>
          <div className="flex flex-wrap gap-2">
            {meta.relatedPurposes.map((id) => {
              const m = PURPOSE_META[id];
              if (!m) return null;
              return (
                <button
                  key={id}
                  onClick={() => navigate(`/purpose/${id}`)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-700 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                >
                  <span>{m.icon}</span>
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// ── ミニ商品カード（横スクロール用） ──────────────────────────
function MiniProductCard({
  product, isLiked, onLike, onClick
}: {
  product: any;
  isLiked: boolean;
  onLike: () => void;
  onClick: () => void;
}) {
  return (
    <div
      className="flex-shrink-0 w-36 bg-white rounded-xl border border-stone-200 overflow-hidden cursor-pointer hover:shadow-md transition-all"
      onClick={onClick}
    >
      <div className="w-full h-24 bg-stone-100 overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-stone-300" />
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-bold text-stone-900 line-clamp-2 leading-tight">{product.name}</p>
        <p className="text-xs font-black text-emerald-700 mt-1">¥{product.price.toLocaleString()}</p>
        <button
          onClick={(e) => { e.stopPropagation(); onLike(); }}
          className={cn(
            "mt-1.5 w-full flex items-center justify-center gap-1 py-1 rounded-lg border text-[10px] font-bold transition-all",
            isLiked ? "bg-rose-50 border-rose-300 text-rose-600" : "bg-white border-stone-200 text-stone-500"
          )}
        >
          <Heart className={cn("w-2.5 h-2.5", isLiked && "fill-rose-500")} />
          {isLiked ? "済み" : "♡"}
        </button>
      </div>
    </div>
  );
}
