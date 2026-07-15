import type { Category, MenuSection, ProductListResponse } from "@/types/api";
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

export function fetchCategoryMenu() {
  return apiFetch<{ sections: MenuSection[] }>("/categories/menu");
}

export function fetchCategory(id: string) {
  return apiFetch<Category>(`/categories/${id}`);
}

export function fetchCategories() {
  return apiFetch<Category[]>("/categories");
}
