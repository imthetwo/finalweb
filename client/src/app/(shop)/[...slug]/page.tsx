import ShopBrowser from "@/features/shop/ShopBrowser";
import { fetchCategories, fetchProducts } from "@/lib/api";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ page?: string; search?: string }>;
};

// Map URL segment → tên category chính xác trong DB
const URL_TO_CATEGORY: Record<string, string> = {
  processors: "Processors (CPU)",
  gpu: "Graphics Cards (GPU)",
  "graphics-cards": "Graphics Cards (GPU)",
  ram: "RAM",
  motherboards: "Motherboards",
  "power-supplies": "Power Supplies",
  "pc-cases": "PC Cases",
  "cpu-coolers": "CPU Coolers",
  "case-fans": "Case Fans",
  storage: "Storage (SSD/HDD)",
  "gaming-monitors": "Gaming Monitors",
  "mechanical-keyboards": "Mechanical Keyboards",
  "gaming-mice": "Gaming Mice",
  "gaming-headsets": "Gaming Headsets",
  laptops: "Laptops",
  pcs: "Prebuilt PCs",
  "gaming-furniture": "Gaming Furniture",
};

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
    if (URL_TO_CATEGORY[seg]) {
      targetCategoryName = URL_TO_CATEGORY[seg];
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
