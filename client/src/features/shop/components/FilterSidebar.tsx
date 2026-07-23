"use client";

import Link from "next/link";

import { CATEGORY_NAV } from "@/lib/category-nav";
import { useFilterSidebar } from "../hooks/useFilterSidebar";
import type { SubTypeFilter } from "../types";

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

export function FilterSidebar() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { pathname, subTypeFilter, activeSubType } = useFilterSidebar(SUB_TYPE_FILTERS);

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
    </aside>
  );
}
