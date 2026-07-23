import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAuthState } from "@/hooks/useAuthState";
import { fetchCategories } from "@/lib/api";
import type { Category } from "@/types/api";

// Data/logic for the admin sidebar — role-gates the whole admin area, loads
// the category list for the Products submenu, and tracks that submenu's open
// state (auto-opening it when navigating into /admin/products). The
// component only renders the nav based on this.
export function useAdminSidebar() {
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
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!loaded) return;
    if (!user) { router.replace(`/login?redirect=${encodeURIComponent(pathname)}`); return; }
    if (user.role !== "ADMIN" && user.role !== "STAFF") { router.replace("/"); return; }
    fetchCategories()
      .then(setCategories)
      .catch(() => toast.error("Failed to load categories — please refresh the page"));
  }, [loaded, user, router]);

  return { pathname, user, allowed, isAdmin, categories, isProducts, productsOpen, setProductsOpen };
}
