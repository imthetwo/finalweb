import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { ProductListItem } from "@/types/api";
import type { SortKey } from "../types";

// Data/logic for the shop grid's sort control, which lives in the URL
// (?sortBy=) instead of component state — the server already applies it (see
// getShopPage.ts -> fetchProducts), so this only needs to build the next URL
// and navigate; the resulting `items` are just what the server already sent
// for this exact page.
export function useShopBrowser(items: ProductListItem[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = (searchParams.get("sortBy") as SortKey | null) ?? "featured";

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

  return { sort, setSort, filtered: items };
}
