// ============================================================
// Omiyage Go - 商品詳細画面（最重要画面）
// デザイン哲学: 保証→導線→文脈→受取 の1画面完結
// ============================================================
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ChevronLeft,
  Heart,
  Share2,
  MapPin,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { GuaranteeCard } from "@/components/omiyage/GuaranteeCard";
import { RecommendBadge, ConstraintChip, LocationTag, StockBanner } from "@/components/omiyage/Badges";
import { PRODUCTS } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type GiftTab = "greeting" | "thanks" | "apology";

const GIFT_TAB_LABELS: Record<GiftTab, string> = {
  greeting: "挨拶",
  thanks: "御礼",
  apology: "お詫び",
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [giftTab, setGiftTab] = useState<GiftTab>("greeting");
  const [copied, setCopied] = useState(false);
  const [storyExpanded, setStoryExpanded] = useState(false);
  const [showReserve, setShowReserve] = useState(false);

  const product = PRODUCTS.find((p) => p.id === id);

  if (!product) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <p className="text-stone-500 mb-4">商品が見つかりませんでした</p>
          <button
            onClick={() => navigate("/results")}
            className="px-6 py-3 bg-emerald-700 text-white rounded-xl text-sm font-bold"
          >
            検索結果に戻る
          </button>
        </div>
      </AppLayout>
    );
  }

  const primarySeller = product.sellers[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("コピーしました");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const giftText = {
    greeting: product.giftTemplates.greeting,
    thanks: product.giftTemplates.thanks,
    apology: product.giftTemplates.apology,
  };

  // 代替商品（同じ用途の別商品）
  const altProducts = PRODUCTS.filter(
    (p) =>
      p.id !== product.id &&
      p.purposes.some((pur) => product.purposes.includes(pur))
  ).slice(0, 3);

  return (
    <AppLayout className="pb-0">
      {/* ヘッダー（スクロール対応） */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1 as any)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100"
        >
          <ChevronLeft className="w-5 h-5 text-stone-600" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsFavorite(!isFavorite);
              toast.success(isFavorite ? "お気に入りを解除しました" : "お気に入りに追加しました");
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100"
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-colors",
                isFavorite ? "fill-red-500 text-red-500" : "text-stone-400"
              )}
            />
          </button>
          <button
            onClick={() => toast.info("共有機能は準備中です")}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100"
          >
            <Share2 className="w-4.5 h-4.5 text-stone-400" />
          </button>
        </div>
      </div>

      {/* 商品画像 */}
      <div className="relative h-56 bg-stone-100 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/30 to-transparent" />
      </div>

      {/* 商品名・価格 */}
      <div className="px-4 py-4 bg-white border-b border-stone-100">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {product.badges.map((badge, i) => (
            <RecommendBadge key={badge} type={badge} label={product.badgeLabels[i]} />
          ))}
        </div>
        <h1 className="text-lg font-black text-stone-900 leading-snug mb-1">
          {product.name}
        </h1>
        <p className="text-2xl font-black text-stone-900 tabular-nums">
          {product.priceLabel}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <ConstraintChip label={`日持ち${product.shelfLifeDays}日`} variant="highlight" />
          {product.individuallyWrapped && (
            <ConstraintChip label="個包装" variant="highlight" />
          )}
          <ConstraintChip label={`${product.recommendedCount}人向け`} />
          <ConstraintChip label={product.temperature} />
        </div>
      </div>

      {/* 売り切れバナー */}
      {product.stockStatus !== "available" && (
        <div className="px-4 pt-4">
          <StockBanner status={product.stockStatus} />
        </div>
      )}

      <div className="space-y-0">
        {/* ── セクションA: 保証書（最上段固定） ── */}
        <section className="px-4 py-5 bg-white border-b border-stone-100">
          <GuaranteeCard
            reasons={product.guaranteeReasons}
            note={
              product.stockStatus === "soldout_risk"
                ? "数量限定のため、売り切れの場合があります"
                : undefined
            }
          />
        </section>

        {/* ── セクションB: 今買える（導線） ── */}
        <section className="px-4 py-5 bg-white border-b border-stone-100">
          <h2 className="text-base font-black text-stone-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-700" />
            今買える場所
          </h2>

          {product.sellers.map((seller) => (
            <div
              key={seller.id}
              className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-3"
            >
              {/* 施設名 + 改札内外 */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-stone-900">
                    {seller.facilityName}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {seller.floor} · {seller.landmark}
                  </p>
                </div>
                <span
                  className={cn(
                    "font-black text-sm px-3 py-1.5 rounded-lg",
                    seller.gateStatus === "改札内"
                      ? "bg-emerald-700 text-white"
                      : "bg-orange-500 text-white"
                  )}
                >
                  {seller.gateStatus}
                </span>
              </div>

              {/* 詳細情報 */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center bg-white rounded-lg py-2 border border-stone-200">
                  <p className="text-xs text-stone-400">所要時間</p>
                  <p className="text-sm font-bold text-stone-800">
                    徒歩{seller.walkingMinutes}分
                  </p>
                </div>
                <div className="text-center bg-white rounded-lg py-2 border border-stone-200">
                  <p className="text-xs text-stone-400">混雑</p>
                  <p
                    className={cn(
                      "text-sm font-bold",
                      seller.crowdLevel === "少"
                        ? "text-emerald-700"
                        : seller.crowdLevel === "中"
                        ? "text-amber-600"
                        : "text-red-500"
                    )}
                  >
                    {seller.crowdLevel}
                  </p>
                </div>
                <div className="text-center bg-white rounded-lg py-2 border border-stone-200">
                  <p className="text-xs text-stone-400">営業時間</p>
                  <p className="text-xs font-bold text-stone-800">
                    {seller.openHours}
                  </p>
                </div>
              </div>

              {/* 補足テキスト */}
              <p className="text-xs text-stone-500 mb-3">
                {seller.gateStatus === "改札内"
                  ? "改札内に入ってから購入できます"
                  : "改札内に入る前に購入できます"}
              </p>

              {/* CTA */}
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/seller/${seller.id}`)}
                  className="flex-1 py-3 bg-emerald-700 text-white rounded-xl text-sm font-black hover:bg-emerald-800 active:scale-[0.98] transition-all"
                >
                  売り場へ行く
                </button>
                {product.canReserve && (
                  <button
                    onClick={() => setShowReserve(true)}
                    className="flex-1 py-3 bg-white border-2 border-emerald-700 text-emerald-700 rounded-xl text-sm font-black hover:bg-emerald-50 active:scale-[0.98] transition-all"
                  >
                    取り置きする
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* ── セクションC: 文脈（語れる） ── */}
        <section className="px-4 py-5 bg-white border-b border-stone-100">
          <h2 className="text-base font-black text-stone-900 mb-3">
            作り手のこと
          </h2>

          {/* 作り手の一言 */}
          <blockquote className="border-l-4 border-emerald-700 pl-4 mb-4">
            <p className="text-sm text-stone-700 italic leading-relaxed">
              {product.makerQuote}
            </p>
            <footer className="text-xs text-stone-400 mt-1">
              — {product.makerName}
            </footer>
          </blockquote>

          {/* ストーリー */}
          <div className="mb-4">
            <p
              className={cn(
                "text-sm text-stone-600 leading-relaxed",
                !storyExpanded && "line-clamp-3"
              )}
            >
              {product.makerStory}
            </p>
            <button
              onClick={() => setStoryExpanded(!storyExpanded)}
              className="flex items-center gap-1 text-xs font-bold text-emerald-700 mt-1.5"
            >
              {storyExpanded ? (
                <>
                  閉じる <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  続きを読む <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* 贈り文テンプレ */}
          <div>
            <h3 className="text-sm font-black text-stone-900 mb-2">
              贈り文テンプレ
            </h3>
            <div className="flex gap-2 mb-3">
              {(Object.keys(GIFT_TAB_LABELS) as GiftTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setGiftTab(tab)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-bold border transition-all",
                    giftTab === tab
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                  )}
                >
                  {GIFT_TAB_LABELS[tab]}
                </button>
              ))}
            </div>
            <div className="relative bg-stone-50 border border-stone-200 rounded-xl p-4">
              <p className="text-sm text-stone-700 leading-relaxed pr-8">
                {giftText[giftTab]}
              </p>
              <button
                onClick={() => handleCopy(giftText[giftTab])}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-stone-400" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ── セクションD: 受取・配送 ── */}
        <section className="px-4 py-5 bg-white">
          <h2 className="text-base font-black text-stone-900 mb-3">
            受け取り・配送
          </h2>

          <div className="space-y-2.5 mb-4">
            {[
              {
                icon: Package,
                label: "取り置き",
                available: product.canReserve,
              },
              {
                icon: CreditCard,
                label: "事前決済",
                available: product.canPrePay,
              },
              {
                icon: Truck,
                label: "配送（自宅・会社・直送）",
                available: product.canDeliver,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2.5 px-3 bg-stone-50 rounded-xl border border-stone-200"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-stone-500" />
                    <span className="text-sm text-stone-700">{item.label}</span>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      item.available
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-stone-100 text-stone-400"
                    )}
                  >
                    {item.available ? "可" : "不可"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* CTAボタン（可能なもののみ） */}
          <div className="space-y-2.5">
            {product.canPrePay && (
              <button
                onClick={() => setShowReserve(true)}
                className="w-full py-3.5 bg-emerald-700 text-white rounded-xl text-sm font-black hover:bg-emerald-800 active:scale-[0.98] transition-all"
              >
                事前決済して取り置き
              </button>
            )}
            {product.canDeliver && (
              <button
                onClick={() => toast.info("配送機能は準備中です")}
                className="w-full py-3.5 bg-white border-2 border-stone-300 text-stone-700 rounded-xl text-sm font-black hover:bg-stone-50 active:scale-[0.98] transition-all"
              >
                配送する
              </button>
            )}
          </div>
        </section>

        {/* 代替商品 */}
        {product.stockStatus !== "available" && altProducts.length > 0 && (
          <section className="px-4 py-5 bg-stone-50 border-t border-stone-200">
            <h2 className="text-sm font-black text-stone-700 mb-3">
              近い条件の代替候補
            </h2>
            <div className="space-y-2.5">
              {altProducts.map((alt) => (
                <button
                  key={alt.id}
                  onClick={() => navigate(`/product/${alt.id}`)}
                  className="w-full flex items-center gap-3 bg-white border border-stone-200 rounded-xl p-3 text-left hover:border-emerald-300 transition-colors"
                >
                  <img
                    src={alt.imageUrl}
                    alt={alt.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-900 line-clamp-1">
                      {alt.name}
                    </p>
                    <p className="text-xs text-stone-500">{alt.priceLabel}</p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-stone-300 rotate-180 flex-shrink-0" />
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="h-8" />
      </div>

      {/* 取り置きモーダル */}
      {showReserve && (
        <ReserveModal
          productName={product.name}
          onClose={() => setShowReserve(false)}
        />
      )}
    </AppLayout>
  );
}

// ── 取り置きモーダル ──────────────────────────────────────────
interface ReserveModalProps {
  productName: string;
  onClose: () => void;
}

function ReserveModal({ productName, onClose }: ReserveModalProps) {
  const [date, setDate] = useState<"today" | "tomorrow" | "specify">("today");
  const [time, setTime] = useState<"morning" | "noon" | "evening" | "specify">("morning");
  const [count, setCount] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!name.trim()) {
      toast.error("受取者名を入力してください");
      return;
    }
    setConfirmed(true);
  };

  const receiptNumber = `OG-${Math.floor(Math.random() * 90000) + 10000}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">
        {/* ハンドル */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        <div className="px-5 pb-8">
          {!confirmed ? (
            <>
              <h2 className="text-lg font-black text-stone-900 mb-1 mt-3">
                取り置き
              </h2>
              <p className="text-sm text-stone-500 mb-5">{productName}</p>

              {/* 注意文 */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-5">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  受取期限を過ぎると自動キャンセルになります
                </p>
              </div>

              {/* 受取日 */}
              <div className="mb-4">
                <label className="text-sm font-bold text-stone-700 block mb-2">
                  受取日
                </label>
                <div className="flex gap-2">
                  {(["today", "tomorrow", "specify"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDate(d)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all",
                        date === d
                          ? "bg-emerald-700 border-emerald-700 text-white"
                          : "bg-white border-stone-200 text-stone-700"
                      )}
                    >
                      {d === "today" ? "今日" : d === "tomorrow" ? "明日" : "指定"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 受取時間帯 */}
              <div className="mb-4">
                <label className="text-sm font-bold text-stone-700 block mb-2">
                  受取時間帯
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["morning", "noon", "evening", "specify"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTime(t)}
                      className={cn(
                        "py-2.5 rounded-xl border text-xs font-bold transition-all",
                        time === t
                          ? "bg-emerald-700 border-emerald-700 text-white"
                          : "bg-white border-stone-200 text-stone-700"
                      )}
                    >
                      {t === "morning" ? "午前" : t === "noon" ? "昼" : t === "evening" ? "夕方" : "指定"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 個数 */}
              <div className="mb-4">
                <label className="text-sm font-bold text-stone-700 block mb-2">
                  個数
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCount(Math.max(1, count - 1))}
                    className="w-10 h-10 bg-stone-100 rounded-xl text-stone-700 font-bold text-lg flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="text-xl font-black text-stone-900 tabular-nums w-8 text-center">
                    {count}
                  </span>
                  <button
                    onClick={() => setCount(count + 1)}
                    className="w-10 h-10 bg-stone-100 rounded-xl text-stone-700 font-bold text-lg flex items-center justify-center"
                  >
                    ＋
                  </button>
                </div>
              </div>

              {/* 受取者名 */}
              <div className="mb-4">
                <label className="text-sm font-bold text-stone-700 block mb-2">
                  受取者名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例：山田 太郎"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* 連絡先 */}
              <div className="mb-6">
                <label className="text-sm font-bold text-stone-700 block mb-2">
                  連絡先（任意）
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="例：090-1234-5678"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <button
                onClick={handleConfirm}
                className="w-full py-4 bg-emerald-700 text-white rounded-xl text-base font-black hover:bg-emerald-800 active:scale-[0.98] transition-all"
              >
                取り置きを確定する
              </button>
            </>
          ) : (
            /* 完了画面 */
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-700" />
              </div>
              <h2 className="text-lg font-black text-stone-900 mb-1">
                取り置きを受け付けました
              </h2>
              <p className="text-sm text-stone-500 mb-6">
                受付番号をお控えください
              </p>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-stone-500">受付番号</span>
                  <span className="text-sm font-black text-stone-900 tabular-nums">
                    {receiptNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-stone-500">受取場所</span>
                  <span className="text-sm font-bold text-stone-900">
                    {productName.slice(0, 10)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-stone-500">受取期限</span>
                  <span className="text-sm font-bold text-stone-900">
                    {date === "today" ? "本日" : "明日"}
                    {time === "morning" ? " 午前中" : time === "noon" ? " 昼" : " 夕方"}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 bg-emerald-700 text-white rounded-xl text-sm font-black hover:bg-emerald-800 transition-colors"
              >
                売り場を確認する
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
