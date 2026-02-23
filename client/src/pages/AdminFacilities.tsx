// ============================================================
// Omiyage Go - Admin Facilities Management Page
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
import { Plus, Edit2, Trash2, ArrowLeft, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminFacilities() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 施設データを取得
  const { data: facilities, isLoading: isLoadingFacilities } = trpc.admin.facilities.list.useQuery();
  const deleteMutation = trpc.admin.facilities.delete.useMutation();

  // 削除処理
  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("施設を削除しました");
    } catch (error) {
      console.error("Error deleting facility:", error);
      toast.error("施設の削除に失敗しました");
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

  const displayFacilities = facilities || [];

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
              <h1 className="text-3xl font-bold tracking-tight">施設管理</h1>
              <p className="text-muted-foreground mt-1">
                駅・空港などの施設情報を管理します
              </p>
            </div>
          </div>
          <Button onClick={() => navigate("/admin/facilities/new")} className="gap-2">
            <Plus className="w-4 h-4" />
            施設を追加
          </Button>
        </div>

        {/* 施設一覧テーブル */}
        <Card>
          <CardHeader>
            <CardTitle>施設一覧</CardTitle>
            <CardDescription>
              全{displayFacilities.length}件の施設が登録されています
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>施設名</TableHead>
                    <TableHead>地方</TableHead>
                    <TableHead>都道府県</TableHead>
                    <TableHead>改札内</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingFacilities ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        読み込み中...
                      </TableCell>
                    </TableRow>
                  ) : displayFacilities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        施設がまだ登録されていません
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayFacilities.map((facility: any) => (
                      <TableRow key={facility.id}>
                        <TableCell className="font-medium">{facility.name}</TableCell>
                        <TableCell>{facility.region}</TableCell>
                        <TableCell>{facility.prefecture}</TableCell>
                        <TableCell>
                          {facility.insideGate ? (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                              改札内
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                              改札外
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/facilities/${facility.id}`)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(facility.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 削除確認ダイアログ */}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogTitle>施設を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。施設を削除してもよろしいですか？
            </AlertDialogDescription>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteId) {
                    handleDelete(deleteId);
                    setDeleteId(null);
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "削除中..." : "削除"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
