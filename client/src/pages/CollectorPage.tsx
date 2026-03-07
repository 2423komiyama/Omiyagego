// ============================================================
// Omiyage Go - お土産コレクターページ（桃鉄風スタンプラリー）
// 機能: 写真OCR登録・47都道府県マップ・コレクション一覧・SNSシェア・エリアバッジ
// ============================================================
import { useState, useRef, useCallback, useEffect } from "react";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import {
  Camera, CheckCircle2, MapPin, Trophy, Star,
  Loader2, X, Package, Sparkles, AlertCircle,
  Map, Share2, Copy, Users, ChevronRight, Award
} from "lucide-react";
import { toast } from "sonner";

// ── 47都道府県データ ──────────────────────────────────────────
const PREFECTURES: { name: string; region: string; col: number; row: number }[] = [
  { name: "北海道", region: "北海道", col: 9, row: 1 },
  { name: "青森県", region: "東北", col: 9, row: 2 },
  { name: "岩手県", region: "東北", col: 9, row: 3 },
  { name: "秋田県", region: "東北", col: 8, row: 3 },
  { name: "宮城県", region: "東北", col: 9, row: 4 },
  { name: "山形県", region: "東北", col: 8, row: 4 },
  { name: "福島県", region: "東北", col: 8, row: 5 },
  { name: "茨城県", region: "関東", col: 9, row: 5 },
  { name: "栃木県", region: "関東", col: 8, row: 5 },
  { name: "群馬県", region: "関東", col: 7, row: 5 },
  { name: "埼玉県", region: "関東", col: 8, row: 6 },
  { name: "千葉県", region: "関東", col: 9, row: 6 },
  { name: "東京都", region: "関東", col: 8, row: 7 },
  { name: "神奈川県", region: "関東", col: 8, row: 8 },
  { name: "新潟県", region: "中部", col: 7, row: 4 },
  { name: "富山県", region: "中部", col: 6, row: 5 },
  { name: "石川県", region: "中部", col: 5, row: 5 },
  { name: "福井県", region: "中部", col: 5, row: 6 },
  { name: "山梨県", region: "中部", col: 7, row: 7 },
  { name: "長野県", region: "中部", col: 7, row: 6 },
  { name: "岐阜県", region: "中部", col: 6, row: 6 },
  { name: "静岡県", region: "中部", col: 7, row: 8 },
  { name: "愛知県", region: "中部", col: 6, row: 7 },
  { name: "三重県", region: "近畿", col: 6, row: 8 },
  { name: "滋賀県", region: "近畿", col: 5, row: 7 },
  { name: "京都府", region: "近畿", col: 5, row: 8 },
  { name: "大阪府", region: "近畿", col: 5, row: 9 },
  { name: "兵庫県", region: "近畿", col: 4, row: 8 },
  { name: "奈良県", region: "近畿", col: 5, row: 9 },
  { name: "和歌山県", region: "近畿", col: 5, row: 10 },
  { name: "鳥取県", region: "中国", col: 4, row: 7 },
  { name: "島根県", region: "中国", col: 3, row: 7 },
  { name: "岡山県", region: "中国", col: 4, row: 8 },
  { name: "広島県", region: "中国", col: 3, row: 8 },
  { name: "山口県", region: "中国", col: 2, row: 8 },
  { name: "徳島県", region: "四国", col: 5, row: 10 },
  { name: "香川県", region: "四国", col: 4, row: 9 },
  { name: "愛媛県", region: "四国", col: 3, row: 9 },
  { name: "高知県", region: "四国", col: 4, row: 10 },
  { name: "福岡県", region: "九州・沖縄", col: 2, row: 9 },
  { name: "佐賀県", region: "九州・沖縄", col: 1, row: 9 },
  { name: "長崎県", region: "九州・沖縄", col: 1, row: 10 },
  { name: "熊本県", region: "九州・沖縄", col: 2, row: 10 },
  { name: "大分県", region: "九州・沖縄", col: 3, row: 10 },
  { name: "宮崎県", region: "九州・沖縄", col: 3, row: 11 },
  { name: "鹿児島県", region: "九州・沖縄", col: 2, row: 11 },
  { name: "沖縄県", region: "九州・沖縄", col: 1, row: 13 },
];

const REGION_COLORS: Record<string, { bg: string; text: string; border: string; hex: string; emoji: string }> = {
  "北海道":    { bg: "bg-sky-500",     text: "text-white", border: "border-sky-600",     hex: "#0ea5e9", emoji: "🏔️" },
  "東北":      { bg: "bg-indigo-500",  text: "text-white", border: "border-indigo-600",  hex: "#6366f1", emoji: "⛩️" },
  "関東":      { bg: "bg-rose-500",    text: "text-white", border: "border-rose-600",    hex: "#f43f5e", emoji: "🗼" },
  "中部":      { bg: "bg-amber-500",   text: "text-white", border: "border-amber-600",   hex: "#f59e0b", emoji: "🗻" },
  "近畿":      { bg: "bg-purple-500",  text: "text-white", border: "border-purple-600",  hex: "#a855f7", emoji: "🦌" },
  "中国":      { bg: "bg-teal-500",    text: "text-white", border: "border-teal-600",    hex: "#14b8a6", emoji: "⛩️" },
  "四国":      { bg: "bg-orange-500",  text: "text-white", border: "border-orange-600",  hex: "#f97316", emoji: "🍊" },
  "九州・沖縄": { bg: "bg-emerald-500", text: "text-white", border: "border-emerald-600", hex: "#10b981", emoji: "🌺" },
};

const RANK_INFO = {
  traveler: { label: "旅人",     icon: "🎒", color: "text-stone-600",  bg: "bg-stone-100",  next: 10, desc: "10都道府県でランクアップ" },
  seasoned: { label: "旅慣れ",   icon: "🗺️", color: "text-blue-600",   bg: "bg-blue-100",   next: 20, desc: "20都道府県でランクアップ" },
  master:   { label: "旅人達人", icon: "🏆", color: "text-amber-600",  bg: "bg-amber-100",  next: 35, desc: "35都道府県でランクアップ" },
  legend:   { label: "全国制覇", icon: "👑", color: "text-purple-600", bg: "bg-purple-100", next: 47, desc: "47都道府県制覇！" },
};

// ── エリアバッジSVGコンポーネント ─────────────────────────────
function AreaBadge({ region, cleared, count, total }: {
  region: string;
  cleared: boolean;
  count: number;
  total: number;
}) {
  const info = REGION_COLORS[region];
  const pct = Math.round((count / total) * 100);
  return (
    <div className={cn(
      "relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-300",
      cleared
        ? `${info.bg} ${info.text} ${info.border} shadow-lg scale-105`
        : "bg-stone-100 text-stone-400 border-stone-200"
    )}>
      {/* バッジ本体 */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-xl mb-1 border-2",
        cleared ? "bg-white/20 border-white/40" : "bg-stone-200 border-stone-300"
      )}>
        {cleared ? info.emoji : "🔒"}
      </div>
      <div className="text-[10px] font-black leading-tight text-center">{region}</div>
      {/* 進捗バー */}
      <div className={cn("w-full h-1 rounded-full mt-1.5", cleared ? "bg-white/30" : "bg-stone-300")}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", cleared ? "bg-white" : "bg-stone-400")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[9px] mt-0.5 opacity-80">{count}/{total}</div>
      {cleared && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] border-2 border-white shadow">
          ⭐
        </div>
      )}
    </div>
  );
}

// ── SNSシェアモーダル ─────────────────────────────────────────
function ShareModal({ stats, stampedPrefs, onClose }: {
  stats: any;
  stampedPrefs: string[];
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const rank = (stats?.collectorRank as keyof typeof RANK_INFO) ?? "traveler";
  const rankInfo = RANK_INFO[rank];
  const prefCount = stats?.prefecturesCount ?? 0;

  // Canvas でシェア画像を生成
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 400;

    // 背景グラデーション
    const grad = ctx.createLinearGradient(0, 0, 600, 400);
    grad.addColorStop(0, "#064e3b");
    grad.addColorStop(1, "#065f46");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 400);

    // タイトル
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(0, 0, 600, 80);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🎁 Omiyage Go コレクター", 300, 48);

    // ランクバッジ
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.roundRect(40, 100, 240, 120, 16);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(rankInfo.icon, 160, 165);
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(rankInfo.label, 160, 200);

    // 都道府県数
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.roundRect(320, 100, 240, 120, 16);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 56px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${prefCount}`, 440, 168);
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText("/ 47都道府県制覇", 440, 200);

    // エリア制覇状況
    const regions = Object.keys(REGION_COLORS);
    const regionPrefs = regions.map(r => ({
      region: r,
      cleared: PREFECTURES.filter(p => p.region === r).every(p => stampedPrefs.includes(p.name)),
    }));
    const clearedRegions = regionPrefs.filter(r => r.cleared);

    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.roundRect(40, 240, 520, 60, 12);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("制覇エリア:", 60, 268);
    if (clearedRegions.length === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText("まだ制覇エリアなし", 160, 268);
    } else {
      let x = 160;
      for (const r of clearedRegions) {
        const info = REGION_COLORS[r.region];
        ctx.fillStyle = info.hex;
        ctx.roundRect(x, 253, 60, 22, 6);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(r.region, x + 30, 268);
        x += 68;
        if (x > 520) break;
      }
    }

    // フッター
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("omiyage-go.manus.space で一緒にお土産を集めよう！", 300, 370);

    setImageUrl(canvas.toDataURL("image/png"));
  }, [prefCount, rankInfo, stampedPrefs]);

  const shareText = `お土産コレクター ${rankInfo.icon} ${rankInfo.label}\n${prefCount}/47都道府県制覇中！\n#OmiyageGo #お土産 #旅行`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.origin + "/collector").then(() => {
      toast.success("URLをコピーしました");
    });
  };

  const handleShareX = () => {
    const url = encodeURIComponent(window.location.origin + "/collector");
    const text = encodeURIComponent(shareText);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const handleShareLine = () => {
    const text = encodeURIComponent(shareText + "\n" + window.location.origin + "/collector");
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.origin + "/collector")}&text=${text}`, "_blank");
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "omiyage-collector.png";
    a.click();
    toast.success("画像を保存しました");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center sm:items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-stone-100">
          <h2 className="text-base font-black text-stone-900">スタンプラリーをシェア</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-100">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Canvas（非表示） */}
          <canvas ref={canvasRef} className="hidden" />

          {/* プレビュー画像 */}
          {imageUrl && (
            <div className="rounded-xl overflow-hidden border border-stone-200 shadow-sm">
              <img src={imageUrl} alt="シェア画像" className="w-full" />
            </div>
          )}

          {/* シェアボタン群 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleShareX}
              className="flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-colors"
            >
              <span className="font-black text-base">𝕏</span>
              Xでシェア
            </button>
            <button
              onClick={handleShareLine}
              className="flex items-center justify-center gap-2 py-3 bg-[#06C755] text-white rounded-xl font-bold text-sm hover:bg-[#05b04c] transition-colors"
            >
              <span className="text-base">💬</span>
              LINEで送る
            </button>
            <button
              onClick={handleCopyUrl}
              className="flex items-center justify-center gap-2 py-3 border border-stone-200 rounded-xl font-bold text-sm text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <Copy className="w-4 h-4" />
              URLコピー
            </button>
            <button
              onClick={handleDownload}
              disabled={!imageUrl}
              className="flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              画像を保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 写真アップロードモーダル ──────────────────────────────────
function PhotoUploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<"upload" | "recognizing" | "confirm" | "done">("upload");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [matchedProduct, setMatchedProduct] = useState<any>(null);
  const [matchScore, setMatchScore] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recognizeMutation = trpc.collector.recognizePhoto.useMutation();
  const registerMutation = trpc.collector.register.useMutation();

  const handleFileSelect = useCallback(async (file: File) => {
    if (file.size > 16 * 1024 * 1024) { toast.error("ファイルサイズが16MBを超えています"); return; }
    const reader = new FileReader();
    reader.onload = (e) => setPhotoUrl(e.target?.result as string);
    reader.readAsDataURL(file);
    setStep("recognizing");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload-collection-photo", { method: "POST", body: formData, credentials: "include" });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url: uploadedUrl } = await uploadRes.json();
      const result = await recognizeMutation.mutateAsync({ photoUrl: uploadedUrl });
      setOcrResult(result.ocrResult);
      setMatchedProduct(result.matchedProduct);
      setMatchScore(result.matchScore);
      setPhotoUrl(uploadedUrl);
      setStep("confirm");
    } catch (err: any) {
      toast.error("画像認識に失敗しました: " + (err.message || "不明なエラー"));
      setStep("upload");
    }
  }, [recognizeMutation]);

  const handleRegister = async () => {
    if (!matchedProduct) return;
    try {
      const result = await registerMutation.mutateAsync({
        productId: matchedProduct.id,
        photoUrl: photoUrl ?? undefined,
        ocrText: ocrResult?.extractedText,
        matchScore,
      });
      setStep("done");
      if (result.bonuses.length > 0) result.bonuses.forEach((b: string) => toast.success(b));
      if (result.rankChanged) {
        const rankInfo = RANK_INFO[result.newRank as keyof typeof RANK_INFO];
        toast.success(`🎉 ランクアップ！${rankInfo?.icon} ${rankInfo?.label} に昇格！`);
      }
      toast.success(`+${result.pointsEarned}pt 獲得！`);
      setTimeout(() => { onSuccess(); onClose(); }, 2000);
    } catch (err: any) {
      if (err.message?.includes("登録済み")) toast.error("この商品は既にコレクション済みです");
      else toast.error("登録に失敗しました");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center sm:items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-stone-100">
          <h2 className="text-base font-black text-stone-900">
            {step === "upload" && "お土産写真を撮影"}
            {step === "recognizing" && "商品を認識中..."}
            {step === "confirm" && "認識結果を確認"}
            {step === "done" && "登録完了！"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-100"><X className="w-5 h-5 text-stone-500" /></button>
        </div>
        <div className="p-5">
          {step === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-stone-600">買ったお土産の写真を撮影するか、ギャラリーから選んでください。AIが商品を自動認識します。</p>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                <Camera className="w-5 h-5" />
                カメラで撮影 / ギャラリーから選ぶ
              </button>
              <div className="text-center text-xs text-stone-400">最大16MB・JPEG/PNG/HEIC対応</div>
            </div>
          )}
          {step === "recognizing" && (
            <div className="flex flex-col items-center py-8 gap-4">
              {photoUrl && <img src={photoUrl} alt="撮影した写真" className="w-32 h-32 object-cover rounded-xl shadow" />}
              <div className="flex items-center gap-2 text-emerald-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-bold">AIが商品を認識しています...</span>
              </div>
            </div>
          )}
          {step === "confirm" && (
            <div className="space-y-4">
              {photoUrl && <img src={photoUrl} alt="撮影した写真" className="w-full h-40 object-cover rounded-xl shadow" />}
              {matchedProduct ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    {matchedProduct.imageUrl ? (
                      <img src={matchedProduct.imageUrl} alt={matchedProduct.name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 bg-stone-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-stone-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-bold text-emerald-700">マッチ度 {Math.round(matchScore)}%</span>
                      </div>
                      <p className="font-black text-stone-900 text-sm leading-tight">{matchedProduct.name}</p>
                      <p className="text-xs text-stone-500">{matchedProduct.brand}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span className="text-xs text-stone-500">{matchedProduct.prefecture}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">商品を特定できませんでした</p>
                    <p className="text-xs text-amber-600 mt-0.5">認識テキスト: {ocrResult?.productName || "不明"}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-3 border border-stone-200 rounded-xl text-sm font-bold text-stone-600 hover:bg-stone-50">キャンセル</button>
                {matchedProduct && (
                  <button onClick={handleRegister} disabled={registerMutation.isPending}
                    className="flex-2 flex-grow py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    コレクションに登録
                  </button>
                )}
              </div>
            </div>
          )}
          {step === "done" && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="font-black text-stone-900 text-lg">登録完了！</p>
              <p className="text-sm text-stone-500">スタンプマップを更新しています...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── メインページ ──────────────────────────────────────────────
export default function CollectorPage() {
  const { isAuthenticated } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "list" | "ranking">("map");
  const [listView, setListView] = useState<"all" | "pref">("all");
  const [selectedPref, setSelectedPref] = useState<string | null>(null);

  const statsQuery = trpc.collector.stats.useQuery(undefined, { enabled: isAuthenticated });
  const collectionQuery = trpc.collector.list.useQuery({ limit: 50, offset: 0 }, { enabled: isAuthenticated && listView === "all" });
  const prefCollectionQuery = trpc.collector.listByPrefecture.useQuery(undefined, { enabled: isAuthenticated && listView === "pref" });
  const rankingQuery = trpc.collector.popularRanking.useQuery({ limit: 10 }, { enabled: isAuthenticated && activeTab === "ranking" });
  const utils = trpc.useUtils();

  const stampedPrefs: string[] = statsQuery.data ? JSON.parse(statsQuery.data.stampedPrefectures || "[]") : [];
  const stampedRegions: string[] = statsQuery.data ? JSON.parse(statsQuery.data.stampedRegions || "[]") : [];
  const rank = (statsQuery.data?.collectorRank as keyof typeof RANK_INFO) ?? "traveler";
  const rankInfo = RANK_INFO[rank];
  const prefCount = statsQuery.data?.prefecturesCount ?? 0;
  const nextTarget = rankInfo.next;
  const progress = Math.min(100, (prefCount / nextTarget) * 100);

  const handleUploadSuccess = () => {
    utils.collector.stats.invalidate();
    utils.collector.list.invalidate();
    utils.collector.listByPrefecture.invalidate();
  };

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            <Map className="w-10 h-10 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-stone-900 mb-2">お土産コレクター</h1>
            <p className="text-sm text-stone-500 leading-relaxed">
              買ったお土産を写真で登録して、47都道府県を制覇しよう！<br />
              ログインしてスタンプラリーを始めましょう。
            </p>
          </div>
          <a href={getLoginUrl()} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">
            ログインして始める
          </a>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="pb-24">
        {/* ── ヘッダー ── */}
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 px-4 pt-5 pb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-black">お土産コレクター</h1>
              <p className="text-emerald-200 text-xs mt-0.5">47都道府県を制覇せよ！</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 bg-white/20 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-white/30 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                シェア
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-1.5 bg-white text-emerald-700 px-3 py-2 rounded-xl text-sm font-black shadow hover:bg-emerald-50 transition-colors"
              >
                <Camera className="w-4 h-4" />
                登録
              </button>
            </div>
          </div>

          {/* ランクカード */}
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{rankInfo.icon}</span>
              <div>
                <div className="text-xs text-emerald-200 font-bold">現在のランク</div>
                <div className="text-xl font-black">{rankInfo.label}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-black">{prefCount}</div>
                <div className="text-xs text-emerald-200">/ 47都道府県</div>
              </div>
            </div>
            <div className="bg-white/20 rounded-full h-2 overflow-hidden">
              <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-emerald-200 mt-1">
              <span>{rankInfo.desc}</span>
              <span>{prefCount}/{nextTarget}</span>
            </div>
          </div>
        </div>

        {/* ── タブ ── */}
        <div className="flex border-b border-stone-200 bg-white sticky top-0 z-10">
          {[
            { id: "map", label: "マップ", icon: <Map className="w-4 h-4" /> },
            { id: "list", label: "コレクション", icon: <Package className="w-4 h-4" /> },
            { id: "ranking", label: "みんなのランキング", icon: <Trophy className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-stone-500 hover:text-stone-700"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── マップタブ ── */}
        {activeTab === "map" && (
          <div className="px-4 pt-4 space-y-5">
            {/* エリアバッジ */}
            <div>
              <h2 className="text-sm font-black text-stone-700 mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                エリア制覇バッジ
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(REGION_COLORS).map(([region, _]) => {
                  const regionPrefs = PREFECTURES.filter(p => p.region === region);
                  const clearedCount = regionPrefs.filter(p => stampedPrefs.includes(p.name)).length;
                  const isCleared = stampedRegions.includes(region);
                  return (
                    <AreaBadge
                      key={region}
                      region={region}
                      cleared={isCleared}
                      count={clearedCount}
                      total={regionPrefs.length}
                    />
                  );
                })}
              </div>
            </div>

            {/* 47都道府県スタンプマップ */}
            <div>
              <h2 className="text-sm font-black text-stone-700 mb-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                スタンプマップ
              </h2>
              <div className="bg-stone-50 rounded-2xl p-3 overflow-x-auto">
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: "repeat(10, minmax(28px, 1fr))",
                    gridTemplateRows: "repeat(13, 28px)",
                    minWidth: "300px",
                  }}
                >
                  {PREFECTURES.map((pref) => {
                    const isStamped = stampedPrefs.includes(pref.name);
                    const colors = REGION_COLORS[pref.region];
                    const isSelected = selectedPref === pref.name;
                    return (
                      <button
                        key={pref.name}
                        onClick={() => setSelectedPref(isSelected ? null : pref.name)}
                        title={pref.name}
                        style={{ gridColumn: pref.col, gridRow: pref.row }}
                        className={cn(
                          "rounded-md text-[8px] font-black flex items-center justify-center transition-all border",
                          isStamped
                            ? `${colors.bg} ${colors.text} ${colors.border} shadow-sm`
                            : "bg-stone-200 text-stone-400 border-stone-300",
                          isSelected && "ring-2 ring-offset-1 ring-emerald-500 scale-110 z-10"
                        )}
                      >
                        {isStamped ? "✓" : pref.name.replace("県", "").replace("府", "").replace("都", "").replace("道", "").slice(0, 2)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedPref && (
                <div className="mt-2 bg-white border border-stone-200 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-stone-900 text-sm">{selectedPref}</span>
                    {stampedPrefs.includes(selectedPref) ? (
                      <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ 制覇済み</span>
                    ) : (
                      <span className="ml-auto text-xs text-stone-400">未制覇</span>
                    )}
                  </div>
                </div>
              )}

              {/* 凡例 */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(REGION_COLORS).map(([region, colors]) => (
                  <div key={region} className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold", colors.bg, colors.text)}>
                    {region}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── コレクションタブ ── */}
        {activeTab === "list" && (
          <div className="px-4 pt-4">
            {/* 表示切替 */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setListView("all")}
                className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-colors",
                  listView === "all" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-stone-600 border-stone-200")}
              >
                日付順
              </button>
              <button
                onClick={() => setListView("pref")}
                className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-colors",
                  listView === "pref" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-stone-600 border-stone-200")}
              >
                都道府県別
              </button>
            </div>

            {/* 全件表示（日付順） */}
            {listView === "all" && (
              <>
                {collectionQuery.isLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /></div>
                ) : collectionQuery.data?.items.length === 0 ? (
                  <div className="text-center py-10 bg-stone-50 rounded-2xl">
                    <div className="text-4xl mb-3">🎁</div>
                    <p className="font-bold text-stone-700 text-sm">まだコレクションがありません</p>
                    <button onClick={() => setShowUploadModal(true)}
                      className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors">
                      最初の1個を登録する
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {collectionQuery.data?.items.map((item) => (
                      <div key={item.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                        {item.photoUrl ? (
                          <img src={item.photoUrl} alt={item.product?.name} className="w-full h-20 object-cover" />
                        ) : item.product?.imageUrl ? (
                          <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-20 object-cover" />
                        ) : (
                          <div className="w-full h-20 bg-stone-100 flex items-center justify-center">
                            <Package className="w-6 h-6 text-stone-300" />
                          </div>
                        )}
                        <div className="p-2">
                          <p className="text-[10px] font-black text-stone-800 leading-tight line-clamp-2">{item.product?.name ?? "不明な商品"}</p>
                          <div className="flex items-center gap-0.5 mt-1">
                            <MapPin className="w-2.5 h-2.5 text-stone-400" />
                            <span className="text-[9px] text-stone-400">{item.prefecture}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* 都道府県別表示 */}
            {listView === "pref" && (
              <>
                {prefCollectionQuery.isLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /></div>
                ) : !prefCollectionQuery.data || Object.keys(prefCollectionQuery.data).length === 0 ? (
                  <div className="text-center py-10 bg-stone-50 rounded-2xl">
                    <div className="text-4xl mb-3">🗾</div>
                    <p className="font-bold text-stone-700 text-sm">まだコレクションがありません</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(prefCollectionQuery.data).sort(([a], [b]) => a.localeCompare(b, "ja")).map(([pref, items]) => {
                      const prefInfo = PREFECTURES.find(p => p.name === pref);
                      const regionColors = prefInfo ? REGION_COLORS[prefInfo.region] : null;
                      return (
                        <div key={pref}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn("w-2 h-2 rounded-full", regionColors?.bg ?? "bg-stone-400")} />
                            <h3 className="text-sm font-black text-stone-800">{pref}</h3>
                            <span className="text-xs text-stone-400">{items.length}件</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {items.map((item) => (
                              <div key={item.id} className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
                                {item.photoUrl ? (
                                  <img src={item.photoUrl} alt={item.product?.name} className="w-full h-14 object-cover" />
                                ) : item.product?.imageUrl ? (
                                  <img src={item.product.imageUrl} alt={item.product?.name} className="w-full h-14 object-cover" />
                                ) : (
                                  <div className="w-full h-14 bg-stone-100 flex items-center justify-center">
                                    <Package className="w-4 h-4 text-stone-300" />
                                  </div>
                                )}
                                <div className="p-1">
                                  <p className="text-[9px] font-bold text-stone-700 leading-tight line-clamp-2">{item.product?.name ?? "不明"}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── みんなのランキングタブ ── */}
        {activeTab === "ranking" && (
          <div className="px-4 pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-black text-stone-700">みんなが買ったお土産 TOP10</h2>
            </div>
            {rankingQuery.isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /></div>
            ) : !rankingQuery.data || rankingQuery.data.length === 0 ? (
              <div className="text-center py-10 bg-stone-50 rounded-2xl">
                <div className="text-4xl mb-3">🏆</div>
                <p className="font-bold text-stone-700 text-sm">まだランキングデータがありません</p>
                <p className="text-xs text-stone-400 mt-1">お土産を登録するとランキングに反映されます</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rankingQuery.data.map((item, idx) => (
                  <div key={item.productId} className="bg-white border border-stone-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                    {/* 順位バッジ */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0",
                      idx === 0 ? "bg-yellow-400 text-white" :
                      idx === 1 ? "bg-stone-300 text-white" :
                      idx === 2 ? "bg-amber-600 text-white" :
                      "bg-stone-100 text-stone-500"
                    )}>
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                    </div>
                    {/* 商品画像 */}
                    {item.product?.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-stone-300" />
                      </div>
                    )}
                    {/* 商品情報 */}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-stone-900 text-sm leading-tight line-clamp-1">{item.product?.name ?? "不明な商品"}</p>
                      <p className="text-xs text-stone-500">{item.product?.brand}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span className="text-xs text-stone-400">{item.product?.prefecture}</span>
                      </div>
                    </div>
                    {/* コレクター数 */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="flex items-center gap-0.5 text-emerald-600">
                        <Users className="w-3.5 h-3.5" />
                        <span className="font-black text-sm">{item.collectorCount}</span>
                      </div>
                      <span className="text-[9px] text-stone-400">人が購入</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 統計サマリー */}
            <div className="mt-6 bg-stone-50 rounded-2xl p-4">
              <h3 className="text-xs font-black text-stone-600 mb-3">あなたのコレクション統計</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-xl font-black text-emerald-700">{statsQuery.data?.totalCollected ?? 0}</div>
                  <div className="text-[10px] text-stone-500">登録数</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-emerald-700">{prefCount}</div>
                  <div className="text-[10px] text-stone-500">都道府県</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-emerald-700">{statsQuery.data?.regionsCount ?? 0}</div>
                  <div className="text-[10px] text-stone-500">エリア制覇</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* フローティング登録ボタン */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setShowUploadModal(true)}
          className="w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-700 transition-colors active:scale-95"
        >
          <Camera className="w-6 h-6" />
        </button>
      </div>

      {showUploadModal && (
        <PhotoUploadModal onClose={() => setShowUploadModal(false)} onSuccess={handleUploadSuccess} />
      )}
      {showShareModal && statsQuery.data && (
        <ShareModal stats={statsQuery.data} stampedPrefs={stampedPrefs} onClose={() => setShowShareModal(false)} />
      )}
    </AppLayout>
  );
}
