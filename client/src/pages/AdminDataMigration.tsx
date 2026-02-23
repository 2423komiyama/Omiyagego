// ============================================================
// Omiyage Go - Admin Data Migration Page
// ============================================================
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Database, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { ALL_PRODUCTS, FACILITIES } from "@/lib/mockData";
import { trpc } from "@/lib/trpc";

export default function AdminDataMigration() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [migrationLog, setMigrationLog] = useState<string[]>([]);

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

  const handleMigrate = async () => {
    setIsMigrating(true);
    setProgress(0);
    setMigrationLog([]);

    try {
      addLog(`📦 Starting migration of ${ALL_PRODUCTS.length} products...`);

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
          addLog(`✅ Migrated: ${product.name} (${i + 1}/${ALL_PRODUCTS.length})`);
        } catch (error) {
          errorCount++;
          addLog(
            `❌ Error: ${product.name} - ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }

        const currentProgress = ((i + 1) / ALL_PRODUCTS.length) * 100;
        setProgress(currentProgress);
      }

      addLog(`\n✨ Migration completed!`);
      addLog(`   ✅ Success: ${successCount}`);
      addLog(`   ❌ Errors: ${errorCount}`);

      toast.success(`${successCount}件の商品を移行しました`);
    } catch (error) {
      console.error("Migration error:", error);
      addLog(`❌ Fatal error: ${error instanceof Error ? error.message : "Unknown error"}`);
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
              mockData.tsから{ALL_PRODUCTS.length}件の商品データをデータベースに移行します
            </p>
          </div>
        </div>

        {/* 警告メッセージ */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <CardTitle className="text-amber-900">重要な注意事項</CardTitle>
                <CardDescription className="text-amber-800 mt-2">
                  このプロセスは、mockData.tsの全{ALL_PRODUCTS.length}件の商品をデータベースに一括登録します。既に登録されている商品は重複する可能性があります。実行前に必ずバックアップを取ってください。
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 移行情報 */}
        <Card>
          <CardHeader>
            <CardTitle>移行情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">移行対象商品数</p>
                <p className="text-2xl font-bold">{ALL_PRODUCTS.length}件</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">施設数</p>
                <p className="text-2xl font-bold">{FACILITIES.length - 1}個</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 進捗表示 */}
        {isMigrating && (
          <Card>
            <CardHeader>
              <CardTitle>移行進捗</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">進捗: {Math.round(progress)}%</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.round((progress / 100) * ALL_PRODUCTS.length)}/{ALL_PRODUCTS.length}
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
            <CardHeader>
              <CardTitle>移行ログ</CardTitle>
              <CardDescription>リアルタイム移行ログ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto space-y-1">
                {migrationLog.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap break-words">
                    {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ボタン */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/admin")}
            disabled={isMigrating}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleMigrate}
            disabled={isMigrating}
            className="gap-2"
          >
            <Database className="w-4 h-4" />
            {isMigrating ? "移行中..." : "データ移行を開始"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
