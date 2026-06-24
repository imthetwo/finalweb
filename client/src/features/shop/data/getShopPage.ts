// GET /products + /categories — dùng cho (shop)/[...slug]/page.tsx
import { fetchCategories, fetchProducts } from "@/lib/api";
import { CATEGORY_NAV } from "@/lib/category-nav";

// Build từ CATEGORY_NAV: last URL segment → category label
const URL_TO_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORY_NAV
    .filter((c) => c.href !== "/shop")
    .map((c) => [c.href.split("/").at(-1)!, c.label])
);

// Nhận raw searchParams từ page.tsx, tự parse
export async function getShopPage(
  slug: string[],
  searchParams: { page?: string; search?: string },
) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const search = searchParams.search?.trim() || undefined;
  const isAllProducts = slug.length === 1 && slug[0] === "shop";

  const segments = [...slug].reverse();
  let targetCategoryName: string | undefined;
  for (const seg of segments) {
    if (URL_TO_LABEL[seg]) { targetCategoryName = URL_TO_LABEL[seg]; break; }
  }

  let categoryId: string | undefined;
  let categoryName = isAllProducts ? "All Products" : (targetCategoryName ?? slug[slug.length - 1] ?? "Products");

  if (!isAllProducts) {
    try {
      const categories = await fetchCategories();
      const matched = categories.find((c) => c.name === targetCategoryName);
      if (matched) { categoryId = matched.id; categoryName = matched.name; }
    } catch { /* fallback */ }
  }

  const data = await fetchProducts(
    search ? { search, page, limit: 48 } : { categoryId, page, limit: 48 },
  ).catch(() => ({ items: [], total: 0, page: 1, totalPages: 0 }));

  return {
    title: search ? `Search: "${search}"` : categoryName,
    items: data.items,
    page: data.page,
    totalPages: data.totalPages,
  };
}
