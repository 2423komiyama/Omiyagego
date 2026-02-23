// ============================================================
// Omiyage Go - お気に入りコンテキスト（LocalStorage永続化）
// ============================================================
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

const STORAGE_KEY = "omiyage-go-favorites";

interface FavoritesContextType {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
  compareList: string[];
  toggleCompare: (id: string) => void;
  isInCompare: (id: string) => boolean;
  clearCompare: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [compareList, setCompareList] = useState<string[]>([]);

  // LocalStorageに同期
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  const addFavorite = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f !== id));
  }, []);

  const toggleFavorite = useCallback(
    (id: string) => {
      if (favorites.includes(id)) {
        removeFavorite(id);
      } else {
        addFavorite(id);
      }
    },
    [favorites, addFavorite, removeFavorite]
  );

  const clearFavorites = useCallback(() => setFavorites([]), []);

  // 比較機能（最大3件）
  const isInCompare = useCallback(
    (id: string) => compareList.includes(id),
    [compareList]
  );

  const toggleCompare = useCallback(
    (id: string) => {
      setCompareList((prev) => {
        if (prev.includes(id)) return prev.filter((c) => c !== id);
        if (prev.length >= 3) return prev; // 最大3件
        return [...prev, id];
      });
    },
    []
  );

  const clearCompare = useCallback(() => setCompareList([]), []);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        clearFavorites,
        compareList,
        toggleCompare,
        isInCompare,
        clearCompare,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
