// ============================================================
// Omiyage Go - アプリルーティング
// デザイン哲学: 駅案内板スタイル - 情報の読み取り速度最優先
// ============================================================
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SearchProvider } from "./contexts/SearchContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { HistoryProvider } from "./contexts/HistoryContext";
import Home from "./pages/Home";
import Conditions from "./pages/Conditions";
import Results from "./pages/Results";
import ProductDetail from "./pages/ProductDetail";
import SellerDetail from "./pages/SellerDetail";
import Favorites from "./pages/Favorites";
import MyPage from "./pages/MyPage";
import MapPage from "./pages/MapPage";
import SearchPage from "./pages/SearchPage";
import DBSearchPage from "./pages/DBSearchPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminProductForm from "./pages/AdminProductForm";
import AdminDataMigration from "./pages/AdminDataMigration";
import AdminFacilities from "./pages/AdminFacilities";
import AdminSellers from "./pages/AdminSellers";
import DBProductDetail from "./pages/DBProductDetail";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/conditions" component={Conditions} />
      <Route path="/results" component={Results} />
      <Route path="/search" component={SearchPage} />
      <Route path="/db-search" component={DBSearchPage} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/db-product/:id" component={DBProductDetail} />
      <Route path="/seller/:id" component={SellerDetail} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/mypage" component={MyPage} />
      <Route path="/map" component={MapPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/products/new" component={AdminProductForm} />
      <Route path="/admin/products/:id" component={AdminProductForm} />
      <Route path="/admin/migration" component={AdminDataMigration} />
      <Route path="/admin/facilities" component={AdminFacilities} />
      <Route path="/admin/sellers" component={AdminSellers} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <SearchProvider>
          <FavoritesProvider>
            <HistoryProvider>
            <TooltipProvider>
              <Toaster position="top-center" />
              <Router />
            </TooltipProvider>
            </HistoryProvider>
          </FavoritesProvider>
        </SearchProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
