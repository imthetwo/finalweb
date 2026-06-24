import ShopBrowser from "@/features/shop/ShopBrowser";
import { fetchCategories, fetchProducts } from "@/lib/api";
import { CATEGORY_NAV } from "@/lib/category-nav";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ page?: string; search?: string }>;
};

// Build từ CATEGORY_NAV: last URL segment → category label
// Ví dụ: "/components/processors" → segment "processors" → label "Processors (CPU)"
const URL_TO_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORY_NAV
    .filter((c) => c.href !== "/shop")
    .map((c) => [c.href.split("/").at(-1)!, c.label])
);

export default async function ShopCategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam, search: searchParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const search = searchParam?.trim() || undefined;

  // /shop → All Products (no category filter)
  const isAllProducts = slug.length === 1 && slug[0] === "shop";

  // Try each segment from most specific to least
  const segments = [...slug].reverse();
  let targetCategoryName: string | undefined;
  for (const seg of segments) {
    if (URL_TO_LABEL[seg]) {
      targetCategoryName = URL_TO_LABEL[seg];
      break;
    }
  }

  let categoryId: string | undefined;
  let categoryName = isAllProducts ? "All Products" : (targetCategoryName ?? slug[slug.length - 1] ?? "Products");

  if (!isAllProducts) {
    try {
      const categories = await fetchCategories();
      const matched = categories.find((c) => c.name === targetCategoryName);
      if (matched) {
        categoryId = matched.id;
        categoryName = matched.name;
      }
    } catch {
      /* fallback */
    }
  }

  const data = await fetchProducts(
    search ? { search, page, limit: 48 } : { categoryId, page, limit: 48 },
  ).catch(() => ({ items: [], total: 0, page: 1, totalPages: 0 }));

  const title = search ? `Search: "${search}"` : categoryName;

  return (
    <ShopBrowser
      title={title}
      items={data.items}
      page={data.page}
      totalPages={data.totalPages}
    />
  );
}
