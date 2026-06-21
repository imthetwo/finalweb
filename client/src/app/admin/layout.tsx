"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Megaphone,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";

import { useAuthState } from "@/hooks/useAuthState";
import { fetchCategories, type Category } from "@/lib/api";

const TOP_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/promotions", label: "Banners", icon: Megaphone },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loaded } = useAuthState();
  const [checked, setChecked] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const isProducts = pathname.startsWith("/admin/products");
  const [productsOpen, setProductsOpen] = useState(isProducts);

  useEffect(() => {
    if (isProducts) setProductsOpen(true);
  }, [isProducts]);

  useEffect(() => {
    if (!loaded) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "ADMIN") { router.replace("/"); return; }
    setChecked(true);
    fetchCategories().then(setCategories).catch(() => {});
  }, [loaded, user, router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-zinc-500">
        Checking access…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-800 bg-[#0d0d0d]">
        <div className="border-b border-zinc-800 px-5 py-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#00ffff]">Pecify</p>
          <p className="text-sm font-black uppercase tracking-wider text-white">Admin Panel</p>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-0.5 p-3">
          {TOP_NAV.slice(0, 1).map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 text-[13px] font-bold uppercase tracking-wide transition-colors",
                  active ? "bg-[#00ffff]/10 text-[#00ffff]" : "text-zinc-400 hover:bg-white/4 hover:text-white",
                ].join(" ")}
              >
                <Icon size={15} /> {label}
              </Link>
            );
          })}

          {/* Products — collapsible with dynamic categories */}
          <div>
            <button
              onClick={() => setProductsOpen((o) => !o)}
              className={[
                "flex w-full items-center gap-3 px-3 py-2.5 text-[13px] font-bold uppercase tracking-wide transition-colors",
                isProducts ? "text-[#00ffff]" : "text-zinc-400 hover:text-white",
              ].join(" ")}
            >
              <Package size={15} />
              <span className="flex-1 text-left">Products</span>
              <ChevronDown size={13} className={`transition-transform ${productsOpen ? "rotate-180" : ""}`} />
            </button>

            {productsOpen && (
              <div className="ml-6 mt-0.5 space-y-0.5 border-l border-zinc-800 pl-3">
                <Link
                  href="/admin/products"
                  className={[
                    "block py-1.5 text-[12px] font-semibold uppercase tracking-wide transition-colors",
                    pathname === "/admin/products" ? "text-[#00ffff]" : "text-zinc-500 hover:text-zinc-200",
                  ].join(" ")}
                >
                  All Products
                </Link>
                {categories.map((cat) => {
                  const href = `/admin/products/${cat.id}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={cat.id}
                      href={href}
                      className={[
                        "block py-1.5 text-[12px] font-semibold uppercase tracking-wide transition-colors",
                        active ? "text-[#00ffff]" : "text-zinc-500 hover:text-zinc-200",
                      ].join(" ")}
                    >
                      {cat.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {TOP_NAV.slice(1).map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 text-[13px] font-bold uppercase tracking-wide transition-colors",
                  active ? "bg-[#00ffff]/10 text-[#00ffff]" : "text-zinc-400 hover:bg-white/4 hover:text-white",
                ].join(" ")}
              >
                <Icon size={15} /> {label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/"
          className="flex items-center gap-2 border-t border-zinc-800 px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white"
        >
          <ArrowLeft size={13} /> Back to store
        </Link>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
