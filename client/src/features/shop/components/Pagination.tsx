"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { usePagination } from "../hooks/usePagination";

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { hrefForPage, pages } = usePagination(page, totalPages);

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
