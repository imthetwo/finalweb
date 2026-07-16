import { useMemo, useState } from "react";

import type { ProductListItem } from "@/types/api";
import type { SortKey } from "../types";

// Data/logic for the shop grid — client-side price filter + sort over the
// server-provided page of items. The component only renders based on this.
export function useShopBrowser(items: ProductListItem[]) {
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("featured");

  const priceMax = useMemo(() => Math.max(0, ...items.map((p) => p.displayPrice)), [items]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (maxPrice !== null) list = list.filter((p) => p.displayPrice <= maxPrice);
    if (sort === "price-asc") list.sort((a, b) => a.displayPrice - b.displayPrice);
    if (sort === "price-desc") list.sort((a, b) => b.displayPrice - a.displayPrice);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [items, maxPrice, sort]);

  const clearFilters = () => setMaxPrice(null);

  return { maxPrice, setMaxPrice, sort, setSort, priceMax, filtered, clearFilters };
}
