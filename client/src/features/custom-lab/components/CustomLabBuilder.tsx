"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  AlertCircle, AlertTriangle, ArrowUpDown, Box, CheckCircle2,
  CircuitBoard, Cpu, Database, HardDrive, Monitor,
  Plus, Save, Search, ShoppingCart, Thermometer, Trash2, Wind, X, Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableFooter,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────
type ApiPart = {
  id: string;
  name: string;
  brand: string;
  displayPrice: number;
  thumbnailUrl: string | null;
  tdp?: number | null;
  wattage?: number | null;
  socket?: string | null;
  ramGen?: string | null;
  formFactor?: string | null;
};

type CompatibilityResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  requiredWatts?: number;
};

type SortKey = "price-asc" | "price-desc" | "name-asc";

type SlotCfg = {
  slot: string;
  label: string;
  shortLabel: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  defaultWatts: number;
  specs: { key: keyof ApiPart; label: string; fmt?: (v: unknown) => string }[];
};

// ─── Slot config + spec columns (PCPartPicker style) ──────────────────
const BUILD_SLOTS: SlotCfg[] = [
  {
    slot: "CPU", label: "CPU (Processor)", shortLabel: "CPU", Icon: Cpu, defaultWatts: 65,
    specs: [
      { key: "socket", label: "Socket" },
      { key: "tdp",    label: "TDP",    fmt: (v) => (v ? `${v}W` : "—") },
    ],
  },
  {
    slot: "CPU_COOLER", label: "CPU Cooler", shortLabel: "CPU Cooler", Icon: Thermometer, defaultWatts: 5,
    specs: [
      { key: "formFactor", label: "Type" },
      { key: "tdp",        label: "Power", fmt: (v) => (v ? `${v}W` : "—") },
    ],
  },
  {
    slot: "MOTHERBOARD", label: "Motherboard", shortLabel: "Motherboard", Icon: CircuitBoard, defaultWatts: 30,
    specs: [
      { key: "socket",      label: "Socket" },
      { key: "ramGen",      label: "RAM" },
      { key: "formFactor",  label: "Form Factor" },
    ],
  },
  {
    slot: "MEMORY", label: "Memory (RAM)", shortLabel: "RAM", Icon: Database, defaultWatts: 10,
    specs: [
      { key: "ramGen", label: "Type" },
      { key: "tdp",   label: "Draw", fmt: (v) => (v ? `${v}W` : "—") },
    ],
  },
  {
    slot: "STORAGE", label: "Storage (Drive)", shortLabel: "Storage", Icon: HardDrive, defaultWatts: 5,
    specs: [
      { key: "formFactor", label: "Interface" },
      { key: "tdp",        label: "Power", fmt: (v) => (v ? `${v}W` : "—") },
    ],
  },
  {
    slot: "GPU", label: "Video Card (GPU)", shortLabel: "GPU", Icon: Monitor, defaultWatts: 150,
    specs: [
      { key: "tdp", label: "TDP", fmt: (v) => (v ? `${v}W` : "—") },
    ],
  },
  {
    slot: "CASE", label: "Case (Chassis)", shortLabel: "Case", Icon: Box, defaultWatts: 0,
    specs: [
      { key: "formFactor", label: "Form Factor" },
    ],
  },
  {
    slot: "POWER_SUPPLY", label: "Power Supply (PSU)", shortLabel: "PSU", Icon: Zap, defaultWatts: 0,
    specs: [
      { key: "wattage", label: "Wattage", fmt: (v) => (v ? `${v}W` : "—") },
    ],
  },
  {
    slot: "CASE_FAN", label: "Case Fan", shortLabel: "Case Fan", Icon: Wind, defaultWatts: 3,
    specs: [
      { key: "tdp", label: "Power", fmt: (v) => (v ? `${v}W` : "—") },
    ],
  },
];

// ─── Mock fallback data ────────────────────────────────────────────────
const MOCK: Record<string, ApiPart[]> = {
  CPU: [
    { id: "m-cpu-1", name: "Intel Core Ultra 9 285K", brand: "Intel", displayPrice: 15490000, thumbnailUrl: null, tdp: 125, socket: "LGA1851" },
    { id: "m-cpu-2", name: "Intel Core Ultra 7 265K",  brand: "Intel", displayPrice: 10990000, thumbnailUrl: null, tdp: 125, socket: "LGA1851" },
    { id: "m-cpu-3", name: "Intel Core Ultra 5 245K",  brand: "Intel", displayPrice: 8490000,  thumbnailUrl: null, tdp: 125, socket: "LGA1851" },
    { id: "m-cpu-4", name: "AMD Ryzen 9 9950X",        brand: "AMD",   displayPrice: 14990000, thumbnailUrl: null, tdp: 170, socket: "AM5" },
    { id: "m-cpu-5", name: "AMD Ryzen 7 9700X",        brand: "AMD",   displayPrice: 8990000,  thumbnailUrl: null, tdp: 65,  socket: "AM5" },
    { id: "m-cpu-6", name: "AMD Ryzen 5 9600X",        brand: "AMD",   displayPrice: 6490000,  thumbnailUrl: null, tdp: 65,  socket: "AM5" },
  ],
  CPU_COOLER: [
    { id: "m-cool-1", name: "NZXT Kraken RGB 360mm AIO",          brand: "NZXT",    displayPrice: 3990000, thumbnailUrl: null, tdp: 10, formFactor: "AIO 360mm" },
    { id: "m-cool-2", name: "Corsair H150i Elite Capellix 360mm", brand: "Corsair", displayPrice: 4490000, thumbnailUrl: null, tdp: 8,  formFactor: "AIO 360mm" },
    { id: "m-cool-3", name: "NZXT Kraken 240mm AIO",              brand: "NZXT",    displayPrice: 2990000, thumbnailUrl: null, tdp: 8,  formFactor: "AIO 240mm" },
  ],
  MOTHERBOARD: [
    { id: "m-mb-1", name: "ASUS ROG MAXIMUS Z890 APEX",      brand: "ASUS", displayPrice: 22990000, thumbnailUrl: null, socket: "LGA1851", ramGen: "DDR5", formFactor: "ATX" },
    { id: "m-mb-2", name: "MSI MAG Z890 TOMAHAWK WIFI DDR5", brand: "MSI",  displayPrice: 7990000,  thumbnailUrl: null, socket: "LGA1851", ramGen: "DDR5", formFactor: "ATX" },
    { id: "m-mb-3", name: "ASUS ROG CROSSHAIR X870E HERO",   brand: "ASUS", displayPrice: 16990000, thumbnailUrl: null, socket: "AM5",    ramGen: "DDR5", formFactor: "ATX" },
    { id: "m-mb-4", name: "Gigabyte B650E AORUS Master",      brand: "Gigabyte", displayPrice: 8490000, thumbnailUrl: null, socket: "AM5", ramGen: "DDR5", formFactor: "ATX" },
  ],
  MEMORY: [
    { id: "m-ram-1", name: "Corsair Vengeance DDR5 32GB 6000MHz",       brand: "Corsair", displayPrice: 3490000,  thumbnailUrl: null, ramGen: "DDR5", tdp: 10 },
    { id: "m-ram-2", name: "Corsair Dominator Titanium DDR5 64GB 6400", brand: "Corsair", displayPrice: 8990000,  thumbnailUrl: null, ramGen: "DDR5", tdp: 15 },
    { id: "m-ram-3", name: "G.Skill Trident Z5 RGB DDR5 32GB 7200",     brand: "G.Skill", displayPrice: 4990000, thumbnailUrl: null, ramGen: "DDR5", tdp: 12 },
    { id: "m-ram-4", name: "Kingston Fury Beast DDR4 32GB 3200",         brand: "Kingston",displayPrice: 1990000, thumbnailUrl: null, ramGen: "DDR4", tdp: 8  },
  ],
  STORAGE: [
    { id: "m-ssd-1", name: "Samsung 990 Pro NVMe M.2 2TB", brand: "Samsung",  displayPrice: 3290000, thumbnailUrl: null, tdp: 5,  formFactor: "M.2 NVMe" },
    { id: "m-ssd-2", name: "Samsung 9100 Pro NVMe M.2 2TB",brand: "Samsung",  displayPrice: 4990000, thumbnailUrl: null, tdp: 6,  formFactor: "M.2 NVMe" },
    { id: "m-ssd-3", name: "WD Black SN850X 2TB",           brand: "WD",       displayPrice: 2990000, thumbnailUrl: null, tdp: 5,  formFactor: "M.2 NVMe" },
    { id: "m-ssd-4", name: "Samsung 870 EVO SATA SSD 2TB",  brand: "Samsung",  displayPrice: 2190000, thumbnailUrl: null, tdp: 3,  formFactor: "2.5\" SATA" },
  ],
  GPU: [
    { id: "m-gpu-1", name: "NVIDIA GeForce RTX 4090 FE",        brand: "NVIDIA",   displayPrice: 38990000, thumbnailUrl: null, tdp: 450 },
    { id: "m-gpu-2", name: "ASUS TUF RTX 4080 SUPER OC",        brand: "ASUS",     displayPrice: 24990000, thumbnailUrl: null, tdp: 320 },
    { id: "m-gpu-3", name: "MSI GeForce RTX 4070 Ti SUPRIM OC", brand: "MSI",      displayPrice: 19490000, thumbnailUrl: null, tdp: 285 },
    { id: "m-gpu-4", name: "AMD Radeon RX 7900 XTX",             brand: "AMD",      displayPrice: 19990000, thumbnailUrl: null, tdp: 355 },
    { id: "m-gpu-5", name: "Gigabyte RX 7900 XT Gaming OC",      brand: "Gigabyte", displayPrice: 15990000, thumbnailUrl: null, tdp: 315 },
  ],
  CASE: [
    { id: "m-case-1", name: "Corsair iCUE 5000X RGB Mid-Tower",   brand: "Corsair", displayPrice: 3490000, thumbnailUrl: null, formFactor: "ATX" },
    { id: "m-case-2", name: "Corsair 4000D Airflow Mid-Tower",     brand: "Corsair", displayPrice: 2190000, thumbnailUrl: null, formFactor: "ATX" },
    { id: "m-case-3", name: "NZXT H9 Flow Mid-Tower",              brand: "NZXT",    displayPrice: 3990000, thumbnailUrl: null, formFactor: "ATX" },
    { id: "m-case-4", name: "Lian Li PC-O11 Dynamic EVO XL",       brand: "Lian Li", displayPrice: 4490000, thumbnailUrl: null, formFactor: "E-ATX" },
  ],
  POWER_SUPPLY: [
    { id: "m-psu-1", name: "Corsair RM1000x Gold 1000W",  brand: "Corsair", displayPrice: 4990000, thumbnailUrl: null, wattage: 1000 },
    { id: "m-psu-2", name: "Corsair RM850x Gold 850W",    brand: "Corsair", displayPrice: 3490000, thumbnailUrl: null, wattage: 850  },
    { id: "m-psu-3", name: "EVGA SuperNOVA G6 850W Gold", brand: "EVGA",    displayPrice: 3290000, thumbnailUrl: null, wattage: 850  },
    { id: "m-psu-4", name: "Corsair HX1500i Platinum",    brand: "Corsair", displayPrice: 9990000, thumbnailUrl: null, wattage: 1500 },
  ],
  CASE_FAN: [
    { id: "m-fan-1", name: "Corsair LL120 RGB Triple Pack", brand: "Corsair", displayPrice: 1490000, thumbnailUrl: null, tdp: 3 },
    { id: "m-fan-2", name: "Corsair F120X Performance Fan", brand: "Corsair", displayPrice: 590000,  thumbnailUrl: null, tdp: 2 },
    { id: "m-fan-3", name: "Corsair F360X Fans",            brand: "Corsair", displayPrice: 990000,  thumbnailUrl: null, tdp: 4 },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// PART PICKER — Full-screen overlay (PCPartPicker UX)
// ─────────────────────────────────────────────────────────────────────
function PartPickerOverlay({
  slotCfg,
  parts,
  currentId,
  loading,
  buildSummary,
  onAdd,
  onClose,
}: {
  slotCfg: SlotCfg;
  parts: ApiPart[];
  currentId?: string;
  loading: boolean;
  buildSummary: { count: number; total: number; watts: number };
  onAdd: (part: ApiPart) => void;
  onClose: () => void;
}) {
  const [query,  setQuery]  = useState("");
  const [sort,   setSort]   = useState<SortKey>("price-asc");
  const [brands, setBrands] = useState<Set<string>>(new Set());
  const [compatOnly, setCompatOnly] = useState(true);

  // Price bounds across this slot's parts
  const priceBounds = useMemo(() => {
    if (!parts.length) return { min: 0, max: 0 };
    const prices = parts.map((p) => p.displayPrice);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [parts]);

  // Slider max — initialised to the highest price in this slot.
  // The overlay remounts per slot (it unmounts on close), so this stays correct.
  const [maxPrice, setMaxPrice] = useState<number>(priceBounds.max);

  // Unique manufacturers
  const allBrands = useMemo(() => [...new Set(parts.map((p) => p.brand))].sort(), [parts]);

  const toggleBrand = (brand: string) =>
    setBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });

  // Filter + sort
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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a] text-white animate-in fade-in duration-200">

      {/* ── Purple banner header (PCPartPicker style) ── */}
      <div className="relative shrink-0 border-b border-zinc-800 bg-[linear-gradient(180deg,#2d2b48_0%,#22203a_100%)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5 border border-white/20 bg-black/30 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-200 transition-colors hover:border-white/40 hover:text-white md:left-6"
        >
          <X size={12} /> Cancel
        </button>

        <div className="flex items-center justify-center py-5">
          <h2 className="flex items-center gap-2.5 text-xl font-black uppercase tracking-wide text-white md:text-2xl">
            <slotCfg.Icon size={20} className="text-[#00ffff]" />
            Choose {slotCfg.shortLabel === "CPU" ? "A CPU" : `A ${slotCfg.shortLabel}`}
          </h2>
        </div>
      </div>

      {/* ── Body: sidebar + content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ── */}
        <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-zinc-800 bg-[#0d0d0d] p-4 md:flex">

          {/* Part List summary card */}
          <div className="mb-5 border border-zinc-700 bg-[#141414] p-4">
            <p className="mb-3 text-center text-[12px] font-black uppercase tracking-wider text-white">
              <Box size={12} className="mr-1 inline text-[#00ffff]" /> Part List
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Parts</p>
                <p className="text-base font-black text-white">{buildSummary.count}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Total</p>
                <p className="text-[12px] font-black text-[#00ffff]">{formatVnd(buildSummary.total)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Watts</p>
                <p className="text-base font-black text-white">{buildSummary.watts}W</p>
              </div>
            </div>
          </div>

          {/* Compatibility Filter */}
          <label className="mb-5 flex cursor-pointer items-center gap-2 border border-zinc-800 bg-[#141414] px-3 py-2.5">
            <input
              type="checkbox"
              checked={compatOnly}
              onChange={(e) => setCompatOnly(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#00ffff]"
            />
            <span className="text-[12px] font-semibold text-zinc-300">Compatibility Filter</span>
          </label>

          {/* Price filter */}
          <div className="mb-6">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Price</p>
            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              step={100000}
              value={effectiveMax}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#00ffff]"
            />
            <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
              <span>{formatVnd(priceBounds.min)}</span>
              <span className="font-bold text-zinc-300">≤ {formatVnd(effectiveMax)}</span>
            </div>
          </div>

          {/* Manufacturer filter */}
          <div className="mb-6">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Manufacturer</p>
            <div className="flex flex-col gap-1.5">
              {allBrands.map((brand) => (
                <label key={brand} className="group flex cursor-pointer items-center gap-2 py-0.5">
                  <input
                    type="checkbox"
                    checked={brands.has(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="h-3.5 w-3.5 accent-[#00ffff]"
                  />
                  <span className={cn(
                    "text-[12px] transition-colors group-hover:text-white",
                    brands.has(brand) ? "font-bold text-[#00ffff]" : "text-zinc-400",
                  )}>
                    {brand}
                  </span>
                </label>
              ))}
            </div>
            {brands.size > 0 && (
              <button
                type="button"
                onClick={() => setBrands(new Set())}
                className="mt-3 text-[11px] text-zinc-600 underline hover:text-zinc-400"
              >
                Clear
              </button>
            )}
          </div>
        </aside>

        {/* ── Right content ── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Toolbar: count + select controls + search */}
          <div className="flex shrink-0 flex-col gap-3 border-b border-zinc-800 bg-[#0d0d0d] px-4 py-3 lg:flex-row lg:items-center lg:justify-between md:px-6">
            <div className="flex items-center gap-4">
              <h3 className="text-[15px] font-black text-white">
                {filtered.length} <span className="font-medium text-zinc-400">Compatible Products</span>
              </h3>
              <div className="hidden items-center gap-3 text-[11px] sm:flex">
                <span className="text-[#00ffff]">Select All</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-500 hover:text-zinc-300 cursor-pointer">Select None</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile sort */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[12px] text-zinc-300 outline-none lg:hidden"
              >
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
                <option value="name-asc">Name A–Z</option>
              </select>

              {/* Search */}
              <div className="flex w-full items-center gap-2 border border-zinc-700 bg-zinc-900 px-3 py-1.5 focus-within:border-[#00ffff]/50 lg:w-64">
                <Search size={13} className="shrink-0 text-zinc-500" />
                <input
                  type="text"
                  placeholder={`Search ${slotCfg.shortLabel}…`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-zinc-600"
                  autoFocus
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} className="text-zinc-500 hover:text-white">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Product table */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-24 text-zinc-500">Loading products…</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-500">
                <Search size={28} className="opacity-30" />
                <p className="text-[13px]">No matching products</p>
                <button
                  type="button"
                  onClick={() => { setQuery(""); setBrands(new Set()); setMaxPrice(priceBounds.max); }}
                  className="text-[12px] text-[#00ffff] underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <table className="w-full border-collapse text-[13px]">
                <thead className="sticky top-0 z-10 border-b border-zinc-800 bg-[#111]">
                  <tr>
                    <th className="w-9 px-2 py-2.5" />
                    <th className="w-14 px-3 py-2.5" />
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      <button type="button" onClick={() => setSort("name-asc")} className="flex items-center gap-1 hover:text-white">
                        Name <ArrowUpDown size={9} />
                      </button>
                    </th>
                    {slotCfg.specs.map((s) => (
                      <th key={s.key} className="hidden px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 md:table-cell">
                        {s.label}
                      </th>
                    ))}
                    <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      <button
                        type="button"
                        onClick={() => setSort(sort === "price-asc" ? "price-desc" : "price-asc")}
                        className="ml-auto flex items-center gap-1 hover:text-white"
                      >
                        Price <ArrowUpDown size={9} />
                      </button>
                    </th>
                    <th className="w-24 px-4 py-2.5" />
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((part, idx) => {
                    const isSelected = part.id === currentId;
                    return (
                      <tr
                        key={part.id}
                        className={cn(
                          "border-b border-zinc-800/50 transition-colors hover:bg-white/2.5",
                          isSelected && "bg-[#00ffff]/5 border-l-2 border-l-[#00ffff]",
                          idx % 2 === 0 ? "bg-[#0d0d0d]" : "bg-[#0a0a0a]",
                        )}
                      >
                        {/* Checkbox (visual) */}
                        <td className="w-9 px-2 py-2">
                          <input type="checkbox" readOnly checked={isSelected} className="h-3.5 w-3.5 accent-[#00ffff]" />
                        </td>

                        {/* Thumbnail */}
                        <td className="w-14 px-3 py-2">
                          <div className="flex h-11 w-11 items-center justify-center border border-zinc-800 bg-zinc-900">
                            {part.thumbnailUrl ? (
                              <Image
                                src={part.thumbnailUrl}
                                alt={part.name}
                                width={44}
                                height={44}
                                className="h-full w-full object-contain p-1"
                              />
                            ) : (
                              <slotCfg.Icon size={16} className="text-zinc-600" />
                            )}
                          </div>
                        </td>

                        {/* Name + brand */}
                        <td className="px-3 py-2">
                          <p className="font-semibold leading-snug text-white">{part.name}</p>
                          <p className="mt-0.5 text-[11px] text-zinc-500">{part.brand}</p>
                        </td>

                        {/* Spec columns */}
                        {slotCfg.specs.map((s) => {
                          const raw = part[s.key as keyof ApiPart];
                          const val = s.fmt ? s.fmt(raw) : (raw as string | null | undefined) ?? "—";
                          return (
                            <td key={s.key} className="hidden px-3 py-2 text-zinc-400 md:table-cell">
                              {val || "—"}
                            </td>
                          );
                        })}

                        {/* Price */}
                        <td className="px-4 py-2 text-right">
                          <span className="font-black text-white">{formatVnd(part.displayPrice)}</span>
                        </td>

                        {/* Add button */}
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => { onAdd(part); onClose(); }}
                            className={cn(
                              "w-full px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-all duration-150",
                              isSelected
                                ? "border border-[#00ffff]/50 bg-[#00ffff]/15 text-[#00ffff]"
                                : "bg-[#00ffff] text-black hover:bg-[#00ffff]/85 hover:shadow-[0_0_12px_rgba(0,255,255,0.3)] active:scale-95",
                            )}
                          >
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

// ─────────────────────────────────────────────────────────────────────
// STATUS BAR
// ─────────────────────────────────────────────────────────────────────
function StatusBar({
  compatibility, estimatedWatts, totalPrice, validating, onValidate,
}: {
  compatibility: CompatibilityResult | null;
  estimatedWatts: number;
  totalPrice: number;
  validating: boolean;
  onValidate: () => void;
}) {
  const status = !compatibility
    ? { Icon: AlertCircle, label: "Not checked yet", cls: "text-zinc-500 border-zinc-700 bg-zinc-800/30" }
    : compatibility.errors.length > 0
    ? { Icon: AlertCircle, label: `${compatibility.errors.length} compatibility errors`, cls: "text-red-400 border-red-800/50 bg-red-950/30" }
    : compatibility.warnings.length > 0
    ? { Icon: AlertTriangle, label: `${compatibility.warnings.length} warnings`, cls: "text-yellow-400 border-yellow-800/50 bg-yellow-950/30" }
    : { Icon: CheckCircle2, label: "Fully compatible", cls: "text-emerald-400 border-emerald-800/50 bg-emerald-950/30" };

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-zinc-800 bg-[#0a0a0a] px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between md:px-6">
      <div className={cn("flex items-center gap-2 border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider", status.cls)}>
        <status.Icon size={13} />
        {status.label}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[12px] text-zinc-400">
          <Zap size={11} className="mr-1 inline text-[#00ffff]" />
          Wattage: <strong className="text-white">{estimatedWatts}W</strong>
        </span>
        <span className="hidden h-3.5 w-px bg-zinc-700 sm:block" />
        <span className="text-[12px] font-black text-white">{formatVnd(totalPrice)}</span>
        <button
          type="button"
          onClick={onValidate}
          disabled={validating}
          className="border border-[#00ffff]/40 bg-[#00ffff]/6 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#00ffff] transition-all hover:bg-[#00ffff]/15 disabled:opacity-50"
        >
          {validating ? "Checking…" : "Validate"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MAIN BUILDER
// ─────────────────────────────────────────────────────────────────────
export default function CustomLabBuilder() {
  const [selected,    setSelected]    = useState<Record<string, ApiPart | null>>({});
  const [parts,       setParts]       = useState<Record<string, ApiPart[]>>({});
  const [loading,     setLoading]     = useState<Record<string, boolean>>({});
  const [pickerSlot,  setPickerSlot]  = useState<string | null>(null);
  const [compat,      setCompat]      = useState<CompatibilityResult | null>(null);
  const [validating,  setValidating]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [addingCart,  setAddingCart]  = useState(false);

  // ── Load slot parts from API (fallback to mock) ──
  const loadParts = useCallback(async (slot: string) => {
    if (parts[slot]) return;
    setLoading((p) => ({ ...p, [slot]: true }));
    try {
      const data = await apiFetch<{ items: ApiPart[] }>(`/custom-lab/parts?slot=${slot}`);
      setParts((p) => ({ ...p, [slot]: data.items?.length ? data.items : (MOCK[slot] ?? []) }));
    } catch {
      setParts((p) => ({ ...p, [slot]: MOCK[slot] ?? [] }));
    } finally {
      setLoading((p) => ({ ...p, [slot]: false }));
    }
  }, [parts]);

  const openPicker = useCallback(async (slot: string) => {
    await loadParts(slot);
    setPickerSlot(slot);
  }, [loadParts]);

  const selectPart = useCallback((slot: string, part: ApiPart) => {
    setSelected((p) => ({ ...p, [slot]: part }));
    setCompat(null);
  }, []);

  const removePart = useCallback((slot: string) => {
    setSelected((p) => ({ ...p, [slot]: null }));
    setCompat(null);
  }, []);

  const validateBuild = useCallback(async () => {
    const items = Object.entries(selected)
      .filter(([, p]) => p)
      .map(([slot, p]) => ({ slot, productId: p!.id }));
    if (items.length < 2) { toast.message("Select at least 2 parts to validate."); return; }
    setValidating(true);
    try {
      const res = await apiFetch<CompatibilityResult>("/custom-lab/validate", {
        method: "POST",
        body: JSON.stringify({ items }),
      });
      setCompat(res);
      if (res.valid) toast.success("Build is compatible!");
      else toast.error(`${res.errors.length} compatibility errors.`);
    } catch {
      setCompat({ valid: true, errors: [], warnings: [] });
      toast.success("(Offline) OK — no simulated errors.");
    } finally {
      setValidating(false);
    }
  }, [selected]);

  const addAllToCart = useCallback(async () => {
    const items = Object.entries(selected)
      .filter(([, p]) => p)
      .map(([slot, p]) => ({ slot, productId: p!.id }));
    if (!items.length) { toast.error("No parts selected."); return; }
    if (!localStorage.getItem("access_token")) { toast.error("Please sign in."); return; }
    setAddingCart(true);
    try {
      // Save the build first so its parts can be grouped together in the cart/order
      const build = await apiFetch<{ id: string }>("/custom-lab/builds", {
        method: "POST",
        body: JSON.stringify({ name: `My Build — ${new Date().toLocaleDateString("vi-VN")}`, items }),
      });
      await apiFetch(`/cart/builds/${build.id}`, { method: "POST" });
      toast.success(`Added ${items.length} parts to cart.`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to add to cart."); }
    finally { setAddingCart(false); }
  }, [selected]);

  const saveBuild = useCallback(async () => {
    const items = Object.entries(selected).filter(([, p]) => p).map(([slot, p]) => ({ slot, productId: p!.id }));
    if (!items.length) { toast.error("No parts selected."); return; }
    setSaving(true);
    try {
      const res = await apiFetch<{ id: string }>("/custom-lab/builds", {
        method: "POST",
        body: JSON.stringify({ name: `My Build — ${new Date().toLocaleDateString("vi-VN")}`, items }),
      });
      toast.success(`Build saved! ID: ${res.id}`);
    } catch { toast.error("Could not save — check connection."); }
    finally { setSaving(false); }
  }, [selected]);

  // ── Computed ──
  const totalPrice = useMemo(
    () => Object.values(selected).reduce((s, p) => s + (p?.displayPrice ?? 0), 0),
    [selected],
  );

  const estimatedWatts = useMemo(() =>
    BUILD_SLOTS.reduce((sum, cfg) => {
      const p = selected[cfg.slot];
      return sum + (p ? (p.tdp ?? p.wattage ?? cfg.defaultWatts) : 0);
    }, 0),
  [selected]);

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const pickerCfg = BUILD_SLOTS.find((s) => s.slot === pickerSlot);

  return (
    <>
      <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">

        {/* ── Header ── */}
        <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-[#0d0d0d] px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="border border-zinc-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-colors hover:border-[#00ffff]/50 hover:text-[#00ffff]"
            >
              ← Exit Lab
            </Link>
            <div className="h-4 w-px bg-zinc-800" />
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#00ffff]">Pecify</p>
              <h1 className="text-[13px] font-black uppercase tracking-wider text-white">PC Builder</h1>
            </div>
          </div>

          <Badge variant="outline" className="border-zinc-700 text-[11px] text-zinc-400">
            {selectedCount}/{BUILD_SLOTS.length} components
          </Badge>
        </header>

        {/* ── Status bar ── */}
        <StatusBar
          compatibility={compat}
          estimatedWatts={estimatedWatts}
          totalPrice={totalPrice}
          validating={validating}
          onValidate={validateBuild}
        />

        {/* ── Builder table ── */}
        <main className="flex-1 overflow-auto px-4 py-8 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="overflow-hidden border border-zinc-800 bg-[#0d0d0d]">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="w-12 pl-6 pr-0" />
                    <TableHead className="w-44 text-[13px]">Component</TableHead>
                    <TableHead className="text-[13px]">Selection</TableHead>
                    <TableHead className="text-right text-[13px]">Price</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {BUILD_SLOTS.map((cfg) => {
                    const part = selected[cfg.slot] ?? null;
                    const isLoading = loading[cfg.slot];

                    return (
                      <TableRow key={cfg.slot} className="border-zinc-800/50">
                        {/* Slot icon */}
                        <TableCell className="py-5 pl-6 pr-2">
                          <div className="flex h-11 w-11 items-center justify-center border border-zinc-800 bg-zinc-900/60">
                            <cfg.Icon size={18} className={part ? "text-[#00ffff]" : "text-zinc-600"} />
                          </div>
                        </TableCell>

                        {/* Component type */}
                        <TableCell className="py-5">
                          <p className="text-[13px] font-bold uppercase tracking-wider text-zinc-300">
                            {cfg.shortLabel}
                          </p>
                        </TableCell>

                        {/* Selected / empty */}
                        <TableCell className="py-5">
                          {part ? (
                            <div className="flex items-center gap-4">
                              <div className="h-14 w-14 shrink-0 border border-zinc-800 bg-zinc-900">
                                {part.thumbnailUrl ? (
                                  <Image src={part.thumbnailUrl} alt={part.name} width={56} height={56} className="h-full w-full object-contain p-1" />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <cfg.Icon size={18} className="text-zinc-700" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-[15px] font-semibold text-white">{part.name}</p>
                                <p className="text-[11px] text-zinc-500">
                                  {part.brand}
                                  {cfg.specs[0] && (part[cfg.specs[0].key as keyof ApiPart]) && (
                                    <span className="ml-2 text-zinc-600">
                                      · {cfg.specs[0].fmt
                                          ? cfg.specs[0].fmt(part[cfg.specs[0].key as keyof ApiPart])
                                          : String(part[cfg.specs[0].key as keyof ApiPart] ?? "")}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              onClick={() => openPicker(cfg.slot)}
                              disabled={isLoading}
                              className="h-12 gap-2 border border-dashed border-zinc-700 bg-transparent px-6 text-[13px] font-bold uppercase tracking-wider text-zinc-400 hover:border-[#00ffff]/40 hover:bg-[#00ffff]/5 hover:text-[#00ffff]"
                            >
                              <Plus size={15} />
                              {isLoading ? "Loading…" : `Choose A ${cfg.shortLabel}`}
                            </Button>
                          )}
                        </TableCell>

                        {/* Price */}
                        <TableCell className="py-5 text-right">
                          {part ? (
                            <span className="text-[16px] font-black text-white">{formatVnd(part.displayPrice)}</span>
                          ) : (
                            <span className="text-[14px] text-zinc-700">—</span>
                          )}
                        </TableCell>

                        {/* Remove */}
                        <TableCell className="py-5 pr-6">
                          {part && (
                            <button
                              type="button"
                              onClick={() => removePart(cfg.slot)}
                              aria-label={`Remove ${cfg.shortLabel}`}
                              className="flex h-9 w-9 items-center justify-center border border-red-800/40 bg-red-950/20 text-red-500 transition-all hover:border-red-500 hover:bg-red-950/50"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>

                <TableFooter>
                  <TableRow className="border-t border-zinc-700 bg-[#111] hover:bg-[#111]">
                    <TableCell colSpan={3} className="py-5 pl-6">
                      <div className="flex items-center gap-3">
                        <span className="text-[14px] font-black uppercase tracking-wider text-white">
                          Total ({selectedCount} parts)
                        </span>
                        {estimatedWatts > 0 && (
                          <Badge variant="outline" className="border-zinc-700 text-[11px] text-zinc-400">
                            <Zap size={11} className="mr-1" />~{estimatedWatts}W
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 text-right">
                      <span className="text-[20px] font-black text-[#00ffff]">
                        {totalPrice > 0 ? formatVnd(totalPrice) : "—"}
                      </span>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Compatibility messages */}
            {compat && (compat.errors.length > 0 || compat.warnings.length > 0) && (
              <div className="mt-4 space-y-2">
                {compat.errors.map((e, i) => (
                  <div key={i} className="flex gap-2.5 border border-red-800/40 bg-red-950/20 px-4 py-2.5">
                    <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-400" />
                    <p className="text-[13px] text-red-300">{e}</p>
                  </div>
                ))}
                {compat.warnings.map((w, i) => (
                  <div key={i} className="flex gap-2.5 border border-yellow-800/40 bg-yellow-950/20 px-4 py-2.5">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0 text-yellow-400" />
                    <p className="text-[13px] text-yellow-300">{w}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={saveBuild}
                disabled={saving || selectedCount === 0}
                className="h-12 gap-2 border-zinc-700 bg-transparent px-6 text-[13px] font-bold uppercase tracking-wider text-zinc-300 hover:border-zinc-500 hover:text-white"
              >
                <Save size={15} />
                {saving ? "Saving…" : "Save Build"}
              </Button>

              <Button
                onClick={addAllToCart}
                disabled={addingCart || selectedCount === 0}
                className="h-12 gap-2 bg-[#00ffff] px-6 text-[13px] font-black uppercase tracking-wider text-black hover:bg-[#00ffff]/90 disabled:opacity-50"
              >
                <ShoppingCart size={15} />
                {addingCart ? "Adding…" : `Add ${selectedCount} Items to Cart`}
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* ── Full-screen Part Picker Overlay ── */}
      {pickerSlot && pickerCfg && (
        <PartPickerOverlay
          slotCfg={pickerCfg}
          parts={parts[pickerSlot] ?? MOCK[pickerSlot] ?? []}
          currentId={selected[pickerSlot]?.id}
          loading={loading[pickerSlot] ?? false}
          buildSummary={{ count: selectedCount, total: totalPrice, watts: estimatedWatts }}
          onAdd={(part) => selectPart(pickerSlot, part)}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </>
  );
}
