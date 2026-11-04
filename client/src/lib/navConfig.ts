// ============================================================
// Omiyage Go - グローバルナビゲーション項目定義（共通）
// デスクトップサイドバー(AppLayout.tsx)とモバイル下部ナビ(BottomNav.tsx)は
// 表示のズレを防ぐため、必ずこの一覧を参照すること。
//
// ============================================================
import { Home, Search, Trophy, Heart, User, MapPin, type LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "ホーム", icon: Home, path: "/" },
  { id: "search", label: "探す", icon: Search, path: "/db-search" },
  { id: "map", label: "マップ", icon: MapPin, path: "/map" },
  { id: "collector", label: "コレクター", icon: Trophy, path: "/collector" },
  { id: "favorites", label: "お気に入り", icon: Heart, path: "/db-favorites" },
  { id: "mypage", label: "マイページ", icon: User, path: "/mypage" },
];

export function isNavItemActive(path: string, location: string): boolean {
  if (path === "/") return location === "/";
  if (path === "/db-search") return location.startsWith("/db-search") || location.startsWith("/search");
  return location.startsWith(path);
}
