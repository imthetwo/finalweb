import { serverApiUrl } from "@/lib/api";
import type { ProductListItem, ProductListResponse } from "@/types/api";

export type { ProductListItem as FeaturedProduct };

// GET /products?limit=&page=1 — used by the landing page's Featured Products section
export async function getFeaturedProducts(limit = 8): Promise<ProductListItem[]> {
  try {
    const res = await fetch(`${serverApiUrl}/products?limit=${limit}&page=1`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const data: ProductListResponse = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}
