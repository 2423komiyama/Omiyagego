// ============================================================
// Omiyage Go - 条件入力画面（用途×制約）
// デザイン哲学: 失敗回避に必要な条件を最短で集める
// ============================================================
import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { useSearch } from "@/contexts/SearchContext";
import {
  PURPOSE_LIST,
  BUDGET_OPTIONS,
  SHELF_LIFE_OPTIONS,
  COUNT_OPTIONS,
  TEMPERATURE_OPTIONS,
  type TemperatureType,
} from "@/lib/mockData";
import { cn } from "@/lib/utils";

export default function Conditions() {
  const [, navigate] = useLocation();
  const { conditions, updateCondition } = useSearch();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    if (!conditions.purpose) return;
    navigate("/results");
  };

  const toggle = <K extends keyof typeof conditions>(
    key: K,
    value: (typeof conditions)[K]
  ) => {
    updateCondition(key, conditions[key] === value ? null as any : value);
  };

  return (
    <AppLayout>
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100"
        >
          <ChevronLeft className="w-5 h-5 text-stone-600" />
        </button>
        <div>
          <h1 className="text-base font-black text-stone-900">条件を入力</h1>
          <p className="text-xs text-stone-500">
            条件を入れるほど、外しにくくなります
          </p>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-6 pb-6">
        {/* ── 用途（必須） ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-black text-stone-900">用途</h2>
            <span className="text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">
              必須
            </span>
          </div>
          {submitted && !conditions.purpose && (
            <div className="flex items-center gap-1.5 text-red-500 text-xs mb-2">
              <AlertCircle className="w-3.5 h-3.5" />
              用途を選んでください
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            {PURPOSE_LIST.map((p) => (
              <button
                key={p.id}
                onClick={() => updateCondition("purpose", p.id)}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-center transition-all",
                  conditions.purpose === p.id
                    ? "bg-emerald-700 border-emerald-700 text-white shadow-sm"
                    : "bg-white border-stone-200 text-stone-700 hover:border-emerald-400"
                )}
              >
                <span className="text-xl">{p.icon}</span>
                <span className="text-xs font-bold">{p.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── 予算 ── */}
        <section>
          <h2 className="text-sm font-black text-stone-900 mb-3">予算</h2>
          <div className="flex flex-wrap gap-2">
            {BUDGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggle("budget", opt.value)}
                className={cn(
                  "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                  conditions.budget === opt.value
                    ? "bg-emerald-700 border-emerald-700 text-white"
                    : "bg-white border-stone-200 text-stone-700 hover:border-emerald-400"
                )}
              >
                {opt.label}
              </button>
            ))}
            <button
              className={cn(
                "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                "bg-white border-stone-200 text-stone-400 hover:border-stone-300"
              )}
            >
              指定
            </button>
          </div>
        </section>

        {/* ── 日持ち ── */}
        <section>
          <h2 className="text-sm font-black text-stone-900 mb-3">日持ち</h2>
          <div className="flex flex-wrap gap-2">
            {SHELF_LIFE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggle("shelfLife", opt.value)}
                className={cn(
                  "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                  conditions.shelfLife === opt.value
                    ? "bg-emerald-700 border-emerald-700 text-white"
                    : "bg-white border-stone-200 text-stone-700 hover:border-emerald-400"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── 個包装 ── */}
        <section>
          <h2 className="text-sm font-black text-stone-900 mb-3">個包装</h2>
          <div className="flex gap-3">
            <button
              onClick={() =>
                updateCondition(
                  "individuallyWrapped",
                  conditions.individuallyWrapped === true ? null : true
                )
              }
              className={cn(
                "flex-1 py-3 rounded-xl border text-sm font-bold transition-all",
                conditions.individuallyWrapped === true
                  ? "bg-emerald-700 border-emerald-700 text-white"
                  : "bg-white border-stone-200 text-stone-700 hover:border-emerald-400"
              )}
            >
              必須
            </button>
            <button
              onClick={() => updateCondition("individuallyWrapped", null)}
              className={cn(
                "flex-1 py-3 rounded-xl border text-sm font-bold transition-all",
                conditions.individuallyWrapped === null
                  ? "bg-emerald-700 border-emerald-700 text-white"
                  : "bg-white border-stone-200 text-stone-700 hover:border-emerald-400"
              )}
            >
              どちらでも
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-1.5">
            迷ったら「どちらでも」を選んでください。
          </p>
        </section>

        {/* ── 人数 ── */}
        <section>
          <h2 className="text-sm font-black text-stone-900 mb-3">人数（目安）</h2>
          <div className="flex flex-wrap gap-2">
            {COUNT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggle("count", opt.value)}
                className={cn(
                  "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                  conditions.count === opt.value
                    ? "bg-emerald-700 border-emerald-700 text-white"
                    : "bg-white border-stone-200 text-stone-700 hover:border-emerald-400"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── アレルギー（任意） ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-black text-stone-900">アレルギー</h2>
            <span className="text-xs text-stone-400">任意</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {["卵", "乳", "小麦", "そば", "落花生", "えび", "かに"].map((a) => (
              <button
                key={a}
                className="px-3 py-1.5 rounded-full border border-stone-200 bg-white text-sm text-stone-600 hover:border-stone-400 transition-colors"
              >
                {a}
              </button>
            ))}
          </div>
        </section>

        {/* ── 温度帯 ── */}
        <section>
          <h2 className="text-sm font-black text-stone-900 mb-3">温度帯</h2>
          <div className="flex gap-2">
            {TEMPERATURE_OPTIONS.map((temp) => (
              <button
                key={temp}
                onClick={() => toggle("temperature", temp as TemperatureType)}
                className={cn(
                  "flex-1 py-3 rounded-xl border text-sm font-bold transition-all",
                  conditions.temperature === temp
                    ? "bg-emerald-700 border-emerald-700 text-white"
                    : "bg-white border-stone-200 text-stone-700 hover:border-emerald-400"
                )}
              >
                {temp}
              </button>
            ))}
          </div>
        </section>

        {/* CTA */}
        <button
          onClick={handleSubmit}
          className={cn(
            "w-full py-4 rounded-xl text-base font-black transition-all",
            conditions.purpose
              ? "bg-emerald-700 text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 active:scale-[0.98]"
              : "bg-stone-200 text-stone-400 cursor-not-allowed"
          )}
        >
          おすすめを見る
        </button>
      </div>
    </AppLayout>
  );
}
