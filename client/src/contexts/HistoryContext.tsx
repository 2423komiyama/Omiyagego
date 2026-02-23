// ============================================================
// Omiyage Go - 検索履歴・閲覧履歴コンテキスト（LocalStorage永続化）
// ============================================================
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { SearchConditions } from "@/lib/mockData";

const SEARCH_HISTORY_KEY = "omiyage-go-search-history";
const VIEW_HISTORY_KEY = "omiyage-go-view-history";
const MAX_SEARCH_HISTORY = 10;
const MAX_VIEW_HISTORY = 20;

export interface SearchHistoryEntry {
  id: string;
  conditions: SearchConditions;
  timestamp: number;
  resultCount: number;
  label: string; // 人間が読みやすいラベル（例: "挨拶 / ¥3,000以内 / 個包装"）
}

export interface ViewHistoryEntry {
  productId: string;
  productName: string;
  productPrice: string;
  productImage: string;
  timestamp: number;
}

interface HistoryContextType {
  searchHistory: SearchHistoryEntry[];
  addSearchHistory: (entry: Omit<SearchHistoryEntry, "id">) => void;
  removeSearchHistory: (id: string) => void;
  clearSearchHistory: () => void;
  viewHistory: ViewHistoryEntry[];
  addViewHistory: (entry: ViewHistoryEntry) => void;
  clearViewHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>(() =>
    loadFromStorage(SEARCH_HISTORY_KEY, [])
  );
  const [viewHistory, setViewHistory] = useState<ViewHistoryEntry[]>(() =>
    loadFromStorage(VIEW_HISTORY_KEY, [])
  );

  useEffect(() => {
    saveToStorage(SEARCH_HISTORY_KEY, searchHistory);
  }, [searchHistory]);

  useEffect(() => {
    saveToStorage(VIEW_HISTORY_KEY, viewHistory);
  }, [viewHistory]);

  const addSearchHistory = useCallback(
    (entry: Omit<SearchHistoryEntry, "id">) => {
      const id = `sh_${Date.now()}`;
      setSearchHistory((prev) => {
        // 同じ条件の重複を除去
        const filtered = prev.filter((h) => h.label !== entry.label);
        return [{ ...entry, id }, ...filtered].slice(0, MAX_SEARCH_HISTORY);
      });
    },
    []
  );

  const removeSearchHistory = useCallback((id: string) => {
    setSearchHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const clearSearchHistory = useCallback(() => setSearchHistory([]), []);

  const addViewHistory = useCallback((entry: ViewHistoryEntry) => {
    setViewHistory((prev) => {
      // 同じ商品の重複を除去（最新を先頭に）
      const filtered = prev.filter((h) => h.productId !== entry.productId);
      return [entry, ...filtered].slice(0, MAX_VIEW_HISTORY);
    });
  }, []);

  const clearViewHistory = useCallback(() => setViewHistory([]), []);

  return (
    <HistoryContext.Provider
      value={{
        searchHistory,
        addSearchHistory,
        removeSearchHistory,
        clearSearchHistory,
        viewHistory,
        addViewHistory,
        clearViewHistory,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used within HistoryProvider");
  return ctx;
}

// 検索条件から人間が読みやすいラベルを生成
export function buildSearchLabel(conditions: SearchConditions): string {
  const parts: string[] = [];
  if (conditions.purpose) parts.push(conditions.purpose);
  if (conditions.budget) parts.push(`¥${conditions.budget.toLocaleString()}以内`);
  if (conditions.shelfLife !== null) {
    parts.push(conditions.shelfLife === 0 ? "当日" : `日持ち${conditions.shelfLife}日`);
  }
  if (conditions.individuallyWrapped === true) parts.push("個包装");
  if (conditions.count) parts.push(`${conditions.count}人向け`);
  if (conditions.temperature) parts.push(conditions.temperature);
  if (conditions.facilityId && conditions.facilityId !== "all") {
    parts.push(conditions.facilityId);
  }
  return parts.length > 0 ? parts.join(" / ") : "条件なし";
}
