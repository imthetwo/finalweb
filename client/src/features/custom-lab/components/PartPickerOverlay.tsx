"use client";

import Image from "next/image";
import { ArrowUpDown, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVnd } from "@/lib/format";
import type { ApiPart, SlotCfg, SortKey } from "../types";
import { usePartPicker } from "../hooks/usePartPicker";

type Props = {
  slotCfg: SlotCfg;
  parts: ApiPart[];
  selected: Record<string, ApiPart | null | undefined>;
  currentId?: string;
  loading: boolean;
  onAdd: (part: ApiPart) => void;
  onClose: () => void;
};

export function PartPickerOverlay({ slotCfg, parts, selected, currentId, loading, onAdd, onClose }: Props) {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const {
    query, setQuery, sort, setSort, brands, toggleBrand, clearBrands, compatOnly, setCompatOnly,
    checkingId, handleAdd,
    allBrands, filtered, clearFilters,
  } = usePartPicker({ slotCfg, parts, selected, onAdd, onClose });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-base text-fg animate-in fade-in duration-200">
      {/* Header */}
      <div className="relative shrink-0 border-b border-edge bg-[linear-gradient(180deg,#2d2b48_0%,#22203a_100%)]">
        <button type="button" onClick={onClose}
          className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5 border border-white/20 bg-base/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-secondary hover:border-fg/40 hover:text-fg md:left-6">
          <X size={12} /> Cancel
        </button>
        <div className="flex items-center justify-center py-5">
          <h2 className="flex items-center gap-2.5 text-xl font-black uppercase tracking-wide text-fg md:text-2xl">
            <slotCfg.Icon size={20} className="text-brand" />
            Choose {slotCfg.shortLabel === "CPU" ? "A CPU" : `A ${slotCfg.shortLabel}`}
          </h2>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-edge bg-surface p-4 md:flex">
          <label className="mb-5 flex cursor-pointer items-center gap-2 border border-edge bg-overlay px-3 py-2.5">
            <input type="checkbox" checked={compatOnly} onChange={(e) => setCompatOnly(e.target.checked)} className="h-3.5 w-3.5 accent-brand" />
            <span className="text-sm font-semibold text-secondary">Compatibility Filter</span>
          </label>

          <div>
            <p className="mb-3 text-2xs font-black uppercase tracking-[0.25em] text-brand">Manufacturer</p>
            <div className="flex flex-col gap-1.5">
              {allBrands.map((brand) => (
                <label key={brand} className="group flex cursor-pointer items-center gap-2 py-0.5">
                  <input type="checkbox" checked={brands.has(brand)} onChange={() => toggleBrand(brand)} className="h-3.5 w-3.5 accent-brand" />
                  <span className={cn("text-sm transition-colors group-hover:text-fg", brands.has(brand) ? "font-bold text-brand" : "text-fg")}>
                    {brand}
                  </span>
                </label>
              ))}
            </div>
            {brands.size > 0 && (
              <button type="button" onClick={clearBrands} className="mt-3 text-xs text-subtle underline hover:text-secondary">Clear</button>
            )}
          </div>
        </aside>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 flex-col gap-3 border-b border-edge bg-surface px-4 py-3 lg:flex-row lg:items-center lg:justify-between md:px-6">
            <h3 className="text-base font-black text-fg">
              {filtered.length}{" "}
              <span className="font-medium text-muted">
                {compatOnly ? "Compatible Products" : "Products"}
              </span>
            </h3>
            <div className="flex items-center gap-3">
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
                className="border border-edge bg-surface px-2 py-1.5 text-sm text-secondary outline-none lg:hidden">
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
                <option value="name-asc">Name A–Z</option>
              </select>
              <div className="flex w-full items-center gap-2 border border-edge bg-surface px-3 py-1.5 focus-within:border-brand/50 lg:w-64">
                <Search size={13} className="shrink-0 text-muted" />
                <input type="text" placeholder={`Search ${slotCfg.shortLabel}…`} value={query}
                  onChange={(e) => setQuery(e.target.value)} autoFocus
                  className="flex-1 bg-transparent text-body text-fg outline-none placeholder:text-subtle" />
                {query && <button type="button" onClick={() => setQuery("")} className="text-muted hover:text-fg"><X size={12} /></button>}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-24 text-muted">Loading products…</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted">
                <Search size={28} className="opacity-30" />
                <p className="text-body">No matching products</p>
                <button type="button" onClick={clearFilters}
                  className="text-sm text-brand underline">Clear filters</button>
              </div>
            ) : (
              <table className="w-full border-collapse text-body">
                <thead className="sticky top-0 z-10 border-b border-edge bg-elevated">
                  <tr>
                    <th className="w-14 px-3 py-2.5" />
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-fg">
                      <button type="button" onClick={() => setSort("name-asc")} className="flex items-center gap-1 hover:text-brand">
                        Name <ArrowUpDown size={9} />
                      </button>
                    </th>
                    {slotCfg.specs.map((s) => (
                      <th key={s.key} className="hidden px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-fg md:table-cell">{s.label}</th>
                    ))}
                    <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-fg">
                      <button type="button" onClick={() => setSort(sort === "price-asc" ? "price-desc" : "price-asc")}
                        className="ml-auto flex items-center gap-1 hover:text-brand">Price <ArrowUpDown size={9} /></button>
                    </th>
                    <th className="w-24 px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((part, idx) => {
                    const isSelected = part.id === currentId;
                    return (
                      <tr key={part.id} className={cn(
                        "border-b border-edge/50 transition-colors hover:bg-white/2.5",
                        isSelected && "bg-brand/5 border-l-2 border-l-brand",
                        idx % 2 === 0 ? "bg-surface" : "bg-base",
                      )}>
                        <td className="w-14 px-3 py-2">
                          <div className="flex h-11 w-11 items-center justify-center border border-edge bg-surface">
                            {part.thumbnailUrl
                              ? <Image src={part.thumbnailUrl} alt={part.name} width={44} height={44} className="h-full w-full object-contain p-1" />
                              : <slotCfg.Icon size={16} className="text-subtle" />}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-semibold leading-snug text-fg">{part.name}</p>
                          <p className="mt-0.5 text-xs text-muted">{part.brand}</p>
                        </td>
                        {slotCfg.specs.map((s) => {
                          const raw = part[s.key as keyof ApiPart];
                          const val = s.fmt ? s.fmt(raw) : (raw as string | null | undefined) ?? "—";
                          return <td key={s.key} className="hidden px-3 py-2 text-secondary md:table-cell">{val || "—"}</td>;
                        })}
                        <td className="px-4 py-2 text-right"><span className="font-black text-fg">{formatVnd(part.displayPrice)}</span></td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => handleAdd(part)} disabled={checkingId === part.id}
                            className={cn("flex w-full items-center justify-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-150",
                              isSelected ? "border border-brand/50 bg-brand/15 text-brand" : "bg-brand text-brand-fg hover:bg-brand-hover active:scale-95 disabled:opacity-60")}>
                            {checkingId === part.id
                              ? <><Loader2 size={12} className="animate-spin" /> Checking…</>
                              : isSelected ? "✓ Added" : "Add"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
