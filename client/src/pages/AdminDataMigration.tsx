// Omiyage Go - Admin Data Migration Page
// ============================================================
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Database, AlertCircle, Upload, FileJson, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { ALL_PRODUCTS, FACILITIES } from "@/lib/mockData";
import { trpc } from "@/lib/trpc";

// ── JSON クリーニング関数（Gemini生成データ対応） ──────────────
function cleanGeminiJson(text: string): string {
  let cleaned = text;
  // コメントを除去（// から行末まで）
  cleaned = cleaned.replace(/\s*\/\/[^\n]*/g, "");
  // /* */ コメントを除去
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
  // 末尾カンマを除去（, の後に } または ] が続く場合）
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");
  // Windows改行を統一
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return cleaned.trim();
}

// ── JSONパース（複数形式対応） ────────────────────────────────
function parseGeminiData(text: string): RawProduct[] {
  const cleaned = cleanGeminiJson(text);

  // 形式1: { "products": [...] } または { "metadata": ..., "products": [...] }
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      if (Array.isArray(parsed.products)) return parsed.products;
      // 最初の配列フィールドを返す
      for (const val of Object.values(parsed)) {
        if (Array.isArray(val)) return val as RawProduct[];
      }
    }
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // 形式2: 配列のみ [ {...}, ... ]
    try {
      const parsed = JSON.parse("[" + cleaned + "]");
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // 形式3: === 都道府県名 === セクション区切りを除去して配列を結合
      const sectionRegex = /===.*?===/g;
      const withoutSections = cleaned.replace(sectionRegex, "").trim();
      // 複数の配列を結合
      const arrayMatches = withoutSections.match(/\[[\s\S]*?\]/g) || [];
      const allItems: RawProduct[] = [];
      for (const match of arrayMatches) {
        try {
          const arr = JSON.parse(match);
          if (Array.isArray(arr)) allItems.push(...arr);
        } catch {
          // スキップ
        }
      }
      if (allItems.length > 0) return allItems;
    }
  }

  throw new Error(
    "JSONのパースに失敗しました。形式を確認してください。\n" +
    "期待される形式: { \"products\": [...] } または [ {...}, ... ]"
  );
}

interface RawProduct {
  id?: string;
  name?: string;
  brand?: string;
  description?: string;
  price?: number | string;
  imageUrl?: string | null;
  prefecture?: string;
  region?: string;
  category?: string;
  shelfLife?: number | string;
  isIndividualPackaged?: boolean;
  servingSize?: number | string;
  guaranteeReason?: string[] | string;
  makerStory?: string;
  badges?: string[] | string;
}

function normalizeProduct(raw: RawProduct) {
  return {
    name: raw.name || "不明",
    brand: raw.brand || "不明",
    price: Number(raw.price) || 0,
    prefecture: raw.prefecture || "東京都",
    region: raw.region || "関東",
    description: raw.description || "",
    shelfLife: raw.shelfLife ? Number(raw.shelfLife) : 0,
    imageUrl: raw.imageUrl || undefined,
    category: raw.category || "その他",
    isIndividualPackaged: raw.isIndividualPackaged ?? false,
    servingSize: raw.servingSize ? Number(raw.servingSize) : 1,
    guaranteeReason: Array.isArray(raw.guaranteeReason)
      ? raw.guaranteeReason
      : typeof raw.guaranteeReason === "string"
      ? [raw.guaranteeReason]
      : [],
    makerStory: raw.makerStory || undefined,
    badges: Array.isArray(raw.badges)
      ? raw.badges
      : typeof raw.badges === "string"
      ? [raw.badges]
      : [],
  };
}

export default function AdminDataMigration() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [migrationLog, setMigrationLog] = useState<string[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bulkImportMutation = trpc.admin.products.bulkImport.useMutation();
  const createMutation = trpc.admin.products.create.useMutation();

  // 管理者チェック
  if (!loading && user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>アクセス拒否</CardTitle>
              <CardDescription>管理者権限が必要です</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                ホームに戻る
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const addLog = (message: string) => {
    setMigrationLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsMigrating(true);
    setProgress(0);
    setMigrationLog([]);

    try {
      const fileContent = await file.text();
      addLog(`📂 ファイル読み込み: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

      // JSONクリーニング＆パース
      addLog("🔍 JSONパース中...");
      let rawProducts: RawProduct[];
      try {
        rawProducts = parseGeminiData(fileContent);
      } catch (err) {
        addLog(`❌ JSONパースエラー: ${err instanceof Error ? err.message : "不明なエラー"}`);
        toast.error("JSONの形式が正しくありません。ファイルを確認してください。");
        return;
      }

      addLog(`📊 ${rawProducts.length} 件のデータを検出`);
      setTotalItems(rawProducts.length);

      // バッチサイズ（50件ずつ）
      const BATCH_SIZE = 50;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < rawProducts.length; i += BATCH_SIZE) {
        const batch = rawProducts.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(rawProducts.length / BATCH_SIZE);

        addLog(`📦 バッチ ${batchNum}/${totalBatches} (${batch.length} 件) を処理中...`);

        try {
          const normalized = batch.map(normalizeProduct);
          const result = await bulkImportMutation.mutateAsync({ products: normalized });
          successCount += result.successCount;
          errorCount += result.errorCount;

          if (result.errors.length > 0) {
            result.errors.forEach((err) => addLog(`  ⚠️  ${err}`));
          }

          addLog(`  ✅ バッチ ${batchNum} 完了: ${result.successCount} 件成功`);
        } catch (err) {
          errorCount += batch.length;
          addLog(`  ❌ バッチ ${batchNum} エラー: ${err instanceof Error ? err.message : "不明なエラー"}`);
        }

        setProgress(((i + BATCH_SIZE) / rawProducts.length) * 100);
      }

      setProgress(100);
      addLog("");
      addLog("✨ インポート完了！");
      addLog(`   ✅ 成功: ${successCount} 件`);
      addLog(`   ❌ エラー: ${errorCount} 件`);
      addLog(`   合計: ${rawProducts.length} 件`);

      if (successCount > 0) {
        toast.success(`${successCount} 件の商品をインポートしました`);
      } else {
        toast.error("インポートに失敗しました");
      }
    } catch (error) {
      console.error("Import error:", error);
      addLog(`❌ 予期しないエラー: ${error instanceof Error ? error.message : "不明なエラー"}`);
      toast.error("インポート中にエラーが発生しました");
    } finally {
      setIsMigrating(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    setProgress(0);
    setMigrationLog([]);
    setTotalItems(ALL_PRODUCTS.length);

    try {
      addLog(`📦 mockData.ts から ${ALL_PRODUCTS.length} 件の商品を移行中...`);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < ALL_PRODUCTS.length; i++) {
        const product = ALL_PRODUCTS[i];

        try {
          await createMutation.mutateAsync({
            name: product.name,
            brand: product.brand,
            price: product.price,
            prefecture: product.prefecture || "東京都",
            region: product.region || "関東",
            description: product.makerStory,
            shelfLife: product.shelfLifeDays,
            imageUrl: product.imageUrl,
          });

          successCount++;
          if (i % 10 === 0 || i === ALL_PRODUCTS.length - 1) {
            addLog(`✅ ${i + 1}/${ALL_PRODUCTS.length} 件処理済み`);
          }
        } catch (error) {
          errorCount++;
          addLog(`❌ エラー: ${product.name} - ${error instanceof Error ? error.message : "不明なエラー"}`);
        }

        setProgress(((i + 1) / ALL_PRODUCTS.length) * 100);
      }

      addLog("");
      addLog("✨ 移行完了！");
      addLog(`   ✅ 成功: ${successCount} 件`);
      addLog(`   ❌ エラー: ${errorCount} 件`);

      toast.success(`${successCount} 件の商品を移行しました`);
    } catch (error) {
      console.error("Migration error:", error);
      addLog(`❌ 致命的エラー: ${error instanceof Error ? error.message : "不明なエラー"}`);
      toast.error("移行中にエラーが発生しました");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">データ移行</h1>
            <p className="text-muted-foreground mt-1">
              Gemini生成JSONまたはmockData.tsからデータベースに一括登録します
            </p>
          </div>
        </div>

        {/* JSONアップロード */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <FileJson className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <CardTitle className="text-blue-900">JSONファイルからインポート（推奨）</CardTitle>
                <CardDescription className="text-blue-800 mt-2">
                  Geminiから生成されたJSONファイルをアップロードします。コメント付きや末尾カンマなど、Gemini特有の形式も自動修正して登録します。
                  50件ずつバッチ処理するため、1,000件以上でも安定して動作します。
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.txt"
                onChange={handleFileUpload}
                disabled={isMigrating}
                className="flex-1 px-4 py-2 border border-blue-300 rounded-lg bg-white text-sm"
              />
            </div>
            <p className="text-xs text-blue-700">
              対応形式: <code>{"{ \"products\": [...] }"}</code> または <code>{"[{...}, ...]"}</code>
            </p>
          </CardContent>
        </Card>

        {/* mockData移行 */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <CardTitle>mockData.tsから移行</CardTitle>
                <CardDescription className="mt-2">
                  既存の mockData.ts に含まれる {ALL_PRODUCTS.length} 件の商品データをデータベースに登録します。
                  施設数: {FACILITIES.length - 1} 施設
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleMigrate}
              disabled={isMigrating}
              variant="outline"
              className="gap-2"
            >
              <Database className="w-4 h-4" />
              mockDataから移行（{ALL_PRODUCTS.length}件）
            </Button>
          </CardContent>
        </Card>

        {/* 注意事項 */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <CardTitle className="text-amber-900">注意事項</CardTitle>
                <CardDescription className="text-amber-800 mt-2">
                  同じIDの商品が既に登録されている場合は上書き更新されます。
                  インポート前にデータのバックアップを取ることを推奨します。
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 進捗表示 */}
        {isMigrating && (
          <Card>
            <CardHeader>
              <CardTitle>処理中...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">進捗: {Math.round(progress)}%</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.round((progress / 100) * totalItems)}/{totalItems}
                  </p>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ログ表示 */}
        {migrationLog.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>処理ログ</CardTitle>
                <CardDescription>リアルタイムログ</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMigrationLog([])}
                className="gap-1 text-muted-foreground"
              >
                <Trash2 className="w-3.5 h-3.5" />
                クリア
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs max-h-96 overflow-y-auto space-y-0.5">
                {migrationLog.map((log, index) => (
                  <div
                    key={index}
                    className={`whitespace-pre-wrap break-words ${
                      log.includes("❌") ? "text-red-400" :
                      log.includes("✅") ? "text-green-400" :
                      log.includes("✨") ? "text-yellow-400" :
                      log.includes("⚠️") ? "text-amber-400" :
                      "text-slate-300"
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* フッターボタン */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/admin")}
            disabled={isMigrating}
          >
            管理画面に戻る
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
