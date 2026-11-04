// ============================================================
// Omiyage Go - お気に入り画面
// このページ(/favorites)はモックデータ(@/lib/mockData)ベースの旧実装だったが、
// 実DBに繋がった /db-favorites (DBFavorites.tsx) に一本化した。
// どこからもナビゲーションされていないURL（直打ち・古いブックマーク等）でも
// 架空データの一覧に着地しないよう、実データ版へリダイレクトする。
// ============================================================
import { Redirect } from "wouter";

export default function Favorites() {
  return <Redirect to="/db-favorites" />;
}
