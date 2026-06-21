import type { Category, MenuSection, ProductListResponse } from "@/types/api";
import { apiFetch } from "./client";

export function fetchProducts(params: {
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params.categoryId) q.set("categoryId", params.categoryId);
  if (params.search) q.set("search", params.search);
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
