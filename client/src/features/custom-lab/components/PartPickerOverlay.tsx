"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowUpDown, Box, Search, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVnd } from "@/lib/format";
import type { ApiPart, SlotCfg, SortKey } from "../types";

type Props = {
  slotCfg: SlotCfg;
  parts: ApiPart[];
  currentId?: string;
  loading: boolean;
  buildSummary: { count: number; total: number; watts: number };
  onAdd: (part: ApiPart) => void;
  onClose: () => void;
};

export function PartPickerOverlay({ slotCfg, parts, currentId, loading, buildSummary, onAdd, onClose }: Props) {
  const [query,      setQuery]      = useState("");
  const [sort,       setSort]       = useState<SortKey>("price-asc");
  const [brands,     setBrands]     = useState<Set<string>>(new Set());
  const [compatOnly, setCompatOnly] = useState(true);

  const priceBounds = useMemo(() => {
    if (!parts.length) return { min: 0, max: 0 };
    const prices = parts.map((p) => p.displayPrice);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [parts]);

  const [maxPrice, setMaxPrice] = useState<number>(priceBounds.max);

  const allBrands = useMemo(() => [...new Set(parts.map((p) => p.brand))].sort(), [parts]);

  const toggleBrand = (brand: string) =>
    setBrands((prev) => { const n = new Set(prev); n.has(brand) ? n.delete(brand) : n.add(brand); return n; });

  const filtered = useMemo(() => {
    let list = [...parts];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    if (brands.size > 0) list = list.filter((p) => brands.has(p.brand));
    if (maxPrice > 0)    list = list.filter((p) => p.displayPrice <= maxPrice);
    if (sort === "price-asc")  list.sort((a, b) => a.displayPrice - b.displayPrice);
    if (sort === "price-desc") list.sort((a, b) => b.displayPrice - a.displayPrice);
    if (sort === "name-asc")   list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [parts, query, brands, maxPrice, sort]);

  const effectiveMax = maxPrice || priceBounds.max;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-base text-fg animate-in fade-in duration-200">
      {/* Header */}
      <div className="relative shrink-0 border-b border-edge bg-[linear-gradient(180deg,#2d2b48_0%,#22203a_100%)]">
        <button type="button" onClick={onClose}
          className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5 border border-white/20 bg-base/30 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-secondary hover:border-white/40 hover:text-fg md:left-6">
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
          {/* Build summary */}
          <div className="mb-5 border border-edge bg-overlay p-4">
            <p className="mb-3 text-center text-[12px] font-black uppercase tracking-wider text-fg">
              <Box size={12} className="mr-1 inline text-brand" /> Part List
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Parts", value: buildSummary.count },
                { label: "Total", value: formatVnd(buildSummary.total), cyan: true },
                { label: "Watts", value: `${buildSummary.watts}W` },
              ].map(({ label, value, cyan }) => (
                <div key={label}>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted">{label}</p>
                  <p className={`text-[12px] font-black ${cyan ? "text-brand" : "text-fg"}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          <label className="mb-5 flex cursor-pointer items-center gap-2 border border-edge bg-overlay px-3 py-2.5">
            <input type="checkbox" checked={compatOnly} onChange={(e) => setCompatOnly(e.target.checked)} className="h-3.5 w-3.5 accent-brand" />
            <span className="text-[12px] font-semibold text-secondary">Compatibility Filter</span>
          </label>

          <div className="mb-6">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-muted">Price</p>
            <input type="range" min={priceBounds.min} max={priceBounds.max} step={100000}
              value={effectiveMax} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-brand" />
            <div className="mt-2 flex justify-between text-[11px] text-muted">
              <span>{formatVnd(priceBounds.min)}</span>
              <span className="font-bold text-secondary">≤ {formatVnd(effectiveMax)}</span>
            </div>
          </div>

          <div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-muted">Manufacturer</p>
            <div className="flex flex-col gap-1.5">
              {allBrands.map((brand) => (
                <label key={brand} className="group flex cursor-pointer items-center gap-2 py-0.5">
                  <input type="checkbox" checked={brands.has(brand)} onChange={() => toggleBrand(brand)} className="h-3.5 w-3.5 accent-brand" />
                  <span className={cn("text-[12px] transition-colors group-hover:text-fg", brands.has(brand) ? "font-bold text-brand" : "text-secondary")}>
                    {brand}
                  </span>
                </label>
              ))}
            </div>
            {brands.size > 0 && (
              <button type="button" onClick={() => setBrands(new Set())} className="mt-3 text-[11px] text-subtle underline hover:text-secondary">Clear</button>
            )}
          </div>
        </aside>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 flex-col gap-3 border-b border-edge bg-surface px-4 py-3 lg:flex-row lg:items-center lg:justify-between md:px-6">
            <h3 className="text-[15px] font-black text-fg">
              {filtered.length} <span className="font-medium text-muted">Compatible Products</span>
            </h3>
            <div className="flex items-center gap-3">
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
                className="border border-edge bg-surface px-2 py-1.5 text-[12px] text-secondary outline-none lg:hidden">
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
                <option value="name-asc">Name A–Z</option>
              </select>
              <div className="flex w-full items-center gap-2 border border-edge bg-surface px-3 py-1.5 focus-within:border-brand/50 lg:w-64">
                <Search size={13} className="shrink-0 text-muted" />
                <input type="text" placeholder={`Search ${slotCfg.shortLabel}…`} value={query}
                  onChange={(e) => setQuery(e.target.value)} autoFocus
                  className="flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-subtle" />
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
                <p className="text-[13px]">No matching products</p>
                <button type="button" onClick={() => { setQuery(""); setBrands(new Set()); setMaxPrice(priceBounds.max); }}
                  className="text-[12px] text-brand underline">Clear filters</button>
              </div>
            ) : (
              <table className="w-full border-collapse text-[13px]">
                <thead className="sticky top-0 z-10 border-b border-edge bg-elevated">
                  <tr>
                    <th className="w-9 px-2 py-2.5" />
                    <th className="w-14 px-3 py-2.5" />
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted">
                      <button type="button" onClick={() => setSort("name-asc")} className="flex items-center gap-1 hover:text-fg">
                        Name <ArrowUpDown size={9} />
                      </button>
                    </th>
                    {slotCfg.specs.map((s) => (
                      <th key={s.key} className="hidden px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted md:table-cell">{s.label}</th>
                    ))}
                    <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-muted">
                      <button type="button" onClick={() => setSort(sort === "price-asc" ? "price-desc" : "price-asc")}
                        className="ml-auto flex items-center gap-1 hover:text-fg">Price <ArrowUpDown size={9} /></button>
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
                        <td className="w-9 px-2 py-2"><input type="checkbox" readOnly checked={isSelected} className="h-3.5 w-3.5 accent-brand" /></td>
                        <td className="w-14 px-3 py-2">
                          <div className="flex h-11 w-11 items-center justify-center border border-edge bg-surface">
                            {part.thumbnailUrl
                              ? <Image src={part.thumbnailUrl} alt={part.name} width={44} height={44} className="h-full w-full object-contain p-1" />
                              : <slotCfg.Icon size={16} className="text-subtle" />}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-semibold leading-snug text-fg">{part.name}</p>
                          <p className="mt-0.5 text-[11px] text-muted">{part.brand}</p>
                        </td>
                        {slotCfg.specs.map((s) => {
                          const raw = part[s.key as keyof ApiPart];
                          const val = s.fmt ? s.fmt(raw) : (raw as string | null | undefined) ?? "—";
                          return <td key={s.key} className="hidden px-3 py-2 text-secondary md:table-cell">{val || "—"}</td>;
                        })}
                        <td className="px-4 py-2 text-right"><span className="font-black text-fg">{formatVnd(part.displayPrice)}</span></td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => { onAdd(part); onClose(); }}
                            className={cn("w-full px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-all duration-150",
                              isSelected ? "border border-brand/50 bg-brand/15 text-brand" : "bg-brand text-brand-fg hover:bg-brand-hover active:scale-95")}>
                            {isSelected ? "✓ Added" : "Add"}
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
