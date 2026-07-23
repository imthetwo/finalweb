import type { AdminProduct, ProductInput, Paginated } from "@/types/api";
import { apiFetch, fetchWithTimeout, getApiUrl, getToken, LONG_TIMEOUT_MS } from "./client";

export const fetchAdminProducts = (search = "", page = 1, categoryId?: string) =>
  apiFetch<Paginated<AdminProduct>>(
    `/admin/products?search=${encodeURIComponent(search)}&page=${page}${categoryId ? `&category=${encodeURIComponent(categoryId)}` : ""}`,
  );

export const createAdminProduct = (data: ProductInput) =>
  apiFetch<AdminProduct>("/admin/products", { method: "POST", body: JSON.stringify(data) });

export const updateAdminProduct = (id: string, data: Partial<ProductInput>) =>
  apiFetch<AdminProduct>(`/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const deleteAdminProduct = (id: string) =>
  apiFetch<{ ok: boolean }>(`/admin/products/${id}`, { method: "DELETE" });

export const approveAdminProduct = (id: string) =>
  apiFetch<{ id: string }>(`/admin/products/${id}/approve`, { method: "PATCH" });

export async function uploadProductImage(file: File): Promise<{ url: string }> {
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetchWithTimeout(getApiUrl("/admin/upload"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  }, LONG_TIMEOUT_MS);
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

// GET /admin/products/inventory-report — downloads the Inventory Report .xlsx (ADMIN only)
export async function downloadInventoryReport() {
  const token = getToken();
  const res = await fetchWithTimeout(getApiUrl("/admin/products/inventory-report"), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }, LONG_TIMEOUT_MS);
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventory-report-${Date.now()}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
