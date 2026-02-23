// ============================================================
// Omiyage Go - 共通バッジ・チップ・タグコンポーネント
// デザイン哲学: 駅案内板スタイル - 瞬時に読み取れる視覚的ラベル
// ============================================================
import { cn } from "@/lib/utils";
import type { BadgeType, GateStatus } from "@/lib/mockData";

// ── 推薦バッジ ──────────────────────────────────────────────
const BADGE_CONFIG: Record<BadgeType, { label: string; className: string }> = {
  editorial: {
    label: "編集部推薦",
    className: "bg-emerald-700 text-white",
  },
  local: {
    label: "地元定番",
    className: "bg-amber-600 text-white",
  },
  corporate: {
    label: "法人向け安心",
    className: "bg-blue-700 text-white",
  },
};

interface RecommendBadgeProps {
  type: BadgeType;
  label?: string;
  className?: string;
}

export function RecommendBadge({ type, label, className }: RecommendBadgeProps) {
  const config = BADGE_CONFIG[type];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-wide",
        config.className,
        className
      )}
    >
      {label ?? config.label}
    </span>
  );
}

// ── 制約チップ ──────────────────────────────────────────────
interface ConstraintChipProps {
  label: string;
  variant?: "default" | "highlight" | "muted";
  className?: string;
}

export function ConstraintChip({
  label,
  variant = "default",
  className,
}: ConstraintChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
        variant === "default" && "bg-stone-100 text-stone-700 border-stone-200",
        variant === "highlight" && "bg-emerald-50 text-emerald-800 border-emerald-200",
        variant === "muted" && "bg-gray-50 text-gray-500 border-gray-200",
        className
      )}
    >
      {label}
    </span>
  );
}

// ── 売り場タグ ──────────────────────────────────────────────
interface LocationTagProps {
  facilityName: string;
  gateStatus: GateStatus;
  walkingMinutes: number;
  className?: string;
  size?: "sm" | "md";
}

export function LocationTag({
  facilityName,
  gateStatus,
  walkingMinutes,
  className,
  size = "md",
}: LocationTagProps) {
  const isInside = gateStatus === "改札内";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border",
        size === "sm" ? "px-2 py-1" : "px-3 py-1.5",
        "bg-white border-stone-200",
        className
      )}
    >
      {/* 改札内外バッジ - 最も目立たせる */}
      <span
        className={cn(
          "font-black tracking-tight rounded px-1.5 py-0.5",
          size === "sm" ? "text-xs" : "text-sm",
          isInside
            ? "bg-emerald-700 text-white"
            : "bg-orange-500 text-white"
        )}
      >
        {gateStatus}
      </span>
      <span
        className={cn(
          "text-stone-600 font-medium",
          size === "sm" ? "text-xs" : "text-sm"
        )}
      >
        {facilityName}
      </span>
      <span
        className={cn(
          "text-stone-400",
          size === "sm" ? "text-xs" : "text-sm"
        )}
      >
        徒歩{walkingMinutes}分
      </span>
    </div>
  );
}

// ── 今買えるタグ ──────────────────────────────────────────────
interface BuyNowTagProps {
  facilityName: string;
  gateStatus: GateStatus;
  walkingMinutes: number;
  className?: string;
}

export function BuyNowTag({
  facilityName,
  gateStatus,
  walkingMinutes,
  className,
}: BuyNowTagProps) {
  const isInside = gateStatus === "改札内";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5",
        isInside ? "bg-emerald-50 border border-emerald-200" : "bg-orange-50 border border-orange-200",
        className
      )}
    >
      <span className="text-xs font-bold text-stone-500">今買える</span>
      <span
        className={cn(
          "font-black text-xs px-1.5 py-0.5 rounded",
          isInside ? "bg-emerald-700 text-white" : "bg-orange-500 text-white"
        )}
      >
        {gateStatus}
      </span>
      <span className="text-xs text-stone-600 font-medium">{facilityName}</span>
      <span className="text-xs text-stone-400">徒歩{walkingMinutes}分</span>
    </div>
  );
}

// ── 在庫ステータスバナー ──────────────────────────────────────
interface StockBannerProps {
  status: "soldout_risk" | "unknown";
}

export function StockBanner({ status }: StockBannerProps) {
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
      <span className="text-amber-500 text-lg leading-none mt-0.5">⚠️</span>
      <div>
        <p className="text-sm font-bold text-amber-800">
          {status === "soldout_risk"
            ? "本日は売り切れの可能性があります"
            : "在庫状況が確認できていません"}
        </p>
        <p className="text-xs text-amber-600 mt-0.5">
          店舗にお問い合わせいただくか、近い条件の代替品もご確認ください
        </p>
      </div>
    </div>
  );
}
