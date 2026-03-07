// ============================================================
// Omiyage Go - 会員登録ページ（3ステップオンボーディング）
// ============================================================
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2, Camera, User, MapPin, FileText,
  CheckCircle2, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

const STEPS = [
  { id: 1, label: "ニックネーム", icon: User },
  { id: 2, label: "お住まい", icon: MapPin },
  { id: 3, label: "自己紹介", icon: FileText },
];

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [homePrefecture, setHomePrefecture] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("プロフィールを登録しました！");
      navigate("/");
    },
    onError: (err) => {
      toast.error(err.message || "エラーが発生しました");
    },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/upload-collection-photo", {
        method: "POST", body: formData, credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.url || "");
      }
    } catch {
      toast.error("画像のアップロードに失敗しました");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = () => {
    if (!nickname.trim()) {
      toast.error("ニックネームを入力してください");
      return;
    }
    updateProfile.mutate({
      nickname: nickname.trim(),
      bio: bio.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
      homePrefecture: homePrefecture || undefined,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-stone-600 mb-4">会員登録にはログインが必要です</p>
          <Button onClick={() => navigate("/")} className="bg-emerald-600 hover:bg-emerald-700">
            ホームに戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-stone-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-stone-100 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-black">O</span>
          </div>
          <div>
            <h1 className="text-base font-black text-stone-900">会員登録</h1>
            <p className="text-xs text-stone-500">プロフィールを設定してはじめよう</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* ステッパー */}
        <div className="flex items-start justify-between mb-8">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  step > s.id
                    ? "bg-emerald-600 text-white"
                    : step === s.id
                    ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                    : "bg-stone-200 text-stone-400"
                )}>
                  {step > s.id
                    ? <CheckCircle2 className="w-5 h-5" />
                    : <s.icon className="w-5 h-5" />
                  }
                </div>
                <span className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  step >= s.id ? "text-emerald-700" : "text-stone-400"
                )}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2 mb-5",
                  step > s.id ? "bg-emerald-400" : "bg-stone-200"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* ステップ1: ニックネーム＋アバター */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-black text-stone-900">あなたのニックネームは？</h2>
              <p className="text-sm text-stone-500 mt-1">お土産仲間に表示される名前です</p>
            </div>

            {/* アバター */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-24 h-24 rounded-full overflow-hidden bg-stone-100 border-2 border-dashed border-stone-300 hover:border-emerald-400 transition-colors group"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="アバター" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-1">
                    <Camera className="w-6 h-6 text-stone-400 group-hover:text-emerald-500" />
                    <span className="text-xs text-stone-400">写真を追加</span>
                  </div>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <p className="text-xs text-stone-400">任意・後から変更できます</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-sm font-bold text-stone-700">
                ニックネーム <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="例：東京土産マスター"
                maxLength={64}
                className="text-base"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && nickname.trim()) setStep(2);
                }}
              />
              <p className="text-xs text-stone-400 text-right">{nickname.length}/64</p>
            </div>

            <Button
              onClick={() => {
                if (!nickname.trim()) {
                  toast.error("ニックネームを入力してください");
                  return;
                }
                setStep(2);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl"
            >
              次へ <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* ステップ2: お住まい */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-black text-stone-900">お住まいの都道府県は？</h2>
              <p className="text-sm text-stone-500 mt-1">地元のお土産情報を優先表示します</p>
            </div>

            <div className="grid grid-cols-4 gap-1.5 max-h-72 overflow-y-auto pr-1">
              {PREFECTURES.map((pref) => (
                <button
                  key={pref}
                  type="button"
                  onClick={() => setHomePrefecture(pref === homePrefecture ? "" : pref)}
                  className={cn(
                    "py-2 px-1 rounded-lg text-xs font-medium transition-all",
                    homePrefecture === pref
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-emerald-50 hover:text-emerald-700"
                  )}
                >
                  {pref.replace("都", "").replace("道", "").replace("府", "").replace("県", "")}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 border-stone-200 text-stone-600"
              >
                戻る
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
              >
                {homePrefecture ? `${homePrefecture.replace("都","").replace("道","").replace("府","").replace("県","")}で次へ` : "スキップ"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ステップ3: 自己紹介 */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-black text-stone-900">自己紹介を書いてみよう</h2>
              <p className="text-sm text-stone-500 mt-1">好きなお土産や旅行先など、自由に書いてください</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-bold text-stone-700">
                自己紹介 <span className="text-stone-400 font-normal">（任意）</span>
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="例：全国のお土産を制覇中！特に和菓子が大好きです。"
                maxLength={200}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-stone-400 text-right">{bio.length}/200</p>
            </div>

            {/* 確認サマリー */}
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-xs font-bold text-emerald-700 mb-2">登録内容の確認</p>
              <div className="flex items-center gap-3">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="アバター" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-stone-900">{nickname}</p>
                  {homePrefecture && (
                    <p className="text-xs text-stone-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {homePrefecture}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 border-stone-200 text-stone-600"
              >
                戻る
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={updateProfile.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
              >
                {updateProfile.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />登録中...</>
                ) : (
                  <>登録する <CheckCircle2 className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        )}

        <p className="text-center mt-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-xs text-stone-400 hover:text-stone-600 underline"
          >
            後で設定する
          </button>
        </p>
      </div>
    </div>
  );
}
