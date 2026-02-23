// ============================================================
// Omiyage Go - Admin Sellers Management Page
// ============================================================
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit2, Trash2, ArrowLeft, Store } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminSellers() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 売り場データを取得
  // const { data: sellers, isLoading: isLoadingSellers } = trpc.admin.sellers.list.useQuery();
  // const deleteMutation = trpc.admin.sellers.delete.useMutation();

  // 削除処理
  const handleDelete = async (id: string) => {
    try {
      // await deleteMutation.mutateAsync({ id });
      toast.success("売り場を削除しました");
    } catch (error) {
      console.error("Error deleting seller:", error);
      toast.error("売り場の削除に失敗しました");
    }
  };

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
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
              <h1 className="text-3xl font-bold tracking-tight">売り場管理</h1>
              <p className="text-muted-foreground mt-1">
                施設内の売り場情報を管理します
              </p>
            </div>
          </div>
          <Button onClick={() => navigate("/admin/sellers/new")} className="gap-2">
            <Plus className="w-4 h-4" />
            売り場を追加
          </Button>
        </div>

        {/* 準備中メッセージ */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">準備中</CardTitle>
            <CardDescription className="text-blue-800">
              売り場管理機能は現在準備中です。商品管理から売り場情報を設定できます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/products")}
            >
              商品管理に戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
