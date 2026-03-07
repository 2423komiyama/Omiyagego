// ============================================================
// Omiyage Go - Admin: キュレーションリンク管理
// 機能: YouTube/SNS/記事リンクの登録・削除・一覧管理
// ============================================================
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft, Plus, Trash2, ExternalLink, Youtube, Instagram,
  Twitter, Globe, Newspaper, Loader2, AlertCircle, CheckCircle2,
  Search, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINK_TYPES = [
  { value: "youtube", label: "YouTube", icon: Youtube, color: "text-red-500" },
  { value: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
  { value: "twitter", label: "X (Twitter)", icon: Twitter, color: "text-sky-500" },
  { value: "tiktok", label: "TikTok", icon: Globe, color: "text-stone-800" },
  { value: "article", label: "記事・ブログ", icon: Newspaper, color: "text-emerald-600" },
  { value: "news", label: "ニュース", icon: Newspaper, color: "text-blue-600" },
  { value: "other", label: "その他", icon: Globe, color: "text-stone-500" },
] as const;

type LinkType = typeof LINK_TYPES[number]["value"];

function LinkTypeIcon({ type, className }: { type: string; className?: string }) {
  const def = LINK_TYPES.find(t => t.value === type);
  if (!def) return <Globe className={cn("w-4 h-4", className)} />;
  const Icon = def.icon;
  return <Icon className={cn("w-4 h-4", def.color, className)} />;
}

export default function AdminCuratedLinks() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchText, setSearchText] = useState("");

  // フォーム状態
  const [form, setForm] = useState({
    productId: "",
    type: "youtube" as LinkType,
    url: "",
    title: "",
    thumbnailUrl: "",
    description: "",
    authorName: "",
    sortOrder: 0,
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // キュレーションリンク一覧
  const { data: linksData, isLoading, refetch } = trpc.curatedLinks.adminList.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  // 追加ミューテーション
  const addLink = trpc.curatedLinks.add.useMutation({
    onSuccess: () => {
      setFormSuccess("リンクを追加しました");
      setForm({ productId: "", type: "youtube", url: "", title: "", thumbnailUrl: "", description: "", authorName: "", sortOrder: 0 });
      setShowForm(false);
      refetch();
      setTimeout(() => setFormSuccess(""), 3000);
    },
    onError: (err) => {
      setFormError(err.message);
    },
  });

  // 削除ミューテーション
  const deleteLink = trpc.curatedLinks.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-stone-700 font-bold">管理者権限が必要です</p>
        <Button onClick={() => navigate("/")} variant="outline">トップへ戻る</Button>
      </div>
    );
  }

  const links = linksData?.links ?? [];
  const filteredLinks = links.filter(link => {
    if (filterType !== "all" && link.type !== filterType) return false;
    if (searchText && !link.url.includes(searchText) && !(link.title ?? "").includes(searchText)) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.productId.trim()) { setFormError("商品IDを入力してください"); return; }
    if (!form.url.trim()) { setFormError("URLを入力してください"); return; }
    addLink.mutate(form);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Helmet>
        <title>キュレーションリンク管理 | Admin</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* ヘッダー */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/admin")} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100">
            <ArrowLeft className="w-4 h-4 text-stone-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-black text-stone-900">キュレーションリンク管理</h1>
            <p className="text-xs text-stone-500">YouTube・SNS・記事リンクの登録・削除</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white">
            <Plus className="w-4 h-4 mr-1" />
            追加
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">

        {/* 成功メッセージ */}
        {formSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-700">{formSuccess}</p>
          </div>
        )}

        {/* 追加フォーム */}
        {showForm && (
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-bold text-stone-800 mb-4">新しいリンクを追加</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-600 mb-1 block">商品ID *</label>
                  <input
                    type="text"
                    value={form.productId}
                    onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                    placeholder="例: tokyo-banana-001"
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600 mb-1 block">リンク種別 *</label>
                  <div className="relative">
                    <select
                      value={form.type}
                      onChange={e => setForm(f => ({ ...f, type: e.target.value as LinkType }))}
                      className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none bg-white"
                    >
                      {LINK_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-600 mb-1 block">URL *</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-600 mb-1 block">タイトル</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="動画・記事のタイトル"
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600 mb-1 block">投稿者名</label>
                  <input
                    type="text"
                    value={form.authorName}
                    onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))}
                    placeholder="チャンネル名・ブログ名"
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-600 mb-1 block">サムネイルURL</label>
                <input
                  type="url"
                  value={form.thumbnailUrl}
                  onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))}
                  placeholder="https://... (省略可)"
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-600 mb-1 block">説明文</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="この動画・記事について一言（省略可）"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={addLink.isPending} className="bg-emerald-700 hover:bg-emerald-800 text-white flex-1">
                  {addLink.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                  追加する
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setFormError(""); }}>
                  キャンセル
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* フィルター */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterType("all")}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
              filterType === "all" ? "bg-emerald-700 text-white" : "bg-white border border-stone-200 text-stone-600 hover:border-emerald-400"
            )}
          >
            すべて ({links.length})
          </button>
          {LINK_TYPES.map(t => {
            const count = links.filter(l => l.type === t.value).length;
            if (count === 0) return null;
            return (
              <button
                key={t.value}
                onClick={() => setFilterType(t.value)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
                  filterType === t.value ? "bg-emerald-700 text-white" : "bg-white border border-stone-200 text-stone-600 hover:border-emerald-400"
                )}
              >
                {t.label} ({count})
              </button>
            );
          })}
        </div>

        {/* 検索 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="URL・タイトルで絞り込み"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* リンク一覧 */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <Globe className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">リンクがありません</p>
            <p className="text-xs mt-1">「追加」ボタンからリンクを登録してください</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLinks.map((link: {
              id: number;
              productId: string;
              type: string;
              url: string;
              title?: string | null;
              thumbnailUrl?: string | null;
              description?: string | null;
              authorName?: string | null;
              sortOrder?: number | null;
              createdAt?: string | Date;
            }) => (
              <div key={link.id} className="bg-white border border-stone-200 rounded-xl p-3 flex items-start gap-3">
                {/* サムネイル */}
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0 flex items-center justify-center">
                  {link.thumbnailUrl ? (
                    <img src={link.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <LinkTypeIcon type={link.type} className="w-6 h-6 opacity-50" />
                  )}
                </div>

                {/* 情報 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <LinkTypeIcon type={link.type} />
                    <span className="text-[10px] text-stone-400 font-medium">
                      {LINK_TYPES.find(t => t.value === link.type)?.label || link.type}
                    </span>
                    <span className="text-[10px] text-stone-300">·</span>
                    <span className="text-[10px] text-stone-400">商品ID: {link.productId}</span>
                  </div>
                  {link.title && (
                    <p className="text-sm font-bold text-stone-800 truncate">{link.title}</p>
                  )}
                  <p className="text-xs text-stone-500 truncate">{link.url}</p>
                  {link.authorName && (
                    <p className="text-[10px] text-stone-400">{link.authorName}</p>
                  )}
                </div>

                {/* アクション */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                  </a>
                  <button
                    onClick={() => {
                      if (confirm("このリンクを削除しますか？")) {
                        deleteLink.mutate({ id: link.id });
                      }
                    }}
                    disabled={deleteLink.isPending}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
