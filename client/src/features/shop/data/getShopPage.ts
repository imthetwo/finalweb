// GET /products + /categories — dùng cho (shop)/shop/[...slug]/page.tsx
import { fetchCategories, fetchProducts } from "@/lib/api";
import { CATEGORY_NAV } from "@/lib/category-nav";

// last URL segment → { display label, DB category name }
const URL_LOOKUP = Object.fromEntries(
  CATEGORY_NAV
    .filter((c) => c.href !== "/shop")
    .map((c) => [c.href.split("/").at(-1)!, { label: c.label, dbName: c.dbName ?? c.label }])
);

export async function getShopPage(
  slug: string[],
  searchParams: { page?: string; search?: string },
) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const search = searchParams.search?.trim() || undefined;
  // slug=[] → /shop root page; slug=['shop'] → legacy compat
  const isAllProducts = slug.length === 0 || (slug.length === 1 && slug[0] === "shop");

  const matchedSeg = [...slug].reverse().find((seg) => URL_LOOKUP[seg]);
  const entry = matchedSeg ? URL_LOOKUP[matchedSeg] : undefined;

  let categoryId: string | undefined;
  const categoryName = isAllProducts ? "All Products" : (entry?.label ?? slug[slug.length - 1] ?? "Products");

  if (!isAllProducts) {
    try {
      const categories = await fetchCategories();
      const matched = categories.find((c) => c.name === entry?.dbName);
      if (matched) { categoryId = matched.id; }
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
