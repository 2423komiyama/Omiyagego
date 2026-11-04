// ============================================================
// Omiyage Go - SNSシェアカード モーダル
// 商品情報からInstagramストーリーズ用(9:16)カード画像をクライアント側
// (Canvas API)で生成し、navigator.share(files)またはダウンロードで共有する。
// ============================================================
import { useEffect, useState } from "react";
import { X, Download, Share2, Loader2, AlertTriangle, Link2, Check } from "lucide-react";
import { generateShareCard, type ShareCardInput } from "@/lib/generateShareCard";
import { cn } from "@/lib/utils";

interface ShareCardModalProps {
  open: boolean;
  onClose: () => void;
  productUrl: string;
  card: ShareCardInput;
}

export function ShareCardModal({ open, onClose, productUrl, card }: ShareCardModalProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [result, setResult] = useState<{ blob: Blob; dataUrl: string; isFallback: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStatus("loading");
    setResult(null);
    setShareError("");
    setCopied(false);

    generateShareCard(card)
      .then((r) => {
        if (cancelled) return;
        setResult(r);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
    // card内容が変わることは基本無いが、開いた商品が変わった場合に再生成する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, card.productName]);

  if (!open) return null;

  const fileName = `omiyagego_${card.productName.replace(/[^a-zA-Z0-9ぁ-んァ-ヶ一-龠]+/g, "_").slice(0, 30)}.png`;

  const handleNativeShare = async () => {
    if (!result) return;
    setShareError("");
    const file = new File([result.blob], fileName, { type: "image/png" });
    const shareData: ShareData & { files?: File[] } = {
      title: card.productName,
      text: `${card.productName}（${card.prefecture}）- ¥${card.price.toLocaleString()} #OmiyageGo`,
      url: productUrl,
      files: [file],
    };
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
      } else if (navigator.share) {
        // ファイル共有非対応環境ではURL/テキストのみ共有
        await navigator.share({ title: shareData.title, text: shareData.text, url: shareData.url });
      } else {
        setShareError("この端末・ブラウザは共有機能に対応していません。ダウンロードしてご利用ください。");
      }
    } catch (err) {
      // ユーザーによるキャンセル(AbortError)は無視
      if ((err as Error)?.name !== "AbortError") {
        setShareError("共有に失敗しました。ダウンロードしてご利用ください。");
      }
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError("URLのコピーに失敗しました");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 flex-shrink-0">
          <p className="text-sm font-bold text-stone-800">SNSシェアカード</p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* プレビュー */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-stone-50">
          <div
            className="mx-auto rounded-xl overflow-hidden bg-white border border-stone-200 shadow-sm"
            style={{ aspectRatio: "9 / 16", maxHeight: "56vh" }}
          >
            {status === "loading" && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-stone-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="text-xs">カードを生成中...</p>
              </div>
            )}
            {status === "error" && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center px-6">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                <p className="text-xs text-stone-500">
                  カード画像の生成に失敗しました。URLのコピーをご利用ください。
                </p>
              </div>
            )}
            {status === "ready" && result && (
              <img src={result.dataUrl} alt="シェアカードプレビュー" className="w-full h-full object-contain" />
            )}
          </div>

          {status === "ready" && result?.isFallback && (
            <p className="text-[11px] text-stone-400 mt-2 text-center leading-relaxed">
              商品写真の読み込み制限のため、テキストのみのカードを生成しました
            </p>
          )}

          {shareError && (
            <p className="text-[11px] text-red-500 mt-2 text-center">{shareError}</p>
          )}
        </div>

        {/* アクション */}
        <div className="px-4 py-3 border-t border-stone-100 flex-shrink-0 space-y-2">
          <button
            onClick={handleNativeShare}
            disabled={status !== "ready"}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Share2 className="w-4 h-4" />
            シェアする
          </button>

          <div className="flex gap-2">
            <a
              href={result?.dataUrl}
              download={fileName}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-bold transition-colors",
                status === "ready" ? "hover:bg-stone-50" : "opacity-40 pointer-events-none"
              )}
            >
              <Download className="w-4 h-4" />
              保存
            </a>
            <button
              onClick={handleCopyUrl}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-bold hover:bg-stone-50 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
              {copied ? "コピー済み" : "URLコピー"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
