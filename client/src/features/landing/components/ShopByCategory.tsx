import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cdn } from "@/lib/cloudinary";

// key must match the category name in the DB exactly — image verified HTTP 200 on Cloudinary
const CATEGORIES = [
  {
    key: "Processors (CPU)",
    label: "Processors",
    href: "/shop/components/processors",
    img: cdn("cpu", "cpu-intel-core-ultra-9-285k-up-to-5-7ghz-20-cores-20-threads-36mb-01.jpg"),
  },
  {
    key: "Graphics Cards (GPU)",
    label: "Graphics Cards",
    href: "/shop/components/gpu",
    img: cdn("gpu", "asus-rog-strix-rtx4080-super"),
  },
  {
    key: "Motherboards",
    label: "Motherboards",
    href: "/shop/components/motherboards",
    img: cdn("motherboard", "47874.png"),
  },
  {
    key: "RAM",
    label: "Memory",
    href: "/shop/components/ram",
    img: cdn("memory", "corsair-dominator-titanium-ddr5"),
  },
  {
    key: "Storage (SSD/HDD)",
    label: "Storage",
    href: "/shop/components/storage",
    img: cdn("memory", "30120.png"),
  },
  {
    key: "PC Cases",
    label: "Cases",
    href: "/shop/components/pc-cases",
    img: cdn("case", "Case_H9_Flow_RGB__WH_Carousel_Hero_EN_d5c60367-c559-4b2e-9fc1-2fefda287bed.png"),
  },
  {
    key: "Power Supplies",
    label: "Power Supplies",
    href: "/shop/components/power-supplies",
    img: cdn("power-supply", "Etail_C1000GoldCore_Carousel_Hero_EN.png"),
  },
  {
    key: "CPU Coolers",
    label: "Coolers",
    href: "/shop/components/cpu-coolers",
    img: cdn("cpu-cooler", "01_Kraken_Plus_RGB_240_white_7cf2ef28-fe55-4788-ba1e-c7c8dfd187e4.png"),
  },
  {
    key: "Gaming Monitors",
    label: "Monitors",
    href: "/shop/gaming-gear/gaming-monitors",
    img: cdn("monitor", "46207.png"),
  },
  {
    key: "Mechanical Keyboards",
    label: "Keyboards",
    href: "/shop/gaming-gear/mechanical-keyboards",
    img: cdn("keyboard", "g515-lightspeed-tkl-top-angle-gallery-1-en-fr.png"),
  },
  {
    key: "Gaming Mice",
    label: "Gaming Mice",
    href: "/shop/gaming-gear/gaming-mice",
    img: cdn("mouse", "g309-lightspeed-wireless-mouse-white-gallery-1.png"),
  },
  {
    key: "Gaming Headsets",
    label: "Headsets",
    href: "/shop/gaming-gear/gaming-headsets",
    img: cdn("headphones", "g535-wireless-gallery-1.png"),
  },
  {
    key: "Case Fans",
    label: "Fans",
    href: "/shop/components/case-fans",
    img: cdn("case-fan", "Etail_F120X_White_Carousel_Hero_EN.png"),
  },
  {
    key: "Prebuilt PCs",
    label: "Gaming PCs",
    href: "/shop/pcs",
    img: cdn("PCs", "h7-flow-rgb-hero-white.png"),
  },
  {
    key: "Laptops",
    label: "Laptops",
    href: "/shop/laptops/laptops",
    img: cdn("PCs", "h6-flow-rgb-hero-white.png"),
  },
  {
    key: "Gaming Furniture",
    label: "Furniture",
    href: "/shop/gaming-furniture",
    img: cdn("funiture", "ChairPro.webp"),
  },
];

export default function ShopByCategory() {
  return (
    <section className="bg-base py-20">
      <div className="mx-auto max-w-350 px-4 md:px-8">

        {/* ── Title ── */}
        <h2 className="mb-10 text-center text-3xl font-black uppercase tracking-[0.18em] text-fg md:text-4xl">
          Shop by Category
        </h2>

        {/* ── 5×2 grid ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
              <Link
                key={cat.key}
                href={cat.href}
                className="group relative flex flex-col overflow-hidden border border-white/6 bg-elevated transition-all duration-300 hover:border-brand/25 hover:shadow-glow-sm"
              >
                {/* ── Product image area ── */}
                <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-elevated p-5">
                  {/* Soft radial glow behind product */}
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(255,255,255,0.05),transparent_68%)]" />

                  {/* Product image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.img}
                    alt={cat.label}
                    className="relative z-10 h-full w-full object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-[1.07]"
                    loading="lazy"
                  />
                </div>

                {/* ── Label bar ── */}
                <div className="flex items-center justify-between gap-2 border-t border-white/5 bg-elevated px-4 py-3">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-fg">
                    <span className="mr-1 font-bold opacity-50">{"//"}</span>
                    {cat.label}
                  </span>

                  <ArrowRight
                    size={12}
                    className="shrink-0 text-subtle transition-all duration-200 group-hover:translate-x-1 group-hover:text-fg"
                  />
                </div>
              </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
