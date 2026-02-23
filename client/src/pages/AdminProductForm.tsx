// ============================================================
// Omiyage Go - 商品編集フォーム
// ============================================================
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { toast } from "sonner";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

const REGIONS = [
  "北海道", "東北", "関東", "中部", "近畿", "中国", "四国", "九州・沖縄"
];

interface ProductFormData {
  name: string;
  brand: string;
  price: string;
  prefecture: string;
  region: string;
  description: string;
  shelfLife: string;
  imageUrl: string;
}

export default function AdminProductForm() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams();
  const productId = params?.id;
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    brand: "",
    price: "",
    prefecture: "",
    region: "",
    description: "",
    shelfLife: "",
    imageUrl: "",
  });

  // Get product data if editing
  const { data: product } = trpc.admin.products.get.useQuery(
    { id: productId || "" },
    { enabled: !!productId }
  );

  // Create/Update mutations
  const createMutation = trpc.admin.products.create.useMutation();
  const updateMutation = trpc.admin.products.update.useMutation();

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (productId) {
        // Update existing product
        await updateMutation.mutateAsync({
          id: productId,
          name: formData.name || undefined,
          brand: formData.brand || undefined,
          price: formData.price ? parseInt(formData.price) : undefined,
          prefecture: formData.prefecture || undefined,
          region: formData.region || undefined,
          description: formData.description || undefined,
          shelfLife: formData.shelfLife ? parseInt(formData.shelfLife) : undefined,
          imageUrl: formData.imageUrl || undefined,
        });
        toast.success("商品を更新しました");
      } else {
        // Create new product
        await createMutation.mutateAsync({
          name: formData.name,
          brand: formData.brand,
          price: parseInt(formData.price),
          prefecture: formData.prefecture,
          region: formData.region,
          description: formData.description || undefined,
          shelfLife: formData.shelfLife ? parseInt(formData.shelfLife) : undefined,
          imageUrl: formData.imageUrl || undefined,
        });
        toast.success("商品を追加しました");
      }
      navigate("/admin/products");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("商品の保存に失敗しました");
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
            onClick={() => navigate("/admin/products")}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {productId ? "商品を編集" : "商品を追加"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {productId ? "商品情報を更新してください" : "新しいお土産商品の情報を入力してください"}
            </p>
          </div>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* 基本情報 */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
                <CardDescription>商品の基本情報を入力します</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">商品名 *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="例：東京ばな奈"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">ブランド名 *</Label>
                    <Input
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="例：東京ばな奈"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">価格（円） *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="1080"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shelfLife">日持ち（日数）</Label>
                    <Input
                      id="shelfLife"
                      name="shelfLife"
                      type="number"
                      value={formData.shelfLife}
                      onChange={handleChange}
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">説明</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="商品の説明を入力してください"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">画像URL</Label>
                  <Input
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 地域情報 */}
            <Card>
              <CardHeader>
                <CardTitle>地域情報</CardTitle>
                <CardDescription>商品の地域を指定します</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="region">地方 *</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) => handleSelectChange("region", value)}
                  >
                    <SelectTrigger id="region">
                      <SelectValue placeholder="地方を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prefecture">都道府県 *</Label>
                  <Select
                    value={formData.prefecture}
                    onValueChange={(value) => handleSelectChange("prefecture", value)}
                  >
                    <SelectTrigger id="prefecture">
                      <SelectValue placeholder="都道府県を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREFECTURES.map((pref) => (
                        <SelectItem key={pref} value={pref}>
                          {pref}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* プレビュー */}
            <Card>
              <CardHeader>
                <CardTitle>プレビュー</CardTitle>
                <CardDescription>商品情報のプレビュー</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt={formData.name}
                    className="w-full h-48 object-cover rounded-md"
                  />
                )}
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">{formData.name || "商品名"}</p>
                  <p className="text-muted-foreground">{formData.brand || "ブランド"}</p>
                  <p className="font-bold">
                    ¥{formData.price ? parseInt(formData.price).toLocaleString() : "0"}
                  </p>
                  {formData.prefecture && (
                    <p className="text-xs text-muted-foreground">{formData.prefecture}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ボタン */}
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/products")}
            >
              キャンセル
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isPending || updateMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
