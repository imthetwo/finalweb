import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Data/logic for shop-grid pagination — page-link URL building (preserving
// existing query params) and the compact page-number list with ellipsis gaps.
// The component only renders links based on this.
export function usePagination(page: number, totalPages: number) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefForPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const q = params.toString();
    return q ? `${pathname}?${q}` : pathname;
  };

  const pages = useMemo(() => {
    const set = new Set<number>([1, totalPages, page, page - 1, page + 1]);
    return [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  }, [page, totalPages]);

  return { hrefForPage, pages };
}
