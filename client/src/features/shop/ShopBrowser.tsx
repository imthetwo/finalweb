"use client";

import { Suspense } from "react";

import type { ProductListItem } from "@/types/api";
import { ProductCard } from "./components/ProductCard";
import { FilterSidebar } from "./components/FilterSidebar";
import { Pagination } from "./components/Pagination";
import { useShopBrowser } from "./hooks/useShopBrowser";
import type { SortKey } from "./types";

export default function ShopBrowser({
  title,
  items,
  page = 1,
  totalPages = 1,
}: {
  title: string;
  items: ProductListItem[];
  page?: number;
  totalPages?: number;
}) {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { sort, setSort, filtered } = useShopBrowser(items);

  return (
    <main className="min-h-screen bg-base text-fg">
      <div className="mx-auto max-w-350 px-4 py-8 md:px-8">
        {/* Header */}
        <p className="text-xs uppercase tracking-wider text-muted">Home / Shop / {title}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4 border-b border-edge pb-5">
          <h1 className="text-3xl font-black uppercase tracking-tight">{title}</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="border border-edge bg-surface px-3 py-1.5 font-bold uppercase tracking-wider text-fg outline-none"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="name">Name: A → Z</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          {/* FilterSidebar uses useSearchParams(), which Next.js requires to be
              wrapped in Suspense so it doesn't force the whole route to
              client-side-only rendering. */}
          <Suspense fallback={<aside className="w-full shrink-0 lg:w-64" />}>
            <FilterSidebar />
          </Suspense>

          {/* Product grid */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 border border-dashed border-edge py-20 text-muted">
                <p className="text-sm">No products match your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
                </div>
                <Pagination page={page} totalPages={totalPages} />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
