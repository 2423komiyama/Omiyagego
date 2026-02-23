// ============================================================
// Omiyage Go - 保証書カードコンポーネント
// デザイン哲学: スタンプ風デザインで信頼感を演出
// ============================================================
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface GuaranteeCardProps {
  reasons: string[];
  productName?: string;
  note?: string;
  className?: string;
  compact?: boolean;
}

export function GuaranteeCard({
  reasons,
  productName,
  note,
  className,
  compact = false,
}: GuaranteeCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-emerald-700 bg-emerald-50 overflow-hidden",
        compact ? "p-4" : "p-5",
        className
      )}
    >
      {/* スタンプ風の装飾 */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
        <div className="w-full h-full border-4 border-emerald-700 rounded-full flex items-center justify-center">
          <span className="text-emerald-700 font-black text-xs">保証</span>
        </div>
      </div>

      {/* ヘッダー */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-8 h-8 bg-emerald-700 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-base font-black text-emerald-900 tracking-tight">
            保証書
          </h3>
          <p className="text-xs text-emerald-700 font-medium">
            この条件なら、外しにくい理由
          </p>
        </div>
      </div>

      {/* 理由リスト */}
      <ul className="space-y-2">
        {reasons.map((reason, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-emerald-700 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              {i + 1}
            </span>
            <span
              className={cn(
                "text-emerald-900 font-medium leading-snug",
                compact ? "text-sm" : "text-sm"
              )}
            >
              {reason}
            </span>
          </li>
        ))}
      </ul>

      {/* 注意文 */}
      {note && (
        <p className="mt-3 text-xs text-emerald-600 border-t border-emerald-200 pt-2">
          ※ {note}
        </p>
      )}
    </div>
  );
}
