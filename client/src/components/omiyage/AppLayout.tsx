// ============================================================
// Omiyage Go - モバイルアプリレイアウトラッパー
// ============================================================
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
  className?: string;
}

export function AppLayout({ children, hideNav = false, className }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-stone-50 flex justify-center">
      <div className="w-full max-w-md relative min-h-screen bg-stone-50">
        <main
          className={cn(
            "pb-20", // BottomNavの高さ分のパディング
            className
          )}
        >
          {children}
        </main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
