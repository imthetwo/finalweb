import Link from "next/link";
import { CATEGORY_NAV } from "@/lib/category-nav";

// Component/system category links are derived from CATEGORY_NAV — the same
// single source of truth used for URL routing (see getShopPage.ts) — instead
// of hand-typed hrefs, which had drifted out of sync with the real routes for
// 5 of 8 entries (e.g. "/components/graphics-cards" when the real slug is
// ".../gpu") and were missing Case Fans/Monitors entirely.
function navFor(labels: string[]) {
  return labels
    .map((label) => CATEGORY_NAV.find((c) => c.label === label))
    .filter((c): c is NonNullable<typeof c> => !!c);
}

const LINKS = {
  Components: navFor([
    "Processors (CPU)", "Graphics Cards", "Motherboards", "Memory (RAM)",
    "Storage", "Power Supplies", "CPU Coolers", "Case Fans", "PC Cases",
  ]),
  "Systems & Gear": navFor([
    "Gaming PCs", "Laptops", "Keyboards", "Gaming Mice", "Headsets", "Monitors", "Furniture",
  ]),
  "PC Builder": [
    { label: "PC Builder", href: "/custom-lab" },
    { label: "Compatibility Guide", href: "/custom-lab" },
  ],
  Support: [
    { label: "My Account", href: "/account" },
    { label: "Track Order", href: "/track-order" },
    { label: "Warranty Policy", href: "/warranty" },
    { label: "Contact Us", href: "/support" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Use", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-base">
      {/* Main footer grid */}
      <div className="mx-auto max-w-350 px-4 py-16 md:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <p className="text-xl font-black uppercase tracking-tight text-fg">PECIFY</p>
            <p className="mt-3 text-body leading-relaxed text-secondary">
              Premium PC components & gaming gear. Engineered for those who demand
              the edge.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title} className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand">
                {title}
              </p>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-body text-fg transition-colors hover:text-brand"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-350 items-center justify-center px-4 py-5 md:px-8">
          <p className="text-2xs uppercase tracking-widest text-subtle">
            © 2025 Pecify. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
