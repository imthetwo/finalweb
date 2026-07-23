import type { Category, ProductListResponse, ProductDetail } from "@/types/api";
import type { PartCatalogItem } from "@/features/custom-lab/types";
import { apiFetch } from "./client";

export function fetchProducts(params: {
  categoryId?: string;
  search?: string;
  buildType?: string;
  storageType?: string;
  coolerType?: string;
  furnitureType?: string;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params.categoryId) q.set("categoryId", params.categoryId);
  if (params.search) q.set("search", params.search);
  if (params.buildType) q.set("buildType", params.buildType);
  if (params.storageType) q.set("storageType", params.storageType);
  if (params.coolerType) q.set("coolerType", params.coolerType);
  if (params.furnitureType) q.set("furnitureType", params.furnitureType);
  if (params.page) q.set("page", String(params.page));
  q.set("limit", String(params.limit ?? 48));
  return apiFetch<ProductListResponse>(`/products?${q.toString()}`);
}

export function fetchProductById(id: string) {
  return apiFetch<ProductListResponse["items"][0]>(`/products/${id}`);
}

// Full product detail (all spec relations) — for the product detail page, as
// opposed to fetchProductById's narrower list-item shape used for cart display.
export function fetchProductDetail(id: string) {
  return apiFetch<ProductDetail>(`/products/${id}`);
}

export function fetchCategories() {
  return apiFetch<Category[]>("/categories");
}

// Custom Lab part-picker — narrower spec fields than fetchProducts' full
// ProductListItem, so it has its own return shape (PartCatalogItem).
export function fetchPartCatalog(params: { categoryId: string; storageType?: string; limit?: number }) {
  const q = new URLSearchParams({ categoryId: params.categoryId, limit: String(params.limit ?? 50) });
  if (params.storageType) q.set("storageType", params.storageType);
  return apiFetch<{ items: PartCatalogItem[] }>(`/products?${q.toString()}`);
}
