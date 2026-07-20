"use client";

import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Users, ArrowLeft, ChevronDown, Video } from "lucide-react";

import { useAdminSidebar } from "../hooks/useAdminSidebar";

const TOP_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders",    label: "Orders",    icon: ShoppingBag },
  { href: "/admin/users",     label: "Users",     icon: Users },
  { href: "/admin/settings",  label: "Hero Video", icon: Video },
];

export function AdminSidebar({ children }: { children: React.ReactNode }) {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { pathname, allowed, isAdmin, categories, isProducts, productsOpen, setProductsOpen } =
    useAdminSidebar();

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base text-muted">
        Checking access…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-base text-fg">
      <aside className="flex w-56 shrink-0 flex-col border-r border-edge bg-surface">
        <nav className="flex-1 overflow-y-auto space-y-0.5 p-3">
          {TOP_NAV.slice(0, 1).map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={["flex items-center gap-3 px-3 py-2.5 text-body font-bold uppercase tracking-wide transition-colors",
                  active ? "bg-brand/10 text-brand" : "text-secondary hover:bg-white/4 hover:text-fg"].join(" ")}
              >
                <Icon size={15} /> {label}
              </Link>
            );
          })}

          <div>
            <button onClick={() => setProductsOpen((o) => !o)}
              className={["flex w-full items-center gap-3 px-3 py-2.5 text-body font-bold uppercase tracking-wide transition-colors",
                isProducts ? "text-brand" : "text-secondary hover:text-fg"].join(" ")}
            >
              <Package size={15} />
              <span className="flex-1 text-left">Products</span>
              <ChevronDown size={13} className={`transition-transform ${productsOpen ? "rotate-180" : ""}`} />
            </button>

            {productsOpen && (
              <div className="ml-6 mt-0.5 space-y-0.5 border-l border-edge pl-3">
                <Link href="/admin/products"
                  className={["block py-1.5 text-sm font-semibold uppercase tracking-wide transition-colors",
                    pathname === "/admin/products" ? "text-brand" : "text-muted hover:text-fg"].join(" ")}
                >
                  All Products
                </Link>
                {categories.map((cat) => {
                  const href = `/admin/products/${cat.id}`;
                  return (
                    <Link key={cat.id} href={href}
                      className={["block py-1.5 text-sm font-semibold uppercase tracking-wide transition-colors",
                        pathname === href ? "text-brand" : "text-muted hover:text-fg"].join(" ")}
                    >
                      {cat.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {isAdmin && TOP_NAV.slice(1).map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={["flex items-center gap-3 px-3 py-2.5 text-body font-bold uppercase tracking-wide transition-colors",
                  active ? "bg-brand/10 text-brand" : "text-secondary hover:bg-white/4 hover:text-fg"].join(" ")}
              >
                <Icon size={15} /> {label}
              </Link>
            );
          })}
        </nav>

        <Link href="/"
          className="flex items-center gap-2 border-t border-edge px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted hover:text-fg"
        >
          <ArrowLeft size={13} /> Back to store
        </Link>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
