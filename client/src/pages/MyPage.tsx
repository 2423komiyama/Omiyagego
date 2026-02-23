// ============================================================
// Omiyage Go - マイページ
// デザイン哲学: 駅案内板スタイル - 履歴・設定・法人モード
// ============================================================
import { useLocation } from "wouter";
import {
  Clock,
  Package,
  Settings,
  ChevronRight,
  Building2,
  RotateCcw,
  Eye,
  Trash2,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { useHistory } from "@/contexts/HistoryContext";
import { useSearch } from "@/contexts/SearchContext";
import { cn } from "@/lib/utils";

export default function MyPage() {
  const [, navigate] = useLocation();
  const {
    searchHistory,
    removeSearchHistory,
    clearSearchHistory,
    viewHistory,
    clearViewHistory,
  } = useHistory();
  const { setConditions } = useSearch();

  // 前回の条件で再検索
  const handleReSearch = (conditions: typeof searchHistory[0]["conditions"]) => {
    setConditions(conditions);
    navigate("/results");
  };

  return (
    <AppLayout>
      <div className="px-4 pt-6 space-y-5">
        <div>
          <h1 className="text-xl font-black text-stone-900 mb-1">マイページ</h1>
          <p className="text-sm text-stone-500">履歴・設定・法人モード</p>
        </div>

        {/* ── 検索履歴 ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-500" />
              <h2 className="text-sm font-bold text-stone-700">検索履歴</h2>
              {searchHistory.length > 0 && (
                <span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full">
                  {searchHistory.length}件
                </span>
              )}
            </div>
            {searchHistory.length > 0 && (
              <button
                onClick={clearSearchHistory}
                className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                全削除
              </button>
            )}
          </div>

          {searchHistory.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
              <p className="text-sm text-stone-400">検索履歴はまだありません</p>
              <p className="text-xs text-stone-300 mt-1">
                条件を入力して検索すると履歴が表示されます
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2.5 hover:border-emerald-300 transition-colors"
                >
                  <button
                    onClick={() => handleReSearch(entry.conditions)}
                    className="flex-1 flex items-center gap-2.5 text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-800 truncate">
                        {entry.label}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {entry.resultCount}件 ·{" "}
                        {new Date(entry.timestamp).toLocaleDateString("ja-JP", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 flex-shrink-0">
                      再検索
                    </span>
                  </button>
                  <button
                    onClick={() => removeSearchHistory(entry.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-100 flex-shrink-0"
                  >
                    <X className="w-3 h-3 text-stone-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 閲覧履歴 ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-stone-500" />
              <h2 className="text-sm font-bold text-stone-700">最近見た商品</h2>
              {viewHistory.length > 0 && (
                <span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full">
                  {viewHistory.length}件
                </span>
              )}
            </div>
            {viewHistory.length > 0 && (
              <button
                onClick={clearViewHistory}
                className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                全削除
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
                <button
                  key={entry.productId}
                  onClick={() => navigate(`/product/${entry.productId}`)}
                  className="flex-shrink-0 w-20 flex flex-col items-center gap-1 group"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-stone-200 group-hover:border-emerald-400 transition-colors">
                    <img
                      src={entry.productImage}
                      alt={entry.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-[10px] text-stone-600 font-medium text-center leading-tight line-clamp-2 w-full">
                    {entry.productName}
                  </p>
                  <p className="text-[10px] text-stone-400 font-bold">
                    {entry.productPrice}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── 取り置き履歴 ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-stone-500" />
            <h2 className="text-sm font-bold text-stone-700">取り置き履歴</h2>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
            <p className="text-sm text-stone-400">取り置き履歴はありません</p>
            <p className="text-xs text-stone-300 mt-1">
              商品詳細から取り置きを申し込むと表示されます
            </p>
          </div>
        </section>

        {/* ── 設定 ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-4 h-4 text-stone-500" />
            <h2 className="text-sm font-bold text-stone-700">設定</h2>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            {[
              { label: "位置情報", value: "許可済み" },
              { label: "通知", value: "オフ" },
              { label: "アプリバージョン", value: "1.0.0 MVP" },
            ].map((item, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-between px-4 py-3",
                  i < 2 && "border-b border-stone-100"
                )}
              >
                <span className="text-sm text-stone-700">{item.label}</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-stone-400">{item.value}</span>
                  {i < 2 && <ChevronRight className="w-4 h-4 text-stone-300" />}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 法人モード ── */}
        <div className="bg-stone-900 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-white font-bold text-sm mb-1">
                法人の手配をまとめて任せる
              </h3>
              <p className="text-stone-400 text-xs leading-relaxed mb-3">
                のし・宛名・請求書・複数送付先に対応（準備中）
              </p>
              <button className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors">
                法人の相談をする
              </button>
            </div>
          </div>
        </div>

        <div className="h-2" />
      </div>
    </AppLayout>
  );
}
