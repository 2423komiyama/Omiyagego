// ============================================================
// Omiyage Go - マイページ
// 機能: ポイント残高・バッジ一覧・活動履歴 + 検索/閲覧履歴・設定
// ============================================================
import { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Helmet } from "react-helmet-async";
import {
  Clock, Package, Settings, ChevronRight, Building2,
  RotateCcw, Eye, Trash2, X, Award, Star, Heart,
  MessageSquare, Loader2, Coins, Trophy, TrendingUp,
  Gift, User, Lock, LogIn
} from "lucide-react";
import { useHistory } from "@/contexts/HistoryContext";
import { useSearch } from "@/contexts/SearchContext";
import { cn } from "@/lib/utils";

// バッジ定義
const BADGE_DEFINITIONS: Record<string, {
  label: string;
  description: string;
  icon: string;
  color: string;
}> = {
  first_review: { label: "初めての口コミ", description: "初めて口コミを投稿しました", icon: "✍️", color: "bg-blue-100 text-blue-700 border-blue-200" },
  review_master: { label: "口コミマスター", description: "口コミを5件投稿しました", icon: "📝", color: "bg-purple-100 text-purple-700 border-purple-200" },
  review_expert: { label: "口コミエキスパート", description: "口コミを20件投稿しました", icon: "🏆", color: "bg-amber-100 text-amber-700 border-amber-200" },
  like_lover: { label: "いいね王", description: "いいねを20件しました", icon: "❤️", color: "bg-rose-100 text-rose-700 border-rose-200" },
  first_login: { label: "ようこそ！", description: "Omiyage Goに初めてログインしました", icon: "🎉", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  regular_user: { label: "常連さん", description: "10回ログインしました", icon: "⭐", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  omiyage_fan: { label: "お土産ファン", description: "100ポイント以上獲得しました", icon: "🎁", color: "bg-orange-100 text-orange-700 border-orange-200" },
};

const LOCKED_BADGES = [
  { label: "初めての口コミ", icon: "✍️", hint: "口コミを1件投稿", type: "first_review" },
  { label: "口コミマスター", icon: "📝", hint: "口コミを5件投稿", type: "review_master" },
  { label: "いいね王", icon: "❤️", hint: "いいねを20件", type: "like_lover" },
  { label: "常連さん", icon: "⭐", hint: "10回ログイン", type: "regular_user" },
  { label: "お土産ファン", icon: "🎁", hint: "100pt以上獲得", type: "omiyage_fan" },
];

const POINT_REASON_LABELS: Record<string, string> = {
  earn_review: "口コミ投稿",
  earn_like: "いいね",
  earn_login: "ログインボーナス",
  earn_bonus: "ボーナス",
  earn_admin: "特別付与",
  use_coupon: "クーポン利用",
  use_exchange: "ポイント交換",
  expire: "ポイント失効",
};

function PointAmount({ amount }: { amount: number }) {
  return (
    <span className={cn("text-sm font-bold", amount > 0 ? "text-emerald-600" : "text-red-500")}>
      {amount > 0 ? `+${amount}` : amount}pt
    </span>
  );
}

type MainTab = "points" | "badges" | "history" | "activity";

export default function MyPage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { searchHistory, removeSearchHistory, clearSearchHistory, viewHistory, clearViewHistory } = useHistory();
  const { setConditions } = useSearch();
  const [mainTab, setMainTab] = useState<MainTab>("points");

  // ポイント情報
  const { data: pointsData, isLoading: pointsLoading } = trpc.points.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // ポイント履歴
  const { data: transactionsData, isLoading: txLoading } = trpc.points.transactions.useQuery(
    { limit: 20 },
    { enabled: isAuthenticated && mainTab === "history" }
  );

  // バッジ
  const { data: badges = [], isLoading: badgesLoading } = trpc.badges.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const handleReSearch = (conditions: typeof searchHistory[0]["conditions"]) => {
    setConditions(conditions);
    navigate("/results");
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  // ── 未ログイン時 ──────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <AppLayout>
        <Helmet>
          <title>マイページ | Omiyage Go</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="px-4 pt-6 space-y-5">
          {/* ログイン促進バナー */}
          <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-base font-black text-white">ログインしてポイントを貯めよう</p>
                <p className="text-xs text-emerald-200">初回ログインで +100pt プレゼント！</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { icon: "🎉", label: "初回ログイン", pts: "+100pt" },
                { icon: "✍️", label: "口コミ投稿", pts: "+50pt" },
                { icon: "❤️", label: "いいね", pts: "+5pt" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs text-emerald-100 flex-1">{item.label}</span>
                  <span className="text-xs font-bold text-amber-300">{item.pts}</span>
                </div>
              ))}
            </div>
            <a
              href={getLoginUrl()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white text-emerald-800 text-sm font-bold rounded-xl hover:bg-emerald-50 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              ログインして始める
            </a>
          </div>

          {/* 検索履歴（未ログインでも表示） */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-500" />
                <h2 className="text-sm font-bold text-stone-700">検索履歴</h2>
              </div>
              {searchHistory.length > 0 && (
                <button onClick={clearSearchHistory} className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />全削除
                </button>
              )}
            </div>
            {searchHistory.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
                <p className="text-sm text-stone-400">検索履歴はまだありません</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2.5">
                    <button onClick={() => handleReSearch(entry.conditions)} className="flex-1 flex items-center gap-2.5 text-left">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-stone-800 truncate">{entry.label}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          {entry.resultCount}件 · {new Date(entry.timestamp).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 flex-shrink-0">再検索</span>
                    </button>
                    <button onClick={() => removeSearchHistory(entry.id)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-100">
                      <X className="w-3 h-3 text-stone-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </AppLayout>
    );
  }

  // ── ログイン済み ──────────────────────────────────────────
  const totalPoints = pointsData?.availablePoints ?? 0;
  const earnedPoints = pointsData?.totalPoints ?? 0;
  const usedPoints = pointsData?.usedPoints ?? 0;
  const transactions = transactionsData?.transactions ?? [];
  const earnedBadgeTypes = badges.map((b: { badgeType: string }) => b.badgeType);

  return (
    <AppLayout>
      <Helmet>
        <title>マイページ | Omiyage Go</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* ── プロフィールヘッダー ── */}
      <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 px-4 pt-6 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-black text-white">{(user?.name || "U").charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-black text-white truncate">{user?.name || "ゲスト"}</p>
            <p className="text-xs text-emerald-200 mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* ポイントカード */}
        <div className="mt-5 bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-amber-300" />
            <span className="text-xs text-emerald-200 font-medium">保有ポイント</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-white">{totalPoints.toLocaleString()}</span>
            <span className="text-sm text-emerald-200 mb-1">pt</span>
          </div>
          <div className="flex gap-4 mt-2 text-xs text-emerald-300">
            <span>累計獲得: {earnedPoints.toLocaleString()}pt</span>
            <span>使用済み: {usedPoints.toLocaleString()}pt</span>
          </div>
          <button
            onClick={() => alert("ポイント交換機能は近日公開予定です！")}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-white/20 text-white text-xs font-bold rounded-xl hover:bg-white/30 transition-colors"
          >
            <Gift className="w-3.5 h-3.5" />
            ポイントを交換する（近日公開）
          </button>
        </div>
      </div>

      {/* ── タブ ── */}
      <div className="flex border-b border-stone-100 bg-white sticky top-0 z-10 overflow-x-auto">
        {[
          { id: "points" as const, label: "ポイント", icon: TrendingUp },
          { id: "badges" as const, label: "バッジ", icon: Trophy },
          { id: "history" as const, label: "PT履歴", icon: Coins },
          { id: "activity" as const, label: "閲覧/検索", icon: Clock },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMainTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap px-2",
              mainTab === id ? "border-emerald-600 text-emerald-700" : "border-transparent text-stone-500 hover:text-stone-700"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="pb-24">

        {/* ── ポイントタブ ── */}
        {mainTab === "points" && (
          <div className="px-4 py-4 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500" />ポイントの貯め方
              </h2>
              <div className="space-y-2">
                {[
                  { icon: "✍️", label: "口コミを投稿する", pts: "+50pt", desc: "初回は+50pt、2回目以降も+20pt" },
                  { icon: "❤️", label: "お気に入りに追加する", pts: "+5pt", desc: "商品をいいねするたびに獲得" },
                  { icon: "🎉", label: "初回ログインボーナス", pts: "+100pt", desc: "初めてログインした時に付与" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 bg-stone-50 rounded-xl p-3">
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-800">{item.label}</p>
                      <p className="text-xs text-stone-500">{item.desc}</p>
                    </div>
                    <span className="text-sm font-black text-emerald-600 flex-shrink-0">{item.pts}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-emerald-600" />ポイントの使い方（予定）
              </h2>
              <div className="space-y-2">
                {[
                  { icon: "🎫", label: "クーポン・割引券と交換", status: "近日公開" },
                  { icon: "🏪", label: "加盟店での購入時に利用", status: "準備中" },
                  { icon: "✈️", label: "マイレージ・外部ポイントへ交換", status: "検討中" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 bg-stone-50 rounded-xl p-3 opacity-70">
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-700">{item.label}</p>
                    </div>
                    <span className="text-xs text-stone-400 bg-stone-200 px-2 py-0.5 rounded-full flex-shrink-0">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── バッジタブ ── */}
        {mainTab === "badges" && (
          <div className="px-4 py-4">
            {badgesLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /></div>
            ) : (
              <>
                {badges.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" />獲得済みバッジ（{badges.length}個）
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      {badges.map((badge: { badgeType: string; earnedAt: string | Date }) => {
                        const def = BADGE_DEFINITIONS[badge.badgeType];
                        if (!def) return null;
                        return (
                          <div key={badge.badgeType} className={cn("flex flex-col items-center gap-2 p-4 rounded-2xl border", def.color)}>
                            <span className="text-3xl">{def.icon}</span>
                            <p className="text-xs font-bold text-center">{def.label}</p>
                            <p className="text-[10px] text-center opacity-70">{def.description}</p>
                            <p className="text-[10px] opacity-50">{new Date(badge.earnedAt).toLocaleDateString("ja-JP")}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div>
                  <h2 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-stone-400" />チャレンジ中のバッジ
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {LOCKED_BADGES.filter(b => !earnedBadgeTypes.includes(b.type)).map((badge) => (
                      <div key={badge.label} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-stone-200 bg-stone-50 opacity-60">
                        <span className="text-3xl grayscale">{badge.icon}</span>
                        <p className="text-xs font-bold text-stone-600 text-center">{badge.label}</p>
                        <p className="text-[10px] text-stone-400 text-center">{badge.hint}</p>
                        <Lock className="w-3 h-3 text-stone-400" />
                      </div>
                    ))}
                  </div>
                  {badges.length === 0 && LOCKED_BADGES.length === 0 && (
                    <div className="text-center py-8 text-stone-400">
                      <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">まだバッジがありません</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── PT履歴タブ ── */}
        {mainTab === "history" && (
          <div className="px-4 py-4">
            <h2 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-500" />ポイント獲得履歴
            </h2>
            {txLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /></div>
            ) : transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((tx: { id: number; type: string; points: number; description?: string | null; createdAt: string | Date }) => (
                    <div key={tx.id} className="flex items-center gap-3 bg-stone-50 rounded-xl p-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      {tx.points > 0 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <Gift className="w-4 h-4 text-stone-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-800">{POINT_REASON_LABELS[tx.type] || tx.type}</p>
                      {tx.description && <p className="text-xs text-stone-500 truncate">{tx.description}</p>}
                      <p className="text-[10px] text-stone-400">
                        {new Date(tx.createdAt).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <PointAmount amount={tx.points} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-stone-400">
                <Coins className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">まだ履歴がありません</p>
                <p className="text-xs mt-1">口コミやいいねでポイントを貯めよう！</p>
              </div>
            )}
          </div>
        )}

        {/* ── 閲覧/検索履歴タブ ── */}
        {mainTab === "activity" && (
          <div className="px-4 py-4 space-y-5">
            {/* 検索履歴 */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-stone-500" />
                  <h2 className="text-sm font-bold text-stone-700">検索履歴</h2>
                  {searchHistory.length > 0 && (
                    <span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full">{searchHistory.length}件</span>
                  )}
                </div>
                {searchHistory.length > 0 && (
                  <button onClick={clearSearchHistory} className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />全削除
                  </button>
                )}
              </div>
              {searchHistory.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-stone-400">検索履歴はまだありません</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchHistory.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2.5 hover:border-emerald-300 transition-colors">
                      <button onClick={() => handleReSearch(entry.conditions)} className="flex-1 flex items-center gap-2.5 text-left">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-stone-800 truncate">{entry.label}</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            {entry.resultCount}件 · {new Date(entry.timestamp).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 flex-shrink-0">再検索</span>
                      </button>
                      <button onClick={() => removeSearchHistory(entry.id)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-100 flex-shrink-0">
                        <X className="w-3 h-3 text-stone-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 閲覧履歴 */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-stone-500" />
                  <h2 className="text-sm font-bold text-stone-700">最近見た商品</h2>
                  {viewHistory.length > 0 && (
                    <span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full">{viewHistory.length}件</span>
                  )}
                </div>
                {viewHistory.length > 0 && (
                  <button onClick={clearViewHistory} className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />全削除
                  </button>
                )}
              </div>
              {viewHistory.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-stone-400">閲覧履歴はまだありません</p>
                </div>
              ) : (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {viewHistory.map((entry) => (
                    <button key={entry.productId} onClick={() => navigate(`/product/${entry.productId}`)} className="flex-shrink-0 w-20 flex flex-col items-center gap-1 group">
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-stone-200 group-hover:border-emerald-400 transition-colors">
                        <img src={entry.productImage} alt={entry.productName} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[10px] text-stone-600 font-medium text-center leading-tight line-clamp-2 w-full">{entry.productName}</p>
                      <p className="text-[10px] text-stone-400 font-bold">{entry.productPrice}</p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* 設定 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-4 h-4 text-stone-500" />
                <h2 className="text-sm font-bold text-stone-700">設定</h2>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                {[
                  { label: "位置情報", value: "許可済み" },
                  { label: "通知", value: "オフ" },
                  { label: "アプリバージョン", value: "1.0.0" },
                ].map((item, i) => (
                  <div key={i} className={cn("flex items-center justify-between px-4 py-3", i < 2 && "border-b border-stone-100")}>
                    <span className="text-sm text-stone-700">{item.label}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-stone-400">{item.value}</span>
                      {i < 2 && <ChevronRight className="w-4 h-4 text-stone-300" />}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 法人モード */}
            <div className="bg-stone-900 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-white font-bold text-sm mb-1">法人の手配をまとめて任せる</h3>
                  <p className="text-stone-400 text-xs leading-relaxed mb-3">のし・宛名・請求書・複数送付先に対応（準備中）</p>
                  <button className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors">
                    法人の相談をする
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* クイックアクション */}
        <div className="px-4 py-4 border-t border-stone-100 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate("/db-search")} className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-100 transition-colors">
              <Heart className="w-4 h-4" />お土産を探す
            </button>
            <button onClick={() => navigate("/db-search")} className="flex items-center justify-center gap-2 py-3 bg-stone-50 text-stone-700 text-sm font-bold rounded-xl hover:bg-stone-100 transition-colors">
              <MessageSquare className="w-4 h-4" />口コミを書く
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
