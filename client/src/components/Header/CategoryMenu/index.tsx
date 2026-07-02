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

// ─── Types ────────────────────────────────────────────────────────────
type NavLink = { label: string; href: string };
type NavColumn = { title: string; links: NavLink[] };
type NavSection = {
  key: string;
  label: string;
  href: string;
  image: string;   // full URL to /media/:folder/:file
  columns: NavColumn[];
};

// ─── Static navigation (always visible) ───────────────────────────────
const NAV: NavSection[] = [
  {
    key: "PCS_LAPTOPS",
    label: "PCs & Laptops",
    href: "/shop/pcs",
    image: cdn("PCs", "h7-flow-rgb-hero-white.png"),
    columns: [
      {
        title: "PREBUILT PCS",
        links: [
          { label: "PC Gaming Esport", href: "/shop/pcs" },
          { label: "PC Workstation", href: "/shop/pcs" },
          { label: "PC Mini (SFF)", href: "/shop/pcs" },
        ],
      },
      {
        title: "LAPTOP",
        links: [
          { label: "Gaming Laptops", href: "/shop/laptops/laptops" },
          { label: "Office Laptops", href: "/shop/laptops/laptops" },
          { label: "Laptop Accessories", href: "/shop/laptops/accessories" },
        ],
      },
    ],
  },
  {
    key: "COMPONENTS",
    label: "PC Components",
    href: "/shop/components/processors",
    image: cdn("gpu", "nvidia_rtx-4090-fe.png"),
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
        title: "STORAGE & POWER",
        links: [
          { label: "NVMe SSD", href: "/shop/components/storage" },
          { label: "HDD Storage", href: "/shop/components/storage" },
          { label: "PSU Power Supply", href: "/shop/components/power-supplies" },
          { label: "PC Cases", href: "/shop/components/pc-cases" },
        ],
      },
      {
        title: "COOLING",
        links: [
          { label: "AIO Liquid Coolers", href: "/shop/components/cpu-coolers" },
          { label: "CPU Air Coolers", href: "/shop/components/cpu-coolers" },
          { label: "Case Fans", href: "/shop/components/case-fans" },
        ],
      },
    ],
  },
  {
    key: "GEAR",
    label: "Gear & Peripherals",
    href: "/shop/gaming-gear/mechanical-keyboards",
    image: cdn("keyboard", "MAKR75_Hero_Shot_Front.png"),
    columns: [
      {
        title: "INPUT DEVICES",
        links: [
          { label: "Mechanical Keyboards", href: "/shop/gaming-gear/mechanical-keyboards" },
          { label: "Gaming Mice", href: "/shop/gaming-gear/gaming-mice" },
          { label: "Mousepads", href: "/shop/gaming-gear/gaming-mice" },
        ],
      },
      {
        title: "AUDIO & DISPLAY",
        links: [
          { label: "Gaming Headsets", href: "/shop/gaming-gear/gaming-headsets" },
          { label: "Gaming Speakers", href: "/shop/gaming-gear/gaming-headsets" },
          { label: "Gaming Monitors", href: "/shop/gaming-gear/gaming-monitors" },
        ],
      },
    ],
  },
  {
    key: "BUNDLES",
    label: "Bundles",
    href: "/shop/components/pc-cases",
    image: cdn("case", "Etail_H3Flow_WH_Carousel_Hero_EN.png"),
    columns: [
      {
        title: "BY THEME",
        links: [
          { label: "White Theme Setup", href: "/shop/components/pc-cases" },
          { label: "Minimalist Setup", href: "/shop/components/pc-cases" },
          { label: "RGB Gaming Setup", href: "/shop/components/ram" },
        ],
      },
      {
        title: "BRAND ECOSYSTEMS",
        links: [
          { label: "Corsair iCUE", href: "/shop/components/ram" },
          { label: "ROG Aura Sync", href: "/shop/components/motherboards" },
          { label: "Logitech G Series", href: "/shop/gaming-gear/mechanical-keyboards" },
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
        title: "GAMING CHAIRS",
        links: [
          { label: "Ergonomic Chairs", href: "/shop/gaming-furniture" },
          { label: "Racing Style Chairs", href: "/shop/gaming-furniture" },
          { label: "Pro Gaming Chairs", href: "/shop/gaming-furniture" },
        ],
      },
      {
        title: "DESKS & ACCESSORIES",
        links: [
          { label: "Standing Desks", href: "/shop/gaming-furniture" },
          { label: "Fixed Gaming Desks", href: "/shop/gaming-furniture" },
          { label: "Monitor Arms", href: "/shop/gaming-furniture" },
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
        className="group/l flex items-center justify-between gap-3 py-1.5 text-ui text-secondary transition-colors hover:text-fg"
      >
        <span className="flex items-center gap-2">
          <span className="h-px w-3 shrink-0 bg-zinc-600 transition-all duration-200 group-hover/l:w-4 group-hover/l:bg-brand" />
          {label}
        </span>
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
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-[#0a0a0a]/20 to-[#0a0a0a]" />
            {/* Bottom info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-[#0a0a0a] to-transparent px-6 py-5">
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
