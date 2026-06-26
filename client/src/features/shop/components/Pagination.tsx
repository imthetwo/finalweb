"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
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

  const linkCls = (active: boolean) =>
    `flex h-8 w-8 items-center justify-center border font-bold transition-colors ${
      active
        ? "border-brand text-brand"
        : "border-edge text-secondary hover:border-brand hover:text-brand"
    }`;

  if (totalPages <= 1) return null;

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5 text-sm">
      <Link
        href={hrefForPage(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`flex h-8 w-8 items-center justify-center border border-edge ${
          page <= 1 ? "pointer-events-none text-subtle" : "text-secondary hover:border-brand hover:text-brand"
        }`}
      >
        <ChevronLeft size={14} />
      </Link>

      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-subtle">…</span>}
          <Link href={hrefForPage(p)} className={linkCls(p === page)}>
            {p}
          </Link>
        </span>
      ))}

      <Link
        href={hrefForPage(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`flex h-8 w-8 items-center justify-center border border-edge ${
          page >= totalPages ? "pointer-events-none text-subtle" : "text-secondary hover:border-brand hover:text-brand"
        }`}
      >
        <ChevronRight size={14} />
      </Link>
    </nav>
  );
}
