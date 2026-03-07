// ============================================================
// Omiyage Go - お土産コレクターページ（桃鉄風スタンプラリー）
// URL: /collector
// ============================================================
import { useState, useRef, useCallback } from "react";
import { AppLayout } from "@/components/omiyage/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import {
  Camera, Upload, CheckCircle2, MapPin, Trophy, Star,
  Loader2, X, ChevronRight, Package, Sparkles, AlertCircle,
  Map, Lock
} from "lucide-react";
import { toast } from "sonner";

// ── 47都道府県データ ──────────────────────────────────────────
const PREFECTURES: { name: string; region: string; col: number; row: number }[] = [
  // 北海道
  { name: "北海道", region: "北海道", col: 9, row: 1 },
  // 東北
  { name: "青森県", region: "東北", col: 9, row: 2 },
  { name: "岩手県", region: "東北", col: 9, row: 3 },
  { name: "秋田県", region: "東北", col: 8, row: 3 },
  { name: "宮城県", region: "東北", col: 9, row: 4 },
  { name: "山形県", region: "東北", col: 8, row: 4 },
  { name: "福島県", region: "東北", col: 8, row: 5 },
  // 関東
  { name: "茨城県", region: "関東", col: 9, row: 5 },
  { name: "栃木県", region: "関東", col: 8, row: 5 },
  { name: "群馬県", region: "関東", col: 7, row: 5 },
  { name: "埼玉県", region: "関東", col: 8, row: 6 },
  { name: "千葉県", region: "関東", col: 9, row: 6 },
  { name: "東京都", region: "関東", col: 8, row: 7 },
  { name: "神奈川県", region: "関東", col: 8, row: 8 },
  // 中部
  { name: "新潟県", region: "中部", col: 7, row: 4 },
  { name: "富山県", region: "中部", col: 6, row: 5 },
  { name: "石川県", region: "中部", col: 5, row: 5 },
  { name: "福井県", region: "中部", col: 5, row: 6 },
  { name: "山梨県", region: "中部", col: 7, row: 7 },
  { name: "長野県", region: "中部", col: 7, row: 6 },
  { name: "岐阜県", region: "中部", col: 6, row: 6 },
  { name: "静岡県", region: "中部", col: 7, row: 8 },
  { name: "愛知県", region: "中部", col: 6, row: 7 },
  // 近畿
  { name: "三重県", region: "近畿", col: 6, row: 8 },
  { name: "滋賀県", region: "近畿", col: 5, row: 7 },
  { name: "京都府", region: "近畿", col: 5, row: 8 },
  { name: "大阪府", region: "近畿", col: 5, row: 9 },
  { name: "兵庫県", region: "近畿", col: 4, row: 8 },
  { name: "奈良県", region: "近畿", col: 5, row: 9 },
  { name: "和歌山県", region: "近畿", col: 5, row: 10 },
  // 中国
  { name: "鳥取県", region: "中国", col: 4, row: 7 },
  { name: "島根県", region: "中国", col: 3, row: 7 },
  { name: "岡山県", region: "中国", col: 4, row: 8 },
  { name: "広島県", region: "中国", col: 3, row: 8 },
  { name: "山口県", region: "中国", col: 2, row: 8 },
  // 四国
  { name: "徳島県", region: "四国", col: 5, row: 10 },
  { name: "香川県", region: "四国", col: 4, row: 9 },
  { name: "愛媛県", region: "四国", col: 3, row: 9 },
  { name: "高知県", region: "四国", col: 4, row: 10 },
  // 九州・沖縄
  { name: "福岡県", region: "九州・沖縄", col: 2, row: 9 },
  { name: "佐賀県", region: "九州・沖縄", col: 1, row: 9 },
  { name: "長崎県", region: "九州・沖縄", col: 1, row: 10 },
  { name: "熊本県", region: "九州・沖縄", col: 2, row: 10 },
  { name: "大分県", region: "九州・沖縄", col: 3, row: 10 },
  { name: "宮崎県", region: "九州・沖縄", col: 3, row: 11 },
  { name: "鹿児島県", region: "九州・沖縄", col: 2, row: 11 },
  { name: "沖縄県", region: "九州・沖縄", col: 1, row: 13 },
];

const REGION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "北海道":   { bg: "bg-sky-500",    text: "text-white", border: "border-sky-600" },
  "東北":     { bg: "bg-indigo-500", text: "text-white", border: "border-indigo-600" },
  "関東":     { bg: "bg-rose-500",   text: "text-white", border: "border-rose-600" },
  "中部":     { bg: "bg-amber-500",  text: "text-white", border: "border-amber-600" },
  "近畿":     { bg: "bg-purple-500", text: "text-white", border: "border-purple-600" },
  "中国":     { bg: "bg-teal-500",   text: "text-white", border: "border-teal-600" },
  "四国":     { bg: "bg-orange-500", text: "text-white", border: "border-orange-600" },
  "九州・沖縄": { bg: "bg-emerald-500", text: "text-white", border: "border-emerald-600" },
};

const RANK_INFO = {
  traveler: { label: "旅人",     icon: "🎒", color: "text-stone-600",  bg: "bg-stone-100",  next: 10 },
  seasoned: { label: "旅慣れ",   icon: "🗺️", color: "text-blue-600",   bg: "bg-blue-100",   next: 20 },
  master:   { label: "旅人達人", icon: "🏆", color: "text-amber-600",  bg: "bg-amber-100",  next: 35 },
  legend:   { label: "全国制覇", icon: "👑", color: "text-purple-600", bg: "bg-purple-100", next: 47 },
};

// ── 写真アップロードモーダル ──────────────────────────────────
function PhotoUploadModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"upload" | "recognizing" | "confirm" | "done">("upload");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [matchedProduct, setMatchedProduct] = useState<any>(null);
  const [matchScore, setMatchScore] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recognizeMutation = trpc.collector.recognizePhoto.useMutation();
  const registerMutation = trpc.collector.register.useMutation();

  const handleFileSelect = useCallback(async (file: File) => {
    if (file.size > 16 * 1024 * 1024) {
      toast.error("ファイルサイズが16MBを超えています");
      return;
    }
    setPhotoFile(file);
    // プレビュー用のData URL
    const reader = new FileReader();
    reader.onload = (e) => setPhotoUrl(e.target?.result as string);
    reader.readAsDataURL(file);
    setStep("recognizing");

    // S3にアップロードしてからOCR
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload-collection-photo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
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
      if (result.bonuses.length > 0) {
        result.bonuses.forEach((b: string) => toast.success(b));
      }
      if (result.rankChanged) {
        const rankInfo = RANK_INFO[result.newRank as keyof typeof RANK_INFO];
        toast.success(`🎉 ランクアップ！${rankInfo?.icon} ${rankInfo?.label} に昇格！`);
      }
      toast.success(`+${result.pointsEarned}pt 獲得！`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      if (err.message?.includes("登録済み")) {
        toast.error("この商品は既にコレクション済みです");
      } else {
        toast.error("登録に失敗しました");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center sm:items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-stone-100">
          <h2 className="text-base font-black text-stone-900">
            {step === "upload" && "お土産写真を撮影"}
            {step === "recognizing" && "商品を認識中..."}
            {step === "confirm" && "認識結果を確認"}
            {step === "done" && "登録完了！"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-100">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <div className="p-5">
          {/* アップロードステップ */}
          {step === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-stone-600">
                買ったお土産の写真を撮影するか、ギャラリーから選んでください。AIが商品を自動認識します。
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute("capture");
                    fileInputRef.current.click();
                  }
                }}
                className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
              >
                <Camera className="w-5 h-5" />
                カメラで撮影 / ギャラリーから選ぶ
              </button>
              <div className="text-center text-xs text-stone-400">最大16MB・JPEG/PNG/HEIC対応</div>
            </div>
          )}

          {/* 認識中 */}
          {step === "recognizing" && (
            <div className="flex flex-col items-center py-8 gap-4">
              {photoUrl && (
                <img src={photoUrl} alt="撮影した写真" className="w-32 h-32 object-cover rounded-xl shadow" />
              )}
              <div className="flex items-center gap-2 text-emerald-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-bold">AIが商品を認識しています...</span>
              </div>
              <p className="text-xs text-stone-400 text-center">
                商品名・ブランド名・地域情報を読み取っています
              </p>
            </div>
          )}

          {/* 確認ステップ */}
          {step === "confirm" && (
            <div className="space-y-4">
              {photoUrl && (
                <img src={photoUrl} alt="撮影した写真" className="w-full h-40 object-cover rounded-xl shadow" />
              )}

              {matchedProduct ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    {matchedProduct.imageUrl ? (
                      <img src={matchedProduct.imageUrl} alt={matchedProduct.name}
                        className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 bg-stone-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-stone-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-bold text-emerald-700">
                          マッチ度 {Math.round(matchScore)}%
                        </span>
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
                    <p className="text-xs text-amber-600 mt-0.5">
                      認識テキスト: {ocrResult?.productName || "不明"}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 border border-stone-200 rounded-xl text-sm font-bold text-stone-600 hover:bg-stone-50"
                >
                  キャンセル
                </button>
                {matchedProduct && (
                  <button
                    onClick={handleRegister}
                    disabled={registerMutation.isPending}
                    className="flex-2 flex-grow py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    コレクションに登録
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 完了 */}
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
  const { user, isAuthenticated } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPref, setSelectedPref] = useState<string | null>(null);

  const statsQuery = trpc.collector.stats.useQuery(undefined, { enabled: isAuthenticated });
  const collectionQuery = trpc.collector.list.useQuery(
    { limit: 12, offset: 0 },
    { enabled: isAuthenticated }
  );
  const utils = trpc.useUtils();

  const stampedPrefs: string[] = statsQuery.data
    ? JSON.parse(statsQuery.data.stampedPrefectures || "[]")
    : [];
  const stampedRegions: string[] = statsQuery.data
    ? JSON.parse(statsQuery.data.stampedRegions || "[]")
    : [];

  const rank = (statsQuery.data?.collectorRank as keyof typeof RANK_INFO) ?? "traveler";
  const rankInfo = RANK_INFO[rank];
  const prefCount = statsQuery.data?.prefecturesCount ?? 0;
  const nextTarget = rankInfo.next;
  const progress = Math.min(100, (prefCount / nextTarget) * 100);

  const handleUploadSuccess = () => {
    utils.collector.stats.invalidate();
    utils.collector.list.invalidate();
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
          <a
            href={getLoginUrl()}
            className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
          >
            ログインして始める
          </a>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="pb-8">
        {/* ヘッダー */}
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 px-4 pt-5 pb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-black">お土産コレクター</h1>
              <p className="text-emerald-200 text-xs mt-0.5">47都道府県を制覇せよ！</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 bg-white text-emerald-700 px-3 py-2 rounded-xl text-sm font-black shadow hover:bg-emerald-50 transition-colors"
            >
              <Camera className="w-4 h-4" />
              登録
            </button>
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
            {/* プログレスバー */}
            <div className="bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-emerald-200 mt-1">
              <span>次のランクまで {nextTarget - prefCount}都道府県</span>
              <span>{prefCount}/{nextTarget}</span>
            </div>
          </div>
        </div>

        {/* エリア達成状況 */}
        <div className="px-4 mt-4">
          <h2 className="text-sm font-black text-stone-700 mb-2">エリア制覇状況</h2>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(REGION_COLORS).map(([region, colors]) => {
              const isCleared = stampedRegions.includes(region);
              const regionPrefs = PREFECTURES.filter(p => p.region === region);
              const clearedCount = regionPrefs.filter(p => stampedPrefs.includes(p.name)).length;
              return (
                <div
                  key={region}
                  className={cn(
                    "rounded-xl p-2 text-center border-2 transition-all",
                    isCleared
                      ? `${colors.bg} ${colors.text} ${colors.border}`
                      : "bg-stone-100 text-stone-400 border-stone-200"
                  )}
                >
                  <div className="text-xs font-black leading-tight">{region}</div>
                  <div className="text-[10px] mt-0.5 opacity-80">
                    {clearedCount}/{regionPrefs.length}
                  </div>
                  {isCleared && <div className="text-sm mt-0.5">⭐</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* 47都道府県スタンプマップ */}
        <div className="px-4 mt-5">
          <h2 className="text-sm font-black text-stone-700 mb-3">スタンプマップ</h2>
          {/* グリッドマップ */}
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
                    style={{
                      gridColumn: pref.col,
                      gridRow: pref.row,
                    }}
                    className={cn(
                      "rounded-md text-[8px] font-black flex items-center justify-center transition-all border",
                      isStamped
                        ? `${colors.bg} ${colors.text} ${colors.border} shadow-sm scale-100`
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

          {/* 選択中の都道府県情報 */}
          {selectedPref && (
            <div className="mt-2 bg-white border border-stone-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-stone-900 text-sm">{selectedPref}</span>
                {stampedPrefs.includes(selectedPref) ? (
                  <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    ✓ 制覇済み
                  </span>
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

        {/* コレクション一覧 */}
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-stone-700">
              コレクション ({statsQuery.data?.totalCollected ?? 0}件)
            </h2>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1 text-xs font-bold text-emerald-700"
            >
              <Camera className="w-3.5 h-3.5" />
              追加
            </button>
          </div>

          {collectionQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
            </div>
          ) : collectionQuery.data?.items.length === 0 ? (
            <div className="text-center py-10 bg-stone-50 rounded-2xl">
              <div className="text-4xl mb-3">🎁</div>
              <p className="font-bold text-stone-700 text-sm">まだコレクションがありません</p>
              <p className="text-xs text-stone-400 mt-1">お土産の写真を撮って登録しよう！</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
              >
                最初の1個を登録する
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {collectionQuery.data?.items.map((item) => (
                <div key={item.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                  {item.photoUrl ? (
                    <img src={item.photoUrl} alt={item.product?.name}
                      className="w-full h-20 object-cover" />
                  ) : item.product?.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name}
                      className="w-full h-20 object-cover" />
                  ) : (
                    <div className="w-full h-20 bg-stone-100 flex items-center justify-center">
                      <Package className="w-6 h-6 text-stone-300" />
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-[10px] font-black text-stone-800 leading-tight line-clamp-2">
                      {item.product?.name ?? "不明な商品"}
                    </p>
                    <div className="flex items-center gap-0.5 mt-1">
                      <MapPin className="w-2.5 h-2.5 text-stone-400" />
                      <span className="text-[9px] text-stone-400">{item.prefecture}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 登録ボタン（フローティング） */}
        <div className="fixed bottom-20 right-4 z-40">
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-700 transition-colors active:scale-95"
          >
            <Camera className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 写真アップロードモーダル */}
      {showUploadModal && (
        <PhotoUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </AppLayout>
  );
}
