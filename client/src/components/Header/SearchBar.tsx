"use client";

import Image from "next/image";
import { Search, X } from "lucide-react";

import { formatVnd } from "@/lib/format";
import { useSearch } from "@/features/shop";

export function SearchBar({ onClose }: { onClose: () => void }) {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { inputRef, query, setQuery, results, loading, open, goToResults, goToProduct } = useSearch(onClose);

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
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mr-2 text-muted hover:text-fg"
          >
            <X size={16} />
          </button>
        )}
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
          {loading ? (
            <div className="px-4 py-6 text-center text-body text-muted">
              Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-body text-muted">
              No results for &ldquo;{query}&rdquo;
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
