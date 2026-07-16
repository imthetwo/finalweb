"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../../ui/navigation-menu";
import { cdn } from "@/lib/cloudinary";
import type { NavSection } from "../types";

// ─── Static navigation (always visible) ───────────────────────────────
const NAV: NavSection[] = [
  {
    key: "PCS_LAPTOPS",
    label: "PCs & Laptops",
    href: "/shop/pcs",
    image: cdn("PCs", "h7-flow-rgb-hero-white.png"),
    columns: [
      {
        // Each link filters by the product's real buildType (PcBuildSpec) —
        // no more all-3-links-go-to-the-same-place. Workstation currently has
        // 0 real products (none tagged yet) so it shows an honest empty state
        // rather than a fake/duplicate list.
        title: "PREBUILT PCS",
        links: [
          { label: "PC Gaming Esport", href: "/shop/pcs?type=gaming-esport" },
          { label: "PC Workstation", href: "/shop/pcs?type=workstation" },
          { label: "PC Mini (SFF)", href: "/shop/pcs?type=mini-sff" },
        ],
      },
      {
        // Every current laptop in the catalog is a gaming build (Predator/Nitro/
        // TUF Gaming) — there's no real "Office Laptops" data yet and no
        // "Laptop Accessories" category exists, so those were dropped instead
        // of linking to fake/empty results.
        title: "LAPTOP",
        links: [
          { label: "Gaming Laptops", href: "/shop/laptops/laptops" },
        ],
      },
    ],
  },
  {
    key: "COMPONENTS",
    label: "PC Components",
    href: "/shop/components/processors",
    image: cdn("gpu", "4090_iCHILL_BLACK_set_v2.png"),
    columns: [
      {
        title: "CORE PERFORMANCE",
        links: [
          { label: "CPU (Processors)", href: "/shop/components/processors" },
          { label: "VGA (Graphics Cards)", href: "/shop/components/gpu" },
          { label: "Mainboard", href: "/shop/components/motherboards" },
          { label: "RAM", href: "/shop/components/ram" },
        ],
      },
      {
        // NVMe vs HDD now filters by the real StorageSpec.storageType field
        // instead of both links showing the same unfiltered list.
        title: "STORAGE & POWER",
        links: [
          { label: "NVMe SSD", href: "/shop/components/storage?storageType=NVMe" },
          { label: "HDD Storage", href: "/shop/components/storage?storageType=HDD" },
          { label: "PSU Power Supply", href: "/shop/components/power-supplies" },
          { label: "PC Cases", href: "/shop/components/pc-cases" },
        ],
      },
      {
        // AIO vs Air now filters by the real CoolerSpec.coolerType field.
        title: "COOLING",
        links: [
          { label: "AIO Liquid Coolers", href: "/shop/components/cpu-coolers?coolerType=AIO" },
          { label: "CPU Air Coolers", href: "/shop/components/cpu-coolers?coolerType=Air" },
          { label: "Case Fans", href: "/shop/components/case-fans" },
        ],
      },
    ],
  },
  {
    key: "GEAR",
    label: "Gear & Peripherals",
    href: "/shop/gaming-gear/mechanical-keyboards",
    image: cdn("keyboard", "pro-x-tkl-rapid-black-gallery-1-us.png"),
    columns: [
      {
        // "Mousepads" was dropped — no such category exists yet (it was
        // silently reusing the Gaming Mice link/href, mislabeled).
        title: "INPUT DEVICES",
        links: [
          { label: "Mechanical Keyboards", href: "/shop/gaming-gear/mechanical-keyboards" },
          { label: "Gaming Mice", href: "/shop/gaming-gear/gaming-mice" },
        ],
      },
      {
        // "Gaming Speakers" was dropped — no such category exists yet (it was
        // silently reusing the Gaming Headsets link/href, mislabeled).
        title: "AUDIO & DISPLAY",
        links: [
          { label: "Gaming Headsets", href: "/shop/gaming-gear/gaming-headsets" },
          { label: "Gaming Monitors", href: "/shop/gaming-gear/gaming-monitors" },
        ],
      },
    ],
  },
  {
    key: "FURNITURE",
    label: "Furniture",
    href: "/shop/gaming-furniture",
    // Cloudinary: TechStore/funiture/ (folder typo intentional — matches upload)
    image: cdn("funiture", "ChairPro.webp"),
    columns: [
      {
        // Chairs vs Desks now filters by the real FurnitureSpec.furnitureType
        // field — the previous 3-way "Ergonomic/Racing Style/Pro Gaming" split
        // had no backing data (all 3 pointed at the same unfiltered list).
        title: "GAMING CHAIRS",
        links: [
          { label: "Gaming Chairs", href: "/shop/gaming-furniture?furnitureType=CHAIR" },
        ],
      },
      {
        // "Monitor Arms" was dropped — no such product exists yet.
        title: "DESKS",
        links: [
          { label: "Gaming Desks", href: "/shop/gaming-furniture?furnitureType=DESK" },
        ],
      },
    ],
  },
];


// ─── Trigger class ─────────────────────────────────────────────────────
const TRIGGER_CLS =
  "relative bg-transparent px-3 py-2 text-body font-bold uppercase tracking-wide text-fg transition-colors hover:bg-transparent hover:text-brand focus:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-brand after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-0 after:-translate-x-1/2 after:bg-brand after:transition-all after:duration-300 hover:after:w-3/4 data-[state=open]:after:w-3/4";

// ─── Link item ─────────────────────────────────────────────────────────
function MegaLink({ label, href }: { label: string; href: string }) {
  return (
    <NavigationMenuLink asChild>
      <Link
        href={href}
        className="flex items-center justify-between gap-3 py-1.5 text-ui text-secondary transition-colors hover:text-fg"
      >
        {label}
      </Link>
    </NavigationMenuLink>
  );
}

// ─── Standard mega menu: hero image left + columns right ──────────────
function StandardMegaMenu({ section }: { section: NavSection }) {
  return (
    <NavigationMenuContent className="w-full">
      <div className="w-screen border-b border-edge/80 bg-base">
        <div className="mx-auto flex max-w-350" style={{ minHeight: "240px" }}>

          {/* ── Hero image ── */}
          <div className="relative hidden w-64 shrink-0 overflow-hidden lg:block" style={{ minHeight: "240px" }}>
            {/* Use plain <img> — avoids Next.js Image fill height issue */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={section.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center opacity-75"
            />
            {/* Right fade overlay so image blends into dark bg */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-base/20 to-base" />
            {/* Bottom info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-base to-transparent px-6 py-5">
              <p className="text-3xs font-black uppercase tracking-[0.35em] text-brand">
                Pecify Store
              </p>
              <p className="mt-1 text-base font-black uppercase text-fg">
                {section.label}
              </p>
              <Link
                href={section.href}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand transition-all hover:gap-3"
              >
                View all <ArrowRight size={10} />
              </Link>
            </div>
          </div>

          {/* ── Link columns ── */}
          <div className="flex flex-1 items-start gap-12 px-10 py-8">
            {section.columns.map((col) => (
              <div key={col.title} className="flex-1">
                <p className="mb-4 text-2xs font-black uppercase tracking-[0.28em] text-brand">
                  {col.title}
                </p>
                <div className="flex flex-col gap-0.5">
                  {col.links.map((link) => (
                    <MegaLink
                      key={link.href + link.label}
                      label={link.label}
                      href={link.href}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </NavigationMenuContent>
  );
}


// ─── Root export ───────────────────────────────────────────────────────
export default function CategoryMenu() {
  return (
    <NavigationMenu className="w-full max-w-none justify-center">
      <NavigationMenuList className="flex flex-row items-center gap-1 xl:gap-3">
        {NAV.map((section) => (
          <NavigationMenuItem key={section.key}>
            <NavigationMenuTrigger className={TRIGGER_CLS}>
              {section.label}
            </NavigationMenuTrigger>

            <StandardMegaMenu section={section} />
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
