// ============================================================
// Omiyage Go - 管理画面ダッシュボード
// ============================================================
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, MapPin, MessageSquare, ClipboardList } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

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
              <p className="text-sm text-muted-foreground mb-4">
                このページにアクセスするには管理者権限が必要です。
              </p>
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
          <div>
            <h1 className="text-3xl font-bold tracking-tight">管理画面</h1>
            <p className="text-muted-foreground mt-1">
              Omiyage Goのお土産データを管理します
            </p>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">商品数</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98</div>
              <p className="text-xs text-muted-foreground">全国対応</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">施設数</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">駅・空港</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">売り場</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">120+</div>
              <p className="text-xs text-muted-foreground">登録済み</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">予約</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">本日</p>
            </CardContent>
          </Card>
        </div>

        {/* 管理機能タブ */}
        <Card>
          <CardHeader>
            <CardTitle>管理機能</CardTitle>
            <CardDescription>
              お土産情報・施設・売り場を管理します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="products">商品</TabsTrigger>
                <TabsTrigger value="facilities">施設</TabsTrigger>
                <TabsTrigger value="sellers">売り場</TabsTrigger>
                <TabsTrigger value="reservations">予約</TabsTrigger>
              </TabsList>

              {/* 商品管理 */}
              <TabsContent value="products" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">商品管理</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      お土産商品を追加・編集・削除します
                    </p>
                  </div>
                  <Button onClick={() => navigate("/admin/products/new")} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    新規商品
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/admin/products")}
                >
                  商品一覧を表示
                </Button>
              </TabsContent>

              {/* 施設管理 */}
              <TabsContent value="facilities" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">施設管理</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      駅・空港などの施設情報を管理します
                    </p>
                  </div>
                  <Button onClick={() => navigate("/admin/facilities/new")} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    新規施設
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/admin/facilities")}
                >
                  施設一覧を表示
                </Button>
              </TabsContent>

              {/* 売り場管理 */}
              <TabsContent value="sellers" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">売り場管理</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      商品と施設の関連付けを管理します
                    </p>
                  </div>
                  <Button onClick={() => navigate("/admin/sellers/new")} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    新規売り場
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/admin/sellers")}
                >
                  売り場一覧を表示
                </Button>
              </TabsContent>

              {/* 予約管理 */}
              <TabsContent value="reservations" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">予約管理</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    ユーザーの取り置き予約を確認・管理します
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/admin/reservations")}
                >
                  予約一覧を表示
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* クイックリンク */}
        <Card>
          <CardHeader>
            <CardTitle>クイックリンク</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => navigate("/admin/products")}
              >
                <Package className="w-4 h-4 mr-2" />
                商品一覧
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => navigate("/admin/facilities")}
              >
                <MapPin className="w-4 h-4 mr-2" />
                施設一覧
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => navigate("/admin/sellers")}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                売り場一覧
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => navigate("/admin/reservations")}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                予約一覧
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
