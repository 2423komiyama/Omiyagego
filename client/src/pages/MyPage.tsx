// ============================================================
// Omiyage Go - マイページ
// ============================================================
import { useLocation } from "wouter";
import { Clock, Package, Settings, ChevronRight, Building2 } from "lucide-react";
import { AppLayout } from "@/components/omiyage/AppLayout";

export default function MyPage() {
  const [, navigate] = useLocation();

  return (
    <AppLayout>
      <div className="px-4 pt-6">
        <h1 className="text-xl font-black text-stone-900 mb-1">マイページ</h1>
        <p className="text-sm text-stone-500 mb-6">履歴・設定・法人モード</p>

        {/* 最近見た */}
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-stone-500" />
            <h2 className="text-sm font-bold text-stone-700">最近見た</h2>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
            <p className="text-sm text-stone-400">履歴はまだありません</p>
          </div>
        </section>

        {/* 取り置き履歴 */}
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-stone-500" />
            <h2 className="text-sm font-bold text-stone-700">取り置き履歴</h2>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
            <p className="text-sm text-stone-400">取り置き履歴はありません</p>
          </div>
        </section>

        {/* 設定 */}
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-4 h-4 text-stone-500" />
            <h2 className="text-sm font-bold text-stone-700">設定</h2>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            {[
              { label: "位置情報", value: "許可済み" },
              { label: "通知", value: "オフ" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3 border-b border-stone-100 last:border-0"
              >
                <span className="text-sm text-stone-700">{item.label}</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-stone-400">{item.value}</span>
                  <ChevronRight className="w-4 h-4 text-stone-300" />
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
      </div>
    </AppLayout>
  );
}
