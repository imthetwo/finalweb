import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cdn } from "@/lib/cloudinary";
import { serverApiUrl } from "@/lib/api";

// key phải khớp đúng với category name trong DB
const CATEGORIES = [
  {
    key: "PC Cases",
    label: "Cases",
    href: "/components/pc-cases",
    // white H9 Flow case — clean product shot
    img: cdn("case", "Case_H9_Flow_RGB__WH_Carousel_Hero_EN_d5c60367-c559-4b2e-9fc1-2fefda287bed.png"),
  },
  {
    key: "Prebuilt PCs",
    label: "Gaming PCs",
    href: "/pcs",
    img: cdn("PCs", "h7-flow-rgb-hero-white.png"),
  },
  {
    key: "RAM",
    label: "Memory",
    href: "/components/ram",
    // Vengeance RGB DDR5 — colourful, looks great on dark bg
    img: cdn("memory", "Vengeance-RGB-DDR5-2UP-32GB-GRAY_01.webp"),
  },
  {
    key: "Mechanical Keyboards",
    label: "Keyboards",
    href: "/gaming-gear/mechanical-keyboards",
    img: cdn("keyboard", "MAKR75_Hero_Shot_Front.png"),
  },
  {
    key: "Gaming Headsets",
    label: "Headsets",
    href: "/gaming-gear/gaming-headsets",
    img: cdn("headphones", "g535-wireless-gallery-1.png"),
  },
  {
    key: "Power Supplies",
    label: "Power Supplies",
    href: "/components/power-supplies",
    img: cdn("power-supply", "100-GD-0600-V1_MD_1.png"),
  },
  {
    key: "CPU Coolers",
    label: "Coolers",
    href: "/components/cpu-coolers",
    // NZXT Kraken AIO — iconic product shot
    img: cdn("cpu-cooler", "01_Kraken_Plus_RGB_240_white_7cf2ef28-fe55-4788-ba1e-c7c8dfd187e4.png"),
  },
  {
    key: "Gaming Mice",
    label: "Gaming Mice",
    href: "/gaming-gear/gaming-mice",
    // White wireless mouse — pops on dark bg
    img: cdn("mouse", "g309-lightspeed-wireless-mouse-white-gallery-1.png"),
  },
  {
    key: "Case Fans",
    label: "Fans",
    href: "/components/case-fans",
    img: cdn("case-fan", "Etail_F120X_White_Carousel_Hero_EN.png"),
  },
  {
    key: "Gaming Furniture",
    label: "Furniture",
    href: "/gaming-furniture",
    // Cloudinary: TechStore/funiture/ — white Corsair gaming chair
    img: cdn("funiture", "CF-9010068-WW_01.webp"),
  },
];

// ─── Fetch product counts ──────────────────────────────────────────────
async function getCounts(): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${serverApiUrl}/categories/menu`, { next: { revalidate: 300 } });
    if (!res.ok) return {};
    const data = await res.json();
    return (data.categoryCounts as Record<string, number>) ?? {};
  } catch {
    return {};
  }
}

export default async function ShopByCategory() {
  const counts = await getCounts();

  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-350 px-4 md:px-8">

        {/* ── Title ── */}
        <h2 className="mb-10 text-center text-3xl font-black uppercase tracking-[0.18em] text-fg md:text-4xl">
          Shop by Category
        </h2>

        {/* ── 5×2 grid ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((cat) => {
            const count = counts[cat.key] ?? 0;

            return (
              <Link
                key={cat.key}
                href={cat.href}
                className="group relative flex flex-col overflow-hidden border border-white/6 bg-elevated transition-all duration-300 hover:border-brand/25 hover:shadow-[0_0_16px_rgba(0,255,255,0.07)]"
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
                  <span className="text-[11px] font-black uppercase tracking-[0.12em] text-fg">
                    <span className="mr-1 font-bold opacity-50">//</span>
                    {cat.label}
                    {count > 0 && (
                      <span className="ml-1.5 text-[9px] font-semibold text-muted">
                        ({count})
                      </span>
                    )}
                  </span>

                  <ArrowRight
                    size={12}
                    className="shrink-0 text-subtle transition-all duration-200 group-hover:translate-x-1 group-hover:text-fg"
                  />
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
