import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { ApiPart, SlotCfg, SortKey } from "../types";
import { checkCandidatePart, isCandidateCompatible } from "../utils/checkCompatibility";

// Data/logic for the part-picker overlay — search/sort/brand/price/compat
// filters over the catalog, plus the "Add" flow (compatibility check +
// confirmation toast). The component only renders based on this.
export function usePartPicker({
  slotCfg, parts, selected, onAdd, onClose,
}: {
  slotCfg: SlotCfg;
  parts: ApiPart[];
  selected: Record<string, ApiPart | null | undefined>;
  onAdd: (part: ApiPart) => void;
  onClose: () => void;
}) {
  const [query,      setQuery]      = useState("");
  const [sort,       setSort]       = useState<SortKey>("price-asc");
  const [brands,     setBrands]     = useState<Set<string>>(new Set());
  const [compatOnly, setCompatOnly] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  async function handleAdd(part: ApiPart) {
    setCheckingId(part.id);
    const check = checkCandidatePart(part, slotCfg.slot, selected);
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (check.label) {
      if (check.ok) toast.success(`${check.label} — ${check.detail}`);
      else toast.warning(`${check.label} issue — ${check.detail}`);
    } else {
      // No compatibility rule applies to this slot (or nothing to compare
      // against yet) — still confirm the add instead of showing nothing.
      toast.success(`${part.name} added to your build`);
    }
    setCheckingId(null);
    onAdd(part);
    onClose();
  }

  const priceBounds = useMemo(() => {
    if (!parts.length) return { min: 0, max: 0 };
    const prices = parts.map((p) => p.displayPrice);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [parts]);

  // Parts are fully loaded before overlay mounts, so priceBounds.max is stable at init
  const [maxPrice, setMaxPrice] = useState<number>(priceBounds.max);

  const allBrands = useMemo(() => [...new Set(parts.map((p) => p.brand))].sort(), [parts]);

  const toggleBrand = (brand: string) =>
    setBrands((prev) => {
      const n = new Set(prev);
      if (n.has(brand)) n.delete(brand);
      else n.add(brand);
      return n;
    });

  const filtered = useMemo(() => {
    let list = [...parts];
    if (compatOnly) list = list.filter((p) => isCandidateCompatible(p, slotCfg.slot, selected));
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
  }, [parts, compatOnly, selected, slotCfg.slot, query, brands, maxPrice, sort]);

  const effectiveMax = maxPrice || priceBounds.max;

  const clearBrands = () => setBrands(new Set());
  const clearFilters = () => { setQuery(""); clearBrands(); setMaxPrice(priceBounds.max); };

  return {
    query, setQuery, sort, setSort, brands, toggleBrand, clearBrands, compatOnly, setCompatOnly,
    checkingId, handleAdd, priceBounds, maxPrice, setMaxPrice, effectiveMax,
    allBrands, filtered, clearFilters,
  };
}
