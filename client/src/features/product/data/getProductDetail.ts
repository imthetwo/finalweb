import { notFound } from "next/navigation";

import { fetchProductDetail } from "@/lib/api";
import type { ProductDetail } from "@/types/api";

export async function getProductDetail(id: string): Promise<ProductDetail> {
  try {
    return await fetchProductDetail(id);
  } catch {
    notFound();
  }
}
