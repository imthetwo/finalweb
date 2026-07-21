"use client";

import Image from "next/image";
import { ArrowRight, Search, X } from "lucide-react";

import { formatVnd } from "@/lib/format";
import { useSearch } from "@/features/shop";

export function SearchBar({ onClose }: { onClose: () => void }) {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { inputRef, query, setQuery, results, pageResults, loading, open, goToResults, goToProduct, goToPage } =
    useSearch(onClose);
  const showProducts = query.trim().length >= 3;

  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: "1400px" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToResults();
        }}
        className="flex h-14 w-full items-center bg-surface px-4"
      >
        <Search size={20} className="flex-none text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, brands, categories…"
          className="flex-1 border-none bg-transparent px-4 text-base text-fg outline-none placeholder:text-subtle"
        />
        <button
          type="button"
          onClick={onClose}
          className="ml-4 text-muted transition-colors hover:text-fg"
          aria-label="Close search"
        >
          <X size={22} />
        </button>
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 max-h-[70vh] overflow-y-auto border border-edge bg-surface shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          {pageResults.length > 0 && (
            <div className="border-b border-edge/60">
              <p className="px-4 pt-3 pb-1 text-2xs font-bold uppercase tracking-wider text-subtle">Pages</p>
              {pageResults.map((p) => (
                <button
                  key={p.href}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goToPage(p.href)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/4"
                >
                  <ArrowRight size={14} className="flex-none text-brand" />
                  <span className="text-body font-semibold text-fg">{p.label}</span>
                </button>
              ))}
            </div>
          )}

          {!showProducts ? null : loading ? (
            <div className="px-4 py-6 text-center text-body text-muted">
              Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-body text-muted">
              No products for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {results.map((p) => {
                const hasSale = p.salePrice !== null && p.salePrice < p.price;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goToProduct(p.id)}
                    className="flex w-full items-center gap-3 border-b border-edge/60 px-4 py-3 text-left transition-colors hover:bg-white/4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-body font-semibold text-fg">
                        {p.name}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-body font-black text-brand">
                          {formatVnd(hasSale ? p.salePrice! : p.price)}
                        </span>
                        {hasSale && (
                          <span className="text-xs text-subtle line-through">
                            {formatVnd(p.price)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-12 w-12 shrink-0 border border-edge bg-elevated">
                      {p.thumbnailUrl && (
                        <Image
                          src={p.thumbnailUrl}
                          alt={p.name}
                          width={48}
                          height={48}
                          className="h-full w-full object-contain p-1"
                          unoptimized
                        />
                      )}
                    </div>
                  </button>
                );
              })}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={goToResults}
                className="block w-full px-4 py-3 text-center text-sm font-bold uppercase tracking-wider text-brand hover:bg-brand/10"
              >
                View all results for &ldquo;{query}&rdquo; →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
