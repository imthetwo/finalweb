import { usePathname, useSearchParams } from "next/navigation";

import type { SubTypeFilter } from "../types";

// Data/logic for the shop sidebar's sub-type filter — matches the current
// route against the configured sub-type filters and reads the active value
// from the URL. The component only renders based on this.
export function useFilterSidebar(subTypeFilters: SubTypeFilter[]) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const subTypeFilter = subTypeFilters.find((f) => pathname.startsWith(f.matchPath));
  const activeSubType = subTypeFilter ? searchParams.get(subTypeFilter.param) : null;

  return { pathname, subTypeFilter, activeSubType };
}
