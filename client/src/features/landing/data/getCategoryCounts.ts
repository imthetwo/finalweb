import { serverApiUrl } from "@/lib/api";

// GET /categories/menu — product counts per category, used by Shop by Category section
export async function getCategoryCounts(): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${serverApiUrl}/categories/menu`, { next: { revalidate: 300 } });
    if (!res.ok) return {};
    const data = await res.json();
    return (data.categoryCounts as Record<string, number>) ?? {};
  } catch {
    return {};
  }
}
