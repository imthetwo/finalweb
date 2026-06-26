"use client";

import { useMemo, useState } from "react";

import type { ProductListItem } from "@/types/api";
import { ProductCard } from "./components/ProductCard";
import { FilterSidebar } from "./components/FilterSidebar";
import { Pagination } from "./components/Pagination";

type SortKey = "featured" | "price-asc" | "price-desc" | "name";

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
  const [inStockOnly, setInStockOnly] = useState(false);
  const [specialOnly, setSpecialOnly] = useState(false);
  const [brands, setBrands] = useState<Set<string>>(new Set());
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("featured");

  const allBrands = useMemo(() => [...new Set(items.map((p) => p.brand))].sort(), [items]);
  const priceMax  = useMemo(() => Math.max(0, ...items.map((p) => p.displayPrice)), [items]);
  const inStockCount = useMemo(() => items.filter((p) => p.stock > 0).length, [items]);
  const specialCount = useMemo(() => items.filter((p) => p.salePrice && p.salePrice < p.price).length, [items]);

  const toggleBrand = (b: string) =>
    setBrands((prev) => {
      const n = new Set(prev);
      if (n.has(b)) n.delete(b);
      else n.add(b);
      return n;
    });

  const filtered = useMemo(() => {
    let list = [...items];
    if (inStockOnly) list = list.filter((p) => p.stock > 0);
    if (specialOnly) list = list.filter((p) => p.salePrice && p.salePrice < p.price);
    if (brands.size) list = list.filter((p) => brands.has(p.brand));
    if (maxPrice !== null) list = list.filter((p) => p.displayPrice <= maxPrice);
    if (sort === "price-asc") list.sort((a, b) => a.displayPrice - b.displayPrice);
    if (sort === "price-desc") list.sort((a, b) => b.displayPrice - a.displayPrice);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [items, inStockOnly, specialOnly, brands, maxPrice, sort]);

  const clearFilters = () => {
    setInStockOnly(false);
    setSpecialOnly(false);
    setBrands(new Set());
    setMaxPrice(null);
  };

  return (
    <main className="min-h-screen bg-base text-fg">
      <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">
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
          <FilterSidebar
            inStockOnly={inStockOnly}
            specialOnly={specialOnly}
            brands={brands}
            maxPrice={maxPrice}
            allBrands={allBrands}
            priceMax={priceMax}
            inStockCount={inStockCount}
            specialCount={specialCount}
            onInStockChange={setInStockOnly}
            onSpecialChange={setSpecialOnly}
            onBrandToggle={toggleBrand}
            onMaxPriceChange={setMaxPrice}
          />

          {/* Product grid */}
          <div className="flex-1">
            <p className="mb-4 text-sm text-muted">{filtered.length} products</p>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 border border-dashed border-edge py-20 text-muted">
                <p className="text-sm">No products match your filters.</p>
                <button type="button" onClick={clearFilters} className="text-sm text-brand underline">
                  Clear filters
                </button>
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
