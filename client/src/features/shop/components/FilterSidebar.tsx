"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

import { formatVnd } from "@/lib/format";
import { CATEGORY_NAV } from "@/lib/category-nav";

// Sub-type filters — a small in-page selector shown only while browsing the
// matching category, mirroring the corresponding header mega-menu links and
// getShopPage's query-param handling. Each one uses a real DB field
// (PcBuildSpec.buildType / StorageSpec.storageType / CoolerSpec.coolerType /
// FurnitureSpec.furnitureType), never a fake/decorative split.
type SubTypeOption = { label: string; value?: string };
type SubTypeFilter = {
  matchPath: string;
  basePath: string;
  title: string;
  param: string;
  options: SubTypeOption[];
};

const SUB_TYPE_FILTERS: SubTypeFilter[] = [
  {
    matchPath: "/shop/pcs",
    basePath: "/shop/pcs",
    title: "PC Build Type",
    param: "type",
    options: [
      { label: "All Prebuilt PCs" },
      { label: "PC Gaming Esport", value: "gaming-esport" },
      { label: "PC Workstation", value: "workstation" },
      { label: "PC Mini (SFF)", value: "mini-sff" },
    ],
  },
  {
    matchPath: "/shop/components/storage",
    basePath: "/shop/components/storage",
    title: "Storage Type",
    param: "storageType",
    options: [
      { label: "All Storage" },
      { label: "NVMe SSD", value: "NVMe" },
      { label: "SATA SSD", value: "SSD" },
      { label: "HDD", value: "HDD" },
    ],
  },
  {
    matchPath: "/shop/components/cpu-coolers",
    basePath: "/shop/components/cpu-coolers",
    title: "Cooler Type",
    param: "coolerType",
    options: [
      { label: "All Coolers" },
      { label: "AIO Liquid Coolers", value: "AIO" },
      { label: "CPU Air Coolers", value: "Air" },
    ],
  },
  {
    matchPath: "/shop/gaming-furniture",
    basePath: "/shop/gaming-furniture",
    title: "Furniture Type",
    param: "furnitureType",
    options: [
      { label: "All Furniture" },
      { label: "Gaming Chairs", value: "CHAIR" },
      { label: "Gaming Desks", value: "DESK" },
    ],
  },
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
        className="flex w-full items-center justify-between text-sm font-bold uppercase tracking-wider text-fg"
      >
        {title}
        <ChevronDown size={14} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

type Props = {
  maxPrice: number | null;
  priceMax: number;
  onMaxPriceChange: (v: number | null) => void;
};

export function FilterSidebar({ maxPrice, priceMax, onMaxPriceChange }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const subTypeFilter = SUB_TYPE_FILTERS.find((f) => pathname.startsWith(f.matchPath));
  const activeSubType = subTypeFilter ? searchParams.get(subTypeFilter.param) : null;

  return (
    <aside className="w-full shrink-0 lg:w-64">
      {/* Categories */}
      <div className="pb-3">
        <p className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">Categories</p>
        <nav className="flex flex-col gap-1.5">
          {CATEGORY_NAV.map((c) => {
            const active = c.href === "/shop"
              ? pathname === "/shop"
              : pathname.startsWith(c.href);
            return (
              <Link
                key={c.href}
                href={c.href}
                className={`text-body transition-colors ${
                  active ? "font-bold text-brand" : "text-secondary hover:text-fg"
                }`}
              >
                {active ? "▸ " : ""}{c.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sub-type filter — only relevant on the matching category page */}
      {subTypeFilter && (
        <div className="border-t border-edge py-3">
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">{subTypeFilter.title}</p>
          <nav className="flex flex-col gap-1.5">
            {subTypeFilter.options.map(({ label, value }) => {
              const active = (value ?? null) === activeSubType;
              const href = value ? `${subTypeFilter.basePath}?${subTypeFilter.param}=${value}` : subTypeFilter.basePath;
              return (
                <Link
                  key={label}
                  href={href}
                  className={`text-body transition-colors ${
                    active ? "font-bold text-brand" : "text-secondary hover:text-fg"
                  }`}
                >
                  {active ? "▸ " : ""}{label}
                </Link>
              );
            })}
          </nav>
        </div>
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
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>0₫</span>
            <span className="font-bold text-secondary">≤ {formatVnd(maxPrice ?? priceMax)}</span>
          </div>
          {maxPrice !== null && (
            <button
              type="button"
              onClick={() => onMaxPriceChange(null)}
              className="mt-2 text-xs text-subtle underline hover:text-secondary"
            >
              Reset
            </button>
          )}
        </CollapsibleFilter>
      )}
    </aside>
  );
}
