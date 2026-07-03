import { serverApiUrl } from "@/lib/api";

export type FeaturedProduct = {
  id: string;
  name: string;
  brand: string;
  price: number;
  salePrice: number | null;
  displayPrice: number;
  thumbnailUrl: string | null;
  stock: number;
  category?: { id: string; name: string };
};

type ProductListResponse = {
  items: FeaturedProduct[];
  total: number;
};

// GET /products?limit=&page=1 — used by the landing page's Featured Products section
export async function getFeaturedProducts(limit = 8): Promise<FeaturedProduct[]> {
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
