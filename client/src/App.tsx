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
import Home from "./pages/Home";
import Conditions from "./pages/Conditions";
import Results from "./pages/Results";
import ProductDetail from "./pages/ProductDetail";
import SellerDetail from "./pages/SellerDetail";
import Favorites from "./pages/Favorites";
import MyPage from "./pages/MyPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/conditions" component={Conditions} />
      <Route path="/results" component={Results} />
      <Route path="/search" component={Results} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/seller/:id" component={SellerDetail} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/mypage" component={MyPage} />
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
            <TooltipProvider>
              <Toaster position="top-center" />
              <Router />
            </TooltipProvider>
          </FavoritesProvider>
        </SearchProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
