"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

import { formatVnd } from "@/lib/format";

const CATEGORY_NAV = [
  { label: "All Products",   href: "/shop" },
  { label: "Gaming PCs",     href: "/pcs" },
  { label: "Laptops",        href: "/laptops/laptops" },
  { label: "Processors (CPU)", href: "/components/processors" },
  { label: "Graphics Cards", href: "/components/gpu" },
  { label: "Motherboards",   href: "/components/motherboards" },
  { label: "Memory (RAM)",   href: "/components/ram" },
  { label: "Storage",        href: "/components/storage" },
  { label: "Power Supplies", href: "/components/power-supplies" },
  { label: "CPU Coolers",    href: "/components/cpu-coolers" },
  { label: "Case Fans",      href: "/components/case-fans" },
  { label: "PC Cases",       href: "/components/pc-cases" },
  { label: "Keyboards",      href: "/gaming-gear/mechanical-keyboards" },
  { label: "Gaming Mice",    href: "/gaming-gear/gaming-mice" },
  { label: "Headsets",       href: "/gaming-gear/gaming-headsets" },
  { label: "Monitors",       href: "/gaming-gear/gaming-monitors" },
  { label: "Furniture",      href: "/gaming-furniture" },
];

function CollapsibleFilter({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-edge py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-[12px] font-bold uppercase tracking-wider text-fg"
      >
        {title}
        <ChevronDown size={14} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

type Props = {
  inStockOnly: boolean;
  specialOnly: boolean;
  brands: Set<string>;
  maxPrice: number | null;
  allBrands: string[];
  priceMax: number;
  inStockCount: number;
  specialCount: number;
  onInStockChange: (v: boolean) => void;
  onSpecialChange: (v: boolean) => void;
  onBrandToggle: (b: string) => void;
  onMaxPriceChange: (v: number | null) => void;
};

export function FilterSidebar({
  inStockOnly, specialOnly, brands, maxPrice,
  allBrands, priceMax, inStockCount, specialCount,
  onInStockChange, onSpecialChange, onBrandToggle, onMaxPriceChange,
}: Props) {
  const pathname = usePathname();
  const checkbox = "h-3.5 w-3.5 accent-brand";

  return (
    <aside className="w-full shrink-0 lg:w-64">
      {/* Categories */}
      <div className="pb-3">
        <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-muted">Categories</p>
        <nav className="flex flex-col gap-1.5">
          {CATEGORY_NAV.map((c) => {
            const active = c.href === "/shop"
              ? pathname === "/shop"
              : pathname.startsWith(c.href);
            return (
              <Link
                key={c.href}
                href={c.href}
                className={`text-[13px] transition-colors ${
                  active ? "font-bold text-brand" : "text-secondary hover:text-fg"
                }`}
              >
                {active ? "▸ " : ""}{c.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Availability */}
      <CollapsibleFilter title="Features & Availability" defaultOpen>
        <label className="mb-2 flex cursor-pointer items-center gap-2 text-[13px] text-secondary">
          <input type="checkbox" className={checkbox} checked={inStockOnly} onChange={(e) => onInStockChange(e.target.checked)} />
          Show In Stock Only <span className="text-subtle">({inStockCount})</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-secondary">
          <input type="checkbox" className={checkbox} checked={specialOnly} onChange={(e) => onSpecialChange(e.target.checked)} />
          Special Price <span className="text-subtle">({specialCount})</span>
        </label>
      </CollapsibleFilter>

      {/* Brand */}
      {allBrands.length > 1 && (
        <CollapsibleFilter title="Brand" defaultOpen>
          <div className="flex flex-col gap-2">
            {allBrands.map((b) => (
              <label key={b} className="flex cursor-pointer items-center gap-2 text-[13px] text-secondary">
                <input type="checkbox" className={checkbox} checked={brands.has(b)} onChange={() => onBrandToggle(b)} />
                {b}
              </label>
            ))}
          </div>
        </CollapsibleFilter>
      )}

      {/* Price */}
      {priceMax > 0 && (
        <CollapsibleFilter title="Price Range" defaultOpen>
          <input
            type="range"
            min={0}
            max={priceMax}
            step={100000}
            value={maxPrice ?? priceMax}
            onChange={(e) => onMaxPriceChange(Number(e.target.value))}
            className="w-full accent-brand"
          />
          <div className="mt-2 flex justify-between text-[11px] text-muted">
            <span>0₫</span>
            <span className="font-bold text-secondary">≤ {formatVnd(maxPrice ?? priceMax)}</span>
          </div>
          {maxPrice !== null && (
            <button
              type="button"
              onClick={() => onMaxPriceChange(null)}
              className="mt-2 text-[11px] text-subtle underline hover:text-secondary"
            >
              Reset
            </button>
          )}
        </CollapsibleFilter>
      )}
    </aside>
  );
}
