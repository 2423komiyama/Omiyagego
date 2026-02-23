// ============================================================
// Omiyage Go - 検索条件グローバルコンテキスト
// ============================================================
import { createContext, useContext, useState, ReactNode } from "react";
import type { SearchConditions, TemperatureType } from "@/lib/mockData";

interface SearchContextType {
  conditions: SearchConditions;
  setConditions: (c: SearchConditions) => void;
  updateCondition: <K extends keyof SearchConditions>(
    key: K,
    value: SearchConditions[K]
  ) => void;
  resetConditions: () => void;
}

const defaultConditions: SearchConditions = {
  purpose: "",
  budget: null,
  shelfLife: null,
  individuallyWrapped: null,
  count: null,
  temperature: null,
};

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [conditions, setConditions] = useState<SearchConditions>(defaultConditions);

  const updateCondition = <K extends keyof SearchConditions>(
    key: K,
    value: SearchConditions[K]
  ) => {
    setConditions((prev) => ({ ...prev, [key]: value }));
  };

  const resetConditions = () => setConditions(defaultConditions);

  return (
    <SearchContext.Provider
      value={{ conditions, setConditions, updateCondition, resetConditions }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}
