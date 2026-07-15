import Link from "next/link";

const LINKS = {
  Components: [
    { label: "Processors (CPU)", href: "/components/processors" },
    { label: "Graphics Cards (GPU)", href: "/components/graphics-cards" },
    { label: "Motherboards", href: "/components/motherboards" },
    { label: "Memory (RAM)", href: "/components/memory-storage/ram" },
    { label: "Storage / SSDs", href: "/components/memory-storage/nvme-ssds" },
    { label: "Power Supplies", href: "/components/power-cooling/psu" },
    { label: "CPU Cooling", href: "/components/power-cooling/aio-liquid-coolers" },
    { label: "PC Cases", href: "/components/chassis-modding/pc-cases" },
  ],
  "Systems & Gear": [
    { label: "Prebuilt PCs", href: "/pcs" },
    { label: "Laptops", href: "/laptops" },
    { label: "Mechanical Keyboards", href: "/gaming-gear/input-devices/mechanical-keyboards" },
    { label: "Gaming Mice", href: "/gaming-gear/input-devices/wireless-mice" },
    { label: "Gaming Headsets", href: "/gaming-gear/audio/gaming-headsets" },
    { label: "Gaming Furniture", href: "/gaming-furniture/seating/ergonomic-chairs" },
  ],
  "PC Builder": [
    { label: "PC Builder", href: "/custom-lab" },
    { label: "Compatibility Guide", href: "/custom-lab" },
    { label: "My Builds", href: "/account" },
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
