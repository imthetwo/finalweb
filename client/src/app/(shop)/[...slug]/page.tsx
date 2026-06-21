import ShopBrowser from "@/features/shop/ShopBrowser";
import { fetchCategories, fetchProducts } from "@/lib/api";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ page?: string; search?: string }>;
};

// Map URL keywords → DB category name (chứa từ khóa)
const URL_TO_CATEGORY: Record<string, string> = {
  processors: "Processors (CPU)",
  cpu: "Processors (CPU)",
  "graphics-cards": "Graphics Cards (GPU)",
  gpu: "Graphics Cards (GPU)",
  ram: "RAM",
  memory: "RAM",
  motherboards: "Motherboards",
  psu: "Power Supplies",
  "power-supplies": "Power Supplies",
  "pc-cases": "PC Cases",
  cases: "PC Cases",
  "cpu-coolers": "CPU Coolers",
  "aio-liquid-coolers": "CPU Coolers",
  "air-coolers": "CPU Coolers",
  "gaming-monitors": "Gaming Monitors",
  monitors: "Gaming Monitors",
  storage: "Storage (SSD/HDD)",
  "nvme-ssds": "Storage (SSD/HDD)",
  hdd: "Storage (SSD/HDD)",
  "mechanical-keyboards": "Mechanical Keyboards",
  keyboards: "Mechanical Keyboards",
  "wireless-mice": "Gaming Mice",
  mice: "Gaming Mice",
  "gaming-headsets": "Gaming Headsets",
  headsets: "Gaming Headsets",
  "case-fans": "Case Fans",
  laptops: "Prebuilt PCs",
  pcs: "Prebuilt PCs",
  furniture: "Gaming Furniture",
  "gaming-furniture": "Gaming Furniture",
};

export default async function ShopCategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam, search: searchParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const search = searchParam?.trim() || undefined;

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
  let categoryName = targetCategoryName ?? slug[slug.length - 1] ?? "Products";

  try {
    const categories = await fetchCategories();
    const matched = categories.find(
      (c) => c.name === targetCategoryName,
    );
    if (matched) {
      categoryId = matched.id;
      categoryName = matched.name;
    }
  } catch {
    /* fallback */
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
