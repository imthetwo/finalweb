"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

import { formatVnd } from "@/lib/format";
import { CATEGORY_NAV } from "@/lib/category-nav";

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
