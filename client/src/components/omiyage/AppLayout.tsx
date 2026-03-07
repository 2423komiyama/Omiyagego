// ============================================================
// Omiyage Go - レスポンシブアプリレイアウト
// モバイル: BottomNav / PC: サイドバーナビ
// ============================================================
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BottomNav } from "./BottomNav";
import { useLocation, Link } from "wouter";
import { Home, Search, MapPin, Heart, User, BookOpen } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
  className?: string;
}

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "ホーム" },
  { href: "/db-search", icon: Search, label: "探す" },
  { href: "/map", icon: MapPin, label: "マップ" },
  { href: "/favorites", icon: Heart, label: "お気に入り" },
  { href: "/mypage", icon: User, label: "マイページ" },
];

function DesktopSidebar() {
  const [location] = useLocation();
  return (
    <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-white border-r border-stone-200 fixed left-0 top-0 z-30">
      {/* ロゴ */}
      <Link href="/" className="flex items-center gap-2 px-5 py-5 border-b border-stone-100">
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-black">O</span>
        </div>
        <div>
          <span className="text-stone-900 font-black text-base tracking-tight">Omiyage Go</span>
          <p className="text-stone-400 text-[10px] leading-none mt-0.5">外さないお土産を最短距離で</p>
        </div>
      </Link>
      {/* ナビゲーション */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-emerald-600" : "text-stone-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {/* フッターリンク */}
      <div className="px-5 py-4 border-t border-stone-100">
        <p className="text-[10px] text-stone-400">© 2025 Omiyage Go</p>
      </div>
    </aside>
  );
}

export function AppLayout({ children, hideNav = false, className }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* PCサイドバー */}
      <DesktopSidebar />

      {/* メインコンテンツ */}
      <div className="lg:ml-56 flex justify-center">
        <div className="w-full max-w-2xl relative min-h-screen bg-stone-50">
          <main
            className={cn(
              "pb-20 lg:pb-8", // モバイルはBottomNav分、PCは通常パディング
              className
            )}
          >
            {children}
          </main>
          {/* モバイルのみBottomNav表示 */}
          {!hideNav && <BottomNav />}
        </div>
      </div>
    </div>
  );
}
