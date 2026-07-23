import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { ProductListItem } from "@/types/api";
import type { SortKey } from "../types";

// Data/logic for the shop grid's sort + price controls. Both now live in the
// URL (?sortBy=&maxPrice=) instead of component state — the server already
// applies them (see getShopPage.ts -> fetchProducts), so this only needs to
// build the next URL and navigate; the resulting `items`/`priceMax` are just
// what the server already sent for this exact page. Previously this filtered
// only the current 48-item page client-side, which silently gave wrong
// results on categories with more than one page (a cheaper match on page 2
// was invisible, "Low to High" only reordered the current page, and the
// filter reset on every page change since it lived in local state).
export function useShopBrowser(items: ProductListItem[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = (searchParams.get("sortBy") as SortKey | null) ?? "featured";
  const maxPriceParam = searchParams.get("maxPrice");
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : null;

  // The current page's items are already the server-filtered/sorted set, but
  // the slider's own upper bound still needs a real ceiling to drag against —
  // derive it from what's on screen, same as before.
  const priceMax = useMemo(() => Math.max(0, ...items.map((p) => p.displayPrice)), [items]);

  const navigate = useCallback((mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page"); // any sort/filter change starts back at page 1
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  }, [router, pathname, searchParams]);

  const setSort = useCallback((next: SortKey) => {
    navigate((params) => {
      if (next === "featured") params.delete("sortBy");
      else params.set("sortBy", next);
    });
  }, [navigate]);

  const setMaxPrice = useCallback((next: number | null) => {
    navigate((params) => {
      if (next === null) params.delete("maxPrice");
      else params.set("maxPrice", String(next));
    });
  }, [navigate]);

  const clearFilters = () => setMaxPrice(null);

  return { maxPrice, setMaxPrice, sort, setSort, priceMax, filtered: items, clearFilters };
}
