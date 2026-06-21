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
    href: "/pcs",
    image: cdn("PCs", "h7-flow-rgb-hero-white.png"),
    columns: [
      {
        title: "PREBUILT PCS",
        links: [
          { label: "PC Gaming Esport", href: "/pcs" },
          { label: "PC Workstation", href: "/pcs" },
          { label: "PC Mini (SFF)", href: "/pcs" },
        ],
      },
      {
        title: "LAPTOP",
        links: [
          { label: "Gaming Laptops", href: "/laptops" },
          { label: "Office Laptops", href: "/laptops" },
          { label: "Laptop Accessories", href: "/laptops/accessories" },
        ],
      },
    ],
  },
  {
    key: "COMPONENTS",
    label: "PC Components",
    href: "/components/processors",
    image: cdn("gpu", "nvidia_rtx-4090-fe.png"),
    columns: [
      {
        title: "CORE PERFORMANCE",
        links: [
          { label: "CPU (Processors)", href: "/components/processors" },
          { label: "VGA (Graphics Cards)", href: "/components/graphics-cards" },
          { label: "Mainboard", href: "/components/motherboards" },
          { label: "RAM", href: "/components/memory-storage/ram" },
        ],
      },
      {
        title: "STORAGE & POWER",
        links: [
          { label: "NVMe SSD", href: "/components/memory-storage/nvme-ssds" },
          { label: "HDD Storage", href: "/components/memory-storage/hdd" },
          { label: "PSU Power Supply", href: "/components/power-cooling/psu" },
          { label: "PC Cases", href: "/components/chassis-modding/pc-cases" },
        ],
      },
      {
        title: "COOLING",
        links: [
          { label: "AIO Liquid Coolers", href: "/components/power-cooling/aio-liquid-coolers" },
          { label: "CPU Air Coolers", href: "/components/power-cooling/air-coolers" },
          { label: "Case Fans", href: "/components/power-cooling/case-fans" },
        ],
      },
    ],
  },
  {
    key: "GEAR",
    label: "Gear & Peripherals",
    href: "/gaming-gear/input-devices/mechanical-keyboards",
    image: cdn("keyboard", "MAKR75_Hero_Shot_Front.png"),
    columns: [
      {
        title: "INPUT DEVICES",
        links: [
          { label: "Mechanical Keyboards", href: "/gaming-gear/input-devices/mechanical-keyboards" },
          { label: "Gaming Mice", href: "/gaming-gear/input-devices/wireless-mice" },
          { label: "Mousepads", href: "/gaming-gear/surfaces-atmosphere/premium-mousepads" },
        ],
      },
      {
        title: "AUDIO & DISPLAY",
        links: [
          { label: "Gaming Headsets", href: "/gaming-gear/audio/gaming-headsets" },
          { label: "Gaming Speakers", href: "/gaming-gear/audio/in-ear-monitors" },
          { label: "Gaming Monitors", href: "/gaming-gear/audio/gaming-headsets" },
        ],
      },
    ],
  },
  {
    key: "BUNDLES",
    label: "Bundles",
    href: "/components/chassis-modding/pc-cases",
    image: cdn("case", "Etail_H3Flow_WH_Carousel_Hero_EN.png"),
    columns: [
      {
        title: "BY THEME",
        links: [
          { label: "White Theme Setup", href: "/components/chassis-modding/pc-cases" },
          { label: "Minimalist Setup", href: "/components/chassis-modding/pc-cases" },
          { label: "RGB Gaming Setup", href: "/components/memory-storage/ram" },
        ],
      },
      {
        title: "BRAND ECOSYSTEMS",
        links: [
          { label: "Corsair iCUE", href: "/components/memory-storage/ram" },
          { label: "ROG Aura Sync", href: "/components/motherboards" },
          { label: "Logitech G Series", href: "/gaming-gear/input-devices/mechanical-keyboards" },
        ],
      },
    ],
  },
  {
    key: "FURNITURE",
    label: "Furniture",
    href: "/gaming-furniture/seating/ergonomic-chairs",
    // Cloudinary: TechStore/funiture/ (folder typo intentional — matches upload)
    image: cdn("funiture", "ChairPro.webp"),
    columns: [
      {
        title: "GAMING CHAIRS",
        links: [
          { label: "Ergonomic Chairs", href: "/gaming-furniture/seating/ergonomic-chairs" },
          { label: "Racing Style Chairs", href: "/gaming-furniture/seating/racing-style-chairs" },
          { label: "Pro Gaming Chairs", href: "/gaming-furniture/seating/ergonomic-chairs" },
        ],
      },
      {
        title: "DESKS & ACCESSORIES",
        links: [
          { label: "Standing Desks", href: "/gaming-furniture/desks/motorized-standing-desks" },
          { label: "Fixed Gaming Desks", href: "/gaming-furniture/desks/fixed-gaming-desks" },
          { label: "Monitor Arms", href: "/gaming-furniture/mounts-arms/monitor-arms" },
        ],
      },
    ],
  },
];


// ─── Trigger class ─────────────────────────────────────────────────────
const TRIGGER_CLS =
  "relative bg-transparent px-3 py-2 text-[13px] font-bold uppercase tracking-wide text-zinc-200 transition-colors hover:bg-transparent hover:text-white focus:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-white after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-0 after:-translate-x-1/2 after:bg-[#00ffff] after:transition-all after:duration-300 hover:after:w-3/4 data-[state=open]:after:w-3/4";

// ─── Link item ─────────────────────────────────────────────────────────
function MegaLink({ label, href }: { label: string; href: string }) {
  return (
    <NavigationMenuLink asChild>
      <Link
        href={href}
        className="group/l flex items-center justify-between gap-3 py-1.5 text-[13px] text-zinc-300 transition-colors hover:text-white"
      >
        <span className="flex items-center gap-2">
          <span className="h-px w-3 shrink-0 bg-zinc-600 transition-all duration-200 group-hover/l:w-4 group-hover/l:bg-[#00ffff]" />
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
      <div className="w-screen border-b border-zinc-800/80 bg-[#0a0a0a]">
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
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#00ffff]">
                Pecify Store
              </p>
              <p className="mt-1 text-base font-black uppercase text-white">
                {section.label}
              </p>
              <Link
                href={section.href}
                className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#00ffff] transition-all hover:gap-3"
              >
                View all <ArrowRight size={10} />
              </Link>
            </div>
          </div>

          {/* ── Link columns ── */}
          <div className="flex flex-1 items-start gap-12 px-10 py-8">
            {section.columns.map((col) => (
              <div key={col.title} className="flex-1">
                <p className="mb-4 text-[10px] font-black uppercase tracking-[0.28em] text-[#00ffff]">
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
