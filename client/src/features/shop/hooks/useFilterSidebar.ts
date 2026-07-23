import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { SubTypeFilter } from "../types";

// Data/logic for the shop sidebar's sub-type + brand filters — reads both
// from the URL and writes brand changes back (?brand=a,b). The component
// only renders based on this.
export function useFilterSidebar(subTypeFilters: SubTypeFilter[]) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subTypeFilter = subTypeFilters.find((f) => pathname.startsWith(f.matchPath));
  const activeSubType = subTypeFilter ? searchParams.get(subTypeFilter.param) : null;

  const activeBrands = new Set((searchParams.get("brand") ?? "").split(",").filter(Boolean));

  const toggleBrand = useCallback((brand: string) => {
    const next = new Set(activeBrands);
    if (next.has(brand)) next.delete(brand);
    else next.add(brand);

    const params = new URLSearchParams(searchParams.toString());
    if (next.size > 0) params.set("brand", [...next].join(","));
    else params.delete("brand");
    params.delete("page"); // any filter change starts back at page 1
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  }, [activeBrands, searchParams, router, pathname]);

  return { pathname, subTypeFilter, activeSubType, activeBrands, toggleBrand };
}
