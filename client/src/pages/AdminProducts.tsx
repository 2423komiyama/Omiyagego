// ============================================================
// Omiyage Go - 商品管理ページ
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
import { Plus, Edit2, Trash2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminProducts() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 商品データを取得
  const { data: products, isLoading: isLoadingProducts } = trpc.admin.products.list.useQuery();
  const deleteMutation = trpc.admin.products.delete.useMutation();

  // 削除処理
  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("商品を削除しました");
      // リスト再取得
      // TODO: 自動リフレッシュ機能を追加
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("商品の削除に失敗しました");
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

  // 商品リストをレンダリング
  const displayProducts = products || [];

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
              <h1 className="text-3xl font-bold tracking-tight">商品管理</h1>
              <p className="text-muted-foreground mt-1">
                お土産商品を追加・編集・削除します
              </p>
            </div>
          </div>
          <Button onClick={() => navigate("/admin/products/new")}>
            <Plus className="w-4 h-4 mr-2" />
            新規商品
          </Button>
        </div>

        {/* 商品一覧テーブル */}
        <Card>
          <CardHeader>
            <CardTitle>商品一覧</CardTitle>
            <CardDescription>
              全{displayProducts.length}件の商品が登録されています
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>画像</TableHead>
                    <TableHead>商品名</TableHead>
                    <TableHead>ブランド</TableHead>
                    <TableHead>価格</TableHead>
                    <TableHead>都道府県</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingProducts ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        読み込み中...
                      </TableCell>
                    </TableRow>
                  ) : displayProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        商品がまだ登録されていません
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayProducts.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.brand}</TableCell>
                      <TableCell>¥{product.price.toLocaleString()}</TableCell>
                      <TableCell>{product.prefecture}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/products/${product.id}`)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(product.id)}
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
            <AlertDialogTitle>商品を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。商品を削除してもよろしいですか？
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
