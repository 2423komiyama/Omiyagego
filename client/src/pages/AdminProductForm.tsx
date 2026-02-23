// ============================================================
// Omiyage Go - Admin Product Form with Validation
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
import { useState, useEffect } from "react";
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

  // Create/Update mutations with auto-refresh
  const utils = trpc.useUtils();
  const createMutation = trpc.admin.products.create.useMutation({
    onSuccess: () => {
      utils.admin.products.list.invalidate();
    },
  });
  const updateMutation = trpc.admin.products.update.useMutation({
    onSuccess: () => {
      utils.admin.products.list.invalidate();
    },
  });

  // Auto-populate form when editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        brand: product.brand || "",
        price: product.price?.toString() || "",
        prefecture: product.prefecture || "",
        region: product.region || "",
        description: product.description || "",
        shelfLife: product.shelfLife?.toString() || "",
        imageUrl: product.imageUrl || "",
      });
    }
  }, [product]);

  // Admin check
  if (!loading && user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>Admin privileges required</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return false;
    }
    if (!formData.brand.trim()) {
      toast.error("Brand name is required");
      return false;
    }
    if (!formData.price || parseInt(formData.price) <= 0) {
      toast.error("Valid price is required");
      return false;
    }
    if (!formData.prefecture) {
      toast.error("Prefecture is required");
      return false;
    }
    if (!formData.region) {
      toast.error("Region is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
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
        toast.success("Product updated successfully");
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
        toast.success("Product created successfully");
      }
      navigate("/admin/products");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
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
              {productId ? "Edit Product" : "Add Product"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {productId ? "Update product information" : "Enter new product information"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Basic product details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Cream Brulee Tart"
                  required
                />
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Input
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="e.g., Patisserie ABC"
                  required
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price (¥) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="1000"
                  min="1"
                  required
                />
              </div>

              {/* Prefecture */}
              <div className="space-y-2">
                <Label htmlFor="prefecture">Prefecture *</Label>
                <Select value={formData.prefecture} onValueChange={(value) => handleSelectChange("prefecture", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select prefecture" />
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

              {/* Region */}
              <div className="space-y-2">
                <Label htmlFor="region">Region *</Label>
                <Select value={formData.region} onValueChange={(value) => handleSelectChange("region", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
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

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Product description..."
                  rows={4}
                />
              </div>

              {/* Shelf Life */}
              <div className="space-y-2">
                <Label htmlFor="shelfLife">Shelf Life (days)</Label>
                <Input
                  id="shelfLife"
                  name="shelfLife"
                  type="number"
                  value={formData.shelfLife}
                  onChange={handleInputChange}
                  placeholder="30"
                  min="0"
                />
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/products")}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
