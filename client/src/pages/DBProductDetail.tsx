// ============================================================
// Omiyage Go - DB商品詳細ページ（統一フォーマット v3）
// セクション構成:
//   1. 商品写真（実画像 or カテゴリフォールバック）
//   2. 商品基本情報（名前・ブランド・価格・タグ）
//   3. 商品説明
//   4. 外さない保証（guaranteeDetail: 受賞歴・メディア掲載等）
//   5. このお土産が選ばれる理由（reasonsToChoose）
//   6. 今買える場所（sellers）
//   7. この商品の話題（buzzTopics + curatedLinks）
//   8. メーカーについて（makerName・makerStory・brandUrl）
//   9. 商品スペック（productSpecs）
//  10. 口コミ
//  11. 関連商品
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft, Package, MapPin, Clock, Tag, Star,
  ShoppingBag, Gift, ChevronRight, Loader2, AlertCircle,
  CheckCircle2, Store, Building2, ExternalLink, Heart, Share2,
  Sparkles, Youtube, Instagram, Twitter, FileText, MessageSquare,
  Send, X, ThumbsUp, Award, Trophy, Newspaper, BadgeCheck,
  ChefHat, Scale, Info, Flame, Navigation, Timer
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── バッジ表示設定 ─────────────────────────────────────────
const BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  editorial: { label: "編集部推薦", className: "bg-amber-100 text-amber-700 border border-amber-200" },
  popular: { label: "人気", className: "bg-red-100 text-red-700 border border-red-200" },
  limited: { label: "限定", className: "bg-purple-100 text-purple-700 border border-purple-200" },
  new: { label: "新商品", className: "bg-blue-100 text-blue-700 border border-blue-200" },
  regional: { label: "地元産", className: "bg-green-100 text-green-700 border border-green-200" },
  niche: { label: "ニッチ", className: "bg-orange-100 text-orange-700 border border-orange-200" },
  bestseller: { label: "ベストセラー", className: "bg-red-100 text-red-700 border border-red-200" },
  local: { label: "地元産", className: "bg-green-100 text-green-700 border border-green-200" },
};

// ── カテゴリ別フォールバック画像 ──────────────────────────
const CATEGORY_IMAGES: Record<string, string> = {
  "和菓子": "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80",
  "洋菓子": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80",
  "焼き菓子": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80",
  "煎餅・おかき": "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80",
  "スナック": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&q=80",
  "菓子": "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=800&q=80",
  "チョコレート": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&q=80",
  "飲料": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80",
  "お茶・飲料": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80",
  "海産物": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80",
  "肉・加工品": "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80",
  "調味料・ソース": "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=800&q=80",
  "麺類": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80",
  "弁当・惣菜": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80",
  "食品": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
  "工芸品": "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
  "その他": "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=800&q=80",
};

function getCategoryImage(category: string): string {
  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES["その他"];
}

// ── セッションID取得 ──────────────────────────────────────
function getSessionId(): string {
  let sid = localStorage.getItem("omiyage_session_id");
  if (!sid) {
    sid = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("omiyage_session_id", sid);
  }
  return sid;
}

// ── キュレーションリンクのアイコン ────────────────────────
function CuratedLinkIcon({ type }: { type: string }) {
  switch (type) {
    case "youtube": return <Youtube className="w-4 h-4 text-red-500" />;
    case "instagram": return <Instagram className="w-4 h-4 text-pink-500" />;
    case "twitter": return <Twitter className="w-4 h-4 text-sky-500" />;
    case "tiktok": return <span className="text-xs font-black text-stone-800">TT</span>;
    case "article": return <FileText className="w-4 h-4 text-blue-500" />;
    case "news": return <Newspaper className="w-4 h-4 text-stone-500" />;
    default: return <ExternalLink className="w-4 h-4 text-stone-500" />;
  }
}

const LINK_TYPE_LABELS: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  twitter: "X (Twitter)",
  tiktok: "TikTok",
  article: "記事",
  news: "ニュース",
  other: "外部リンク",
};

// ── 保証タイプのアイコン ──────────────────────────────────
function GuaranteeIcon({ type }: { type: string }) {
  switch (type) {
    case "award": return <Trophy className="w-4 h-4 text-amber-500" />;
    case "media": return <Newspaper className="w-4 h-4 text-blue-500" />;
    case "certification": return <BadgeCheck className="w-4 h-4 text-emerald-500" />;
    case "popular": return <Flame className="w-4 h-4 text-orange-500" />;
    default: return <Star className="w-4 h-4 text-amber-500" />;
  }
}

// ── 星評価コンポーネント ──────────────────────────────────
function StarRating({ value, onChange, readonly = false }: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={cn("transition-colors", readonly ? "cursor-default" : "cursor-pointer")}
        >
          <Star
            className={cn(
              "w-5 h-5",
              (hover || value) >= star ? "text-amber-400 fill-amber-400" : "text-stone-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ── ポイント獲得通知 ──────────────────────────────────────
function PointToast({ points, message, onClose }: { points: number; message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-700 text-white px-4 py-2.5 rounded-full shadow-lg">
      <Award className="w-4 h-4 text-amber-300" />
      <span className="text-sm font-bold">+{points}pt {message}</span>
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── セクションヘッダー ────────────────────────────────────
function SectionHeader({ icon, title, subtitle }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-bold text-stone-800">{title}</h2>
        {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── メインコンポーネント ──────────────────────────────────
export default function DBProductDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const productId = params.id;
  const { user, isAuthenticated } = useAuth();

  const { data: product, isLoading, error } = trpc.products.get.useQuery(
    { id: productId },
    { enabled: !!productId }
  );

  // いいね状態
  const sessionId = useMemo(() => getSessionId(), []);
  const { data: likedIds = [], refetch: refetchLikes } = trpc.likes.getLikedIds.useQuery({ sessionId });
  const toggleLike = trpc.likes.toggle.useMutation({ onSuccess: () => refetchLikes() });
  const isLiked = likedIds.includes(productId);
  const [localLiked, setLocalLiked] = useState(false);
  useEffect(() => { setLocalLiked(isLiked); }, [isLiked]);

  // DBお気に入り状態
  const { data: favData, refetch: refetchFav } = trpc.notifications.isFavorite.useQuery(
    { productId },
    { enabled: !!productId && isAuthenticated }
  );
  const isFavorite = favData?.isFavorite ?? false;
  const [localFavorite, setLocalFavorite] = useState(false);
  useEffect(() => { setLocalFavorite(isFavorite); }, [isFavorite]);
  const addFavMutation = trpc.notifications.addFavorite.useMutation({ onSuccess: () => refetchFav() });
  const removeFavMutation = trpc.notifications.removeFavorite.useMutation({ onSuccess: () => refetchFav() });

  const handleFavoriteToggle = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (localFavorite) {
      setLocalFavorite(false);
      removeFavMutation.mutate({ productId });
    } else {
      setLocalFavorite(true);
      addFavMutation.mutate({ productId, notifyNearby: true });
    }
  };

  // キュレーションリンク
  const { data: curatedLinks = [] } = trpc.curatedLinks.list.useQuery(
    { productId },
    { enabled: !!productId }
  );

  // 口コミ
  const { data: reviewData, refetch: refetchReviews } = trpc.reviews.list.useQuery(
    { productId, limit: 10 },
    { enabled: !!productId }
  );
  const reviews = reviewData?.reviews ?? [];
  const reviewTotal = reviewData?.total ?? 0;

  // 口コミ投稿フォーム
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewIsAnonymous, setReviewIsAnonymous] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // ポイント通知
  const [pointToast, setPointToast] = useState<{ points: number; message: string } | null>(null);

  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => {
      setShowReviewForm(false);
      setReviewBody("");
      setReviewRating(5);
      setReviewError("");
      refetchReviews();
      setPointToast({ points: 50, message: "口コミ投稿ありがとうございます！" });
    },
    onError: (err) => {
      setReviewError(err.message);
    },
  });

  // 関連商品
  const relatedInput = useMemo(() => ({
    prefecture: product?.prefecture,
    category: product?.category,
    limit: 4,
    offset: 0,
  }), [product?.prefecture, product?.category]);
  const { data: relatedData } = trpc.products.search.useQuery(relatedInput, {
    enabled: !!product,
  });
  const relatedProducts = (relatedData?.products ?? []).filter(p => p.id !== productId).slice(0, 3);

  // ─── ローディング ───────────────────────────────────────
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-sm text-stone-500">商品情報を読み込み中...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !product) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4 px-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-stone-700">商品が見つかりませんでした</p>
            <p className="text-sm text-stone-500 mt-1">
              {error?.message || "この商品は存在しないか、削除された可能性があります"}
            </p>
          </div>
          <button
            onClick={() => navigate("/db-search")}
            className="px-6 py-2.5 bg-emerald-700 text-white text-sm font-bold rounded-xl"
          >
            検索に戻る
          </button>
        </div>
      </AppLayout>
    );
  }

  // ─── データパース ────────────────────────────────────────
  const badges: string[] = (() => {
    try { return product.badges ? JSON.parse(product.badges) : []; }
    catch { return []; }
  })();

  // 旧フィールド（guaranteeReason）との互換性を保ちつつ新フィールドを優先
  const guaranteeReasons: string[] = (() => {
    try { return product.guaranteeReason ? JSON.parse(product.guaranteeReason) : []; }
    catch { return []; }
  })();

  const reasonsToChoose: Array<{ title: string; body: string }> = (() => {
    try { return product.reasonsToChoose ? JSON.parse(product.reasonsToChoose) : []; }
    catch { return []; }
  })();

  const guaranteeDetail: Array<{ type: string; title: string; year?: string; detail: string }> = (() => {
    try { return product.guaranteeDetail ? JSON.parse(product.guaranteeDetail) : []; }
    catch { return []; }
  })();

  const productSpecs: {
    weight?: string;
    size?: string;
    ingredients?: string;
    allergens?: string;
    storage?: string;
    calories?: string;
    pieces?: string;
    [key: string]: string | undefined;
  } = (() => {
    try { return product.productSpecs ? JSON.parse(product.productSpecs) : {}; }
    catch { return {}; }
  })();

  const buzzTopics: Array<{ source: string; title: string; detail?: string; url?: string }> = (() => {
    try { return product.buzzTopics ? JSON.parse(product.buzzTopics) : []; }
    catch { return []; }
  })();

  const sellers = product.sellers || [];

  // 画像URL: realImageUrl（楽天API取得）> imageUrl（元データ）> カテゴリフォールバック
  const displayImageUrl = product.realImageUrl || product.imageUrl || getCategoryImage(product.category);
  const isRealImage = !!(product.realImageUrl || product.imageUrl);

  // 平均評価
  const avgRating = product.avgRating ? Number(product.avgRating) : 0;

  // ─── 共有・いいね ────────────────────────────────────────
  const handleShare = () => {
    const url = `${window.location.origin}/db-product/${productId}`;
    const text = `${product.name}（${product.prefecture}）- ¥${product.price.toLocaleString()}`;
    if (navigator.share) {
      navigator.share({ title: product.name, text, url });
    } else {
      navigator.clipboard.writeText(url).then(() => alert("URLをコピーしました"));
    }
  };

  const handleLike = () => {
    setLocalLiked(!localLiked);
    toggleLike.mutate({ productId, sessionId });
    if (!localLiked && isAuthenticated) {
      setPointToast({ points: 5, message: "いいね！" });
    }
  };

  const handleSubmitReview = () => {
    if (reviewBody.trim().length < 10) {
      setReviewError("口コミは10文字以上で入力してください");
      return;
    }
    createReview.mutate({
      productId,
      rating: reviewRating,
      body: reviewBody.trim(),
      isAnonymous: reviewIsAnonymous,
    });
  };

  // ─── SEOメタ ─────────────────────────────────────────────
  const pageTitle = `${product.name}（${product.prefecture}）| Omiyage Go`;
  const pageDescription = product.description
    ? `${product.description.slice(0, 100)}...`
    : `${product.prefecture}のお土産「${product.name}」。${product.brand}。価格¥${product.price.toLocaleString()}。日持ち${product.shelfLife}日。`;

  // ─── レンダリング ────────────────────────────────────────
  return (
    <AppLayout>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="product" />
        {displayImageUrl && <meta property="og:image" content={displayImageUrl} />}
        <link rel="canonical" href={`${window.location.origin}/db-product/${productId}`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "description": product.description || pageDescription,
          "image": displayImageUrl,
          "brand": { "@type": "Brand", "name": product.brand },
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "JPY",
            "availability": "https://schema.org/InStock",
          },
          ...(avgRating > 0 && reviewTotal > 0 ? {
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": avgRating.toFixed(1),
              "reviewCount": reviewTotal,
            }
          } : {}),
        })}</script>
      </Helmet>

      {/* ポイント獲得通知 */}
      {pointToast && (
        <PointToast
          points={pointToast.points}
          message={pointToast.message}
          onClose={() => setPointToast(null)}
        />
      )}

      {/* ── ヘッダー ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => window.history.back()}
            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-stone-600" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-stone-900 truncate">{product.name}</p>
            <p className="text-xs text-stone-500">{product.prefecture} · {product.brand}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleLike}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                localLiked ? "bg-rose-50 text-rose-500" : "bg-stone-100 text-stone-500 hover:bg-rose-50 hover:text-rose-400"
              )}
            >
              <Heart className={cn("w-4 h-4", localLiked && "fill-rose-500")} />
            </button>
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="pb-24">

        {/* ══════════════════════════════════════════════════
            セクション 1: 商品写真
        ══════════════════════════════════════════════════ */}
        <div className="relative w-full bg-stone-100 overflow-hidden" style={{ height: "280px" }}>
          <img
            src={displayImageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getCategoryImage("その他");
            }}
          />
          {/* グラデーションオーバーレイ */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* バッジ */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            {badges.map((badge) => {
              const config = BADGE_CONFIG[badge];
              if (!config) return null;
              return (
                <span key={badge} className={cn("px-2 py-0.5 text-xs font-bold rounded-full backdrop-blur-sm", config.className)}>
                  {config.label}
                </span>
              );
            })}
          </div>

          {/* 画像ソース表示 */}
          {!isRealImage && (
            <div className="absolute bottom-3 right-3">
              <span className="px-2 py-0.5 bg-black/50 text-white text-[10px] rounded-full backdrop-blur-sm">
                イメージ画像
              </span>
            </div>
          )}
          {product.realImageUrl && (
            <div className="absolute bottom-3 right-3">
              <span className="px-2 py-0.5 bg-black/50 text-white text-[10px] rounded-full backdrop-blur-sm flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                実際の商品画像
              </span>
            </div>
          )}

          {/* 価格バッジ（画像下部左） */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
              <p className="text-lg font-black text-emerald-700">¥{product.price.toLocaleString()}</p>
              <p className="text-[10px] text-stone-500 -mt-0.5">税込</p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            セクション 2: 商品基本情報
        ══════════════════════════════════════════════════ */}
        <div className="px-4 pt-4 pb-4 border-b border-stone-100">
          {/* 商品名・ブランド */}
          <h1 className="text-xl font-black text-stone-900 leading-tight">{product.name}</h1>
          <p className="text-sm text-stone-500 mt-0.5">{product.brand}</p>

          {/* 評価サマリー */}
          {avgRating > 0 && reviewTotal > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <StarRating value={Math.round(avgRating)} readonly />
              <span className="text-sm font-bold text-amber-600">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-stone-400">({reviewTotal}件の口コミ)</span>
            </div>
          )}

          {/* タグ行 */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-100">
              <MapPin className="w-3 h-3" />
              {product.prefecture}
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 bg-stone-100 text-stone-600 text-xs font-medium rounded-full">
              <Tag className="w-3 h-3" />
              {product.category}
            </span>
            {product.shelfLife && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-stone-100 text-stone-600 text-xs font-medium rounded-full">
                <Clock className="w-3 h-3" />
                日持ち{product.shelfLife >= 9999 ? "長期" : `${product.shelfLife}日`}
              </span>
            )}
            {product.isIndividualPackaged && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                <Gift className="w-3 h-3" />
                個包装
              </span>
            )}
          </div>

          {/* お気に入り・いいね・共有ボタン */}
          <div className="flex gap-2 mt-4">
            {/* DBお気に入りボタン */}
            <button
              onClick={handleFavoriteToggle}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all",
                localFavorite
                  ? "bg-rose-50 border-rose-300 text-rose-600"
                  : "bg-white border-stone-200 text-stone-600 hover:border-rose-300 hover:text-rose-500"
              )}
            >
              <Heart className={cn("w-4 h-4", localFavorite && "fill-rose-500")} />
              {localFavorite ? "保存済み" : "保存"}
              {!isAuthenticated && (
                <span className="text-[10px] text-stone-400">要ログイン</span>
              )}
            </button>
            {/* いいねボタン */}
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-bold transition-all",
                localLiked
                  ? "bg-rose-50 border-rose-300 text-rose-600"
                  : "bg-white border-stone-200 text-stone-600 hover:border-rose-300 hover:text-rose-500"
              )}
            >
              <Heart className={cn("w-4 h-4", localLiked && "fill-rose-500")} />
              {isAuthenticated && !localLiked && (
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">+5pt</span>
              )}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-bold hover:bg-stone-50 transition-all"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            セクション 3: 商品説明
        ══════════════════════════════════════════════════ */}
        {product.description && (
          <div className="px-4 py-4 border-b border-stone-100">
            <SectionHeader
              icon={<ShoppingBag className="w-4 h-4 text-emerald-600" />}
              title="商品について"
            />
            <p className="text-sm text-stone-600 leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            セクション 4: 外さない保証（受賞歴・メディア掲載等）
        ══════════════════════════════════════════════════ */}
        {guaranteeDetail.length > 0 && (
          <div className="px-4 py-4 border-b border-stone-100">
            <SectionHeader
              icon={<Trophy className="w-4 h-4 text-amber-500" />}
              title="外さない保証"
              subtitle="受賞歴・メディア掲載・認定実績"
            />
            <div className="space-y-2.5">
              {guaranteeDetail.map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <GuaranteeIcon type={item.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-stone-800">{item.title}</p>
                      {item.year && (
                        <span className="text-[10px] text-stone-400 bg-white px-1.5 py-0.5 rounded-full border border-stone-200">
                          {item.year}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 旧フィールドの保証理由（guaranteeDetail がない場合のフォールバック） */}
        {guaranteeDetail.length === 0 && guaranteeReasons.length > 0 && (
          <div className="px-4 py-4 border-b border-stone-100">
            <SectionHeader
              icon={<Star className="w-4 h-4 text-amber-500" />}
              title="外さない保証"
            />
            <div className="space-y-2">
              {guaranteeReasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-stone-700">{reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            セクション 5: このお土産が選ばれる理由
        ══════════════════════════════════════════════════ */}
        {reasonsToChoose.length > 0 && (
          <div className="px-4 py-4 border-b border-stone-100">
            <SectionHeader
              icon={<Sparkles className="w-4 h-4 text-emerald-600" />}
              title="このお土産が選ばれる理由"
            />
            <div className="space-y-3">
              {reasonsToChoose.map((reason, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 text-xs font-black mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-stone-800">{reason.title}</p>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{reason.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            セクション 6: 今買える場所（売り場情報）
        ══════════════════════════════════════════════════ */}
        {sellers.length > 0 && (
          <div className="px-4 py-4 border-b border-stone-100">
            <SectionHeader
              icon={<Building2 className="w-4 h-4 text-emerald-600" />}
              title="今買える場所"
              subtitle={`${sellers.length}か所で取り扱い中`}
            />
            <div className="space-y-2">
              {sellers.map((seller) => (
                <div
                  key={seller.id}
                  className="bg-stone-50 rounded-xl p-3 border border-transparent hover:bg-emerald-50 hover:border-emerald-200 transition-all"
                >
                  <button
                    className="w-full text-left"
                    onClick={() => navigate(`/station/${seller.facilityId}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-stone-900">{seller.storeName}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {seller.floor && (
                            <p className="text-xs text-stone-500 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />{seller.floor}
                            </p>
                          )}
                          {seller.walkMinutes != null && (
                            <p className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
                              <Timer className="w-3 h-3" />徒歩{seller.walkMinutes}分
                            </p>
                          )}
                          {seller.businessHours && (
                            <p className="text-xs text-stone-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />{seller.businessHours}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        {seller.insideGate ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                            改札内
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-bold rounded-full">
                            改札外
                          </span>
                        )}
                        {seller.stockStatus === "in_stock" && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">在庫あり</span>
                        )}
                        {seller.stockStatus === "low_stock" && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">残りわずか</span>
                        )}
                        {seller.stockStatus === "out_of_stock" && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">在庫なし</span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400 mt-0.5" />
                      </div>
                    </div>
                  </button>
                  {/* Googleマップリンク */}
                  {seller.mapUrl && (
                    <a
                      href={seller.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      <Navigation className="w-3 h-3" />
                      Googleマップで見る
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            セクション 7: この商品の話題（buzzTopics + curatedLinks）
        ══════════════════════════════════════════════════ */}
        {(buzzTopics.length > 0 || curatedLinks.length > 0) && (
          <div className="px-4 py-4 border-b border-stone-100">
            <SectionHeader
              icon={<Flame className="w-4 h-4 text-orange-500" />}
              title="この商品の話題"
            />

            {/* buzzTopics（LLM生成の話題） */}
            {buzzTopics.length > 0 && (
              <div className="space-y-2 mb-3">
                {buzzTopics.map((topic, i) => (
                  <div key={i} className="flex items-start gap-3 bg-orange-50 rounded-xl p-3 border border-orange-100">
                    <div className="flex-shrink-0 px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full mt-0.5">
                      {topic.source}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-800">{topic.title}</p>
                      {topic.detail && (
                        <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{topic.detail}</p>
                      )}
                    </div>
                    {topic.url && (
                      <a
                        href={topic.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-stone-400 hover:text-emerald-600 transition-colors" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* curatedLinks（管理者が追加したリンク） */}
            {curatedLinks.length > 0 && (
              <div className="space-y-2.5">
                {curatedLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 bg-stone-50 rounded-xl p-3 hover:bg-stone-100 transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0 flex items-center justify-center">
                      {link.thumbnailUrl ? (
                        <img
                          src={link.thumbnailUrl}
                          alt={link.title || ""}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <CuratedLinkIcon type={link.type} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <CuratedLinkIcon type={link.type} />
                        <span className="text-[10px] text-stone-400 font-medium">
                          {LINK_TYPE_LABELS[link.type] || "外部リンク"}
                        </span>
                        {link.authorName && (
                          <span className="text-[10px] text-stone-400">· {link.authorName}</span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-stone-800 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                        {link.title || link.url}
                      </p>
                      {link.description && (
                        <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">{link.description}</p>
                      )}
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-1 group-hover:text-emerald-600 transition-colors" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            セクション 8: メーカーについて
        ══════════════════════════════════════════════════ */}
        {(product.makerName || product.makerStory || product.brandUrl) && (
          <div className="px-4 py-4 border-b border-stone-100">
            <SectionHeader
              icon={<Store className="w-4 h-4 text-emerald-600" />}
              title="メーカーについて"
            />

            {/* メーカー基本情報 */}
            {(product.makerName || product.makerFoundedYear || product.makerAddress) && (
              <div className="bg-stone-50 rounded-xl p-3 mb-3">
                {product.makerName && (
                  <p className="text-sm font-bold text-stone-900">{product.makerName}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  {product.makerFoundedYear && (
                    <p className="text-xs text-stone-500">創業 {product.makerFoundedYear}年</p>
                  )}
                  {product.makerAddress && (
                    <p className="text-xs text-stone-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {product.makerAddress}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* メーカーストーリー */}
            {product.makerStory && (
              <p className="text-sm text-stone-600 leading-relaxed mb-3">{product.makerStory}</p>
            )}

            {/* 公式サイトリンク */}
            {product.brandUrl && (
              <a
                href={product.brandUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full px-4 py-2.5 bg-stone-800 text-white text-sm font-bold rounded-xl hover:bg-stone-900 transition-colors justify-center"
              >
                <ExternalLink className="w-4 h-4" />
                {product.makerName || product.brand}の公式サイトを見る
              </a>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            セクション 9: 商品スペック
        ══════════════════════════════════════════════════ */}
        <div className="px-4 py-4 border-b border-stone-100">
          <SectionHeader
            icon={<Info className="w-4 h-4 text-stone-500" />}
            title="商品スペック"
          />
          <div className="space-y-0 divide-y divide-stone-100 bg-stone-50 rounded-xl overflow-hidden">
            {/* 基本スペック（常に表示） */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-xs text-stone-500">価格</span>
              <span className="text-sm font-bold text-stone-900">¥{product.price.toLocaleString()}（税込）</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-xs text-stone-500">日持ち</span>
              <span className="text-sm font-bold text-stone-900">
                {product.shelfLife
                  ? product.shelfLife >= 9999 ? "長期保存可" : `${product.shelfLife}日`
                  : "要確認"}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-xs text-stone-500">カテゴリ</span>
              <span className="text-sm font-bold text-stone-900">{product.category}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-xs text-stone-500">個包装</span>
              <span className="text-sm font-bold text-stone-900">
                {product.isIndividualPackaged ? "あり" : "なし"}
              </span>
            </div>
            {product.servingSize && (
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-stone-500">内容量</span>
                <span className="text-sm font-bold text-stone-900">{product.servingSize}個入り</span>
              </div>
            )}

            {/* 詳細スペック（productSpecsがある場合） */}
            {productSpecs.weight && (
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-stone-500">重量</span>
                <span className="text-sm font-bold text-stone-900">{productSpecs.weight}</span>
              </div>
            )}
            {productSpecs.size && (
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-stone-500">サイズ</span>
                <span className="text-sm font-bold text-stone-900">{productSpecs.size}</span>
              </div>
            )}
            {productSpecs.calories && (
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-stone-500">カロリー</span>
                <span className="text-sm font-bold text-stone-900">{productSpecs.calories}</span>
              </div>
            )}
            {productSpecs.storage && (
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-stone-500">保存方法</span>
                <span className="text-sm font-bold text-stone-900">{productSpecs.storage}</span>
              </div>
            )}
            {productSpecs.allergens && (
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-stone-500">アレルゲン</span>
                <span className="text-sm font-bold text-stone-900">{productSpecs.allergens}</span>
              </div>
            )}
            {productSpecs.ingredients && (
              <div className="flex items-start justify-between px-3 py-2.5 gap-4">
                <span className="text-xs text-stone-500 flex-shrink-0">原材料</span>
                <span className="text-xs font-medium text-stone-700 text-right leading-relaxed">{productSpecs.ingredients}</span>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            セクション 10: 口コミ・レビュー
        ══════════════════════════════════════════════════ */}
        <div className="px-4 py-4 border-b border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-stone-800">口コミ</h2>
                {reviewTotal > 0 && (
                  <p className="text-xs text-stone-500">{reviewTotal}件の口コミ</p>
                )}
              </div>
            </div>
            {isAuthenticated ? (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-full hover:bg-emerald-100 transition-colors border border-emerald-200"
              >
                <Send className="w-3 h-3" />
                口コミを書く
                <span className="text-[10px] text-emerald-500 font-bold">+50pt</span>
              </button>
            ) : (
              <a
                href={getLoginUrl()}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-full hover:bg-emerald-100 transition-colors border border-emerald-200"
              >
                ログインして書く
              </a>
            )}
          </div>

          {/* 口コミ投稿フォーム */}
          {showReviewForm && isAuthenticated && (
            <div className="mb-4 bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <p className="text-xs font-bold text-emerald-800 mb-3">口コミを投稿する（+50pt獲得）</p>
              <div className="mb-3">
                <p className="text-xs text-stone-600 mb-1.5">評価</p>
                <StarRating value={reviewRating} onChange={setReviewRating} />
              </div>
              <textarea
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                placeholder="このお土産の感想を教えてください（10文字以上）"
                rows={4}
                className="w-full text-sm text-stone-800 bg-white border border-stone-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reviewIsAnonymous}
                  onChange={(e) => setReviewIsAnonymous(e.target.checked)}
                  className="w-3.5 h-3.5 accent-emerald-600"
                />
                <span className="text-xs text-stone-600">匿名で投稿する</span>
              </label>
              {reviewError && (
                <p className="text-xs text-red-600 mt-2">{reviewError}</p>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSubmitReview}
                  disabled={createReview.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-700 text-white text-sm font-bold rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition-colors"
                >
                  {createReview.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  投稿する
                </button>
                <button
                  onClick={() => { setShowReviewForm(false); setReviewError(""); }}
                  className="px-4 py-2 bg-white border border-stone-200 text-stone-600 text-sm font-bold rounded-lg hover:bg-stone-50 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* 口コミ一覧 */}
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-stone-50 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-emerald-700">
                          {review.isAnonymous ? "匿" : (review.userName || review.authorName || "U").charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-800">
                          {review.isAnonymous ? "匿名ユーザー" : (review.userName || review.authorName || "ユーザー")}
                        </p>
                        <StarRating value={review.rating} readonly />
                      </div>
                    </div>
                    <p className="text-[10px] text-stone-400 flex-shrink-0">
                      {new Date(review.createdAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <p className="text-sm text-stone-700 leading-relaxed">{review.body}</p>
                  {review.purposeTag && (
                    <span className="inline-block mt-1.5 text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                      #{review.purposeTag}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-stone-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">まだ口コミがありません</p>
              <p className="text-xs mt-0.5">最初の口コミを投稿して+50ptゲット！</p>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════
            セクション 11: 関連商品
        ══════════════════════════════════════════════════ */}
        {relatedProducts.length > 0 && (
          <div className="px-4 py-4 border-b border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-stone-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {product.prefecture}の他のお土産
              </h2>
              <button
                onClick={() => navigate(`/db-search?prefecture=${encodeURIComponent(product.prefecture)}`)}
                className="text-xs text-emerald-700 font-bold flex items-center gap-0.5"
              >
                もっと見る <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {relatedProducts.map((related) => (
                <button
                  key={related.id}
                  onClick={() => navigate(`/db-product/${related.id}`)}
                  className="w-full flex items-center gap-3 bg-stone-50 rounded-xl p-3 hover:bg-emerald-50 transition-colors text-left"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
                    {(related.realImageUrl || related.imageUrl) ? (
                      <img
                        src={related.realImageUrl || related.imageUrl || ""}
                        alt={related.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getCategoryImage(related.category || "その他");
                        }}
                      />
                    ) : (
                      <img
                        src={getCategoryImage(related.category || "その他")}
                        alt={related.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-900 line-clamp-2">{related.name}</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">{related.brand}</p>
                  </div>
                  <p className="text-sm font-black text-emerald-700 flex-shrink-0">
                    ¥{related.price.toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 同じ都道府県のお土産を探す ── */}
        <div className="px-4 py-4">
          <button
            onClick={() => navigate(`/db-search?prefecture=${encodeURIComponent(product.prefecture)}`)}
            className="w-full flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 hover:bg-emerald-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-bold text-emerald-800">
                {product.prefecture}の他のお土産を見る
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600" />
          </button>
        </div>

      </div>
    </AppLayout>
  );
}
