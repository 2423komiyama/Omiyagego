// ============================================================
// Omiyage Go - お気に入り画面
// ============================================================
import { useLocation } from "wouter";
import { Heart } from "lucide-react";
import { AppLayout } from "@/components/omiyage/AppLayout";

export default function Favorites() {
  const [, navigate] = useLocation();

  return (
    <AppLayout>
      <div className="px-4 pt-6">
        <h1 className="text-xl font-black text-stone-900 mb-1">お気に入り</h1>
        <p className="text-sm text-stone-500 mb-8">保存した商品を比較・再購入</p>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-stone-300" />
          </div>
          <p className="text-base font-bold text-stone-500 mb-1">
            お気に入りはまだありません
          </p>
          <p className="text-sm text-stone-400 mb-6">
            商品詳細から♡をタップして保存できます
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-emerald-700 text-white rounded-xl text-sm font-bold hover:bg-emerald-800 transition-colors"
          >
            探しに行く
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
