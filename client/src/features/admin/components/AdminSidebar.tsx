"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Users, ArrowLeft, ChevronDown, Video } from "lucide-react";

import { useAuthState } from "@/hooks/useAuthState";
import { fetchCategories, type Category } from "@/lib/api";
import { toast } from "sonner";

const TOP_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders",    label: "Orders",    icon: ShoppingBag },
  { href: "/admin/users",     label: "Users",     icon: Users },
  { href: "/admin/settings",  label: "Hero Video", icon: Video },
];

export function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loaded } = useAuthState();
  const [categories, setCategories] = useState<Category[]>([]);
  const isProducts = pathname.startsWith("/admin/products");
  const [productsOpen, setProductsOpen] = useState(isProducts);

  // Auto-open the Products submenu when navigating into it (adjust state during
  // render — the React-recommended alternative to a setState-in-effect).
  const [prevIsProducts, setPrevIsProducts] = useState(isProducts);
  if (isProducts !== prevIsProducts) {
    setPrevIsProducts(isProducts);
    if (isProducts) setProductsOpen(true);
  }

  const allowed = loaded && !!user && (user.role === "ADMIN" || user.role === "STAFF");

  useEffect(() => {
    if (!loaded) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "ADMIN" && user.role !== "STAFF") { router.replace("/"); return; }
    fetchCategories()
      .then(setCategories)
      .catch(() => toast.error("Failed to load categories — please refresh the page"));
  }, [loaded, user, router]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base text-muted">
        Checking access…
      </div>
    );
  }

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="flex min-h-screen bg-base text-fg">
      <aside className="flex w-56 shrink-0 flex-col border-r border-edge bg-surface">
        <div className="border-b border-edge px-5 py-5">
          <p className="text-3xs font-bold uppercase tracking-[0.3em] text-brand">Pecify</p>
          <p className="text-sm font-black uppercase tracking-wider text-fg">
            {isAdmin ? "Admin Panel" : "Staff Panel"}
          </p>
          <p className="mt-0.5 text-3xs uppercase tracking-widest text-muted">{user?.fullName}</p>
        </div>

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
