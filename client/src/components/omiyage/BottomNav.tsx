// ============================================================
// Omiyage Go - 下部グローバルナビゲーション
// デザイン哲学: 駅案内板スタイル - 5タブ固定ナビ
// ============================================================
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { Home, Search, Trophy, Heart, User } from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "ホーム", icon: Home, path: "/" },
  { id: "search", label: "探す", icon: Search, path: "/db-search" },
  { id: "collector", label: "コレクター", icon: Trophy, path: "/collector" },
  { id: "favorites", label: "お気に入り", icon: Heart, path: "/favorites" },
  { id: "mypage", label: "マイページ", icon: User, path: "/mypage" },
];

export function BottomNav() {
  const [location, navigate] = useLocation();

  const handleNav = (item: (typeof NAV_ITEMS)[0]) => {
    navigate(item.path);
  };

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    if (path === "/db-search") return location.startsWith("/db-search") || location.startsWith("/search");
    return location.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 safe-area-pb">
      <div className="max-w-md mx-auto flex">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors",
                active ? "text-emerald-700" : "text-stone-400 hover:text-stone-600"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform",
                  active && "scale-110"
                )}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  active ? "text-emerald-700 font-bold" : "text-stone-400"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
