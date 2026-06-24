import type {
  AdminStats, AdminProduct, AdminOrder, Promotion,
  ProductInput, PromotionInput, Paginated,
} from "@/types/api";
import { apiFetch, getApiUrl, getToken } from "./client";

// ── Stats ─────────────────────────────────────────────────────────────────────

export const fetchAdminStats = () =>
  apiFetch<AdminStats>("/admin/stats");

// ── Products ──────────────────────────────────────────────────────────────────

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

export async function uploadProductImage(file: File): Promise<{ url: string }> {
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(getApiUrl("/admin/upload"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function downloadProductTemplate() {
  const token = getToken();
  const res = await fetch(getApiUrl("/admin/products/template"), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "product-import-template.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProductsExcel(file: File) {
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(getApiUrl("/admin/products/import"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });
  if (!res.ok) throw new Error("Import failed");
  return res.json() as Promise<{ created: number; updated: number; skipped: number; errors: string[] }>;
}

// ── Orders ────────────────────────────────────────────────────────────────────

export const fetchAdminOrders = (status = "", page = 1) =>
  apiFetch<Paginated<AdminOrder>>(`/admin/orders?status=${status}&page=${page}`);

export const updateOrderStatus = (id: string, status: string) =>
  apiFetch<AdminOrder>(`/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });

export async function downloadOrdersExcel() {
  const token = getToken();
  const res = await fetch(getApiUrl("/admin/orders/export"), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-report-${Date.now()}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Users ─────────────────────────────────────────────────────────────────────

export const fetchAdminUsers = (page = 1) =>
  apiFetch<{ id: string; email: string; fullName: string; role: string; createdAt: string }[]>(
    `/admin/users?page=${page}`,
  );

// ── Promotions ────────────────────────────────────────────────────────────────

export const fetchPromotions = () => apiFetch<Promotion[]>("/promotions");
export const fetchAdminPromotions = () => apiFetch<Promotion[]>("/admin/promotions");

export const createAdminPromotion = (data: PromotionInput) =>
  apiFetch<Promotion>("/admin/promotions", { method: "POST", body: JSON.stringify(data) });

export const updateAdminPromotion = (id: string, data: Partial<PromotionInput>) =>
  apiFetch<Promotion>(`/admin/promotions/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const deleteAdminPromotion = (id: string) =>
  apiFetch<{ ok: boolean }>(`/admin/promotions/${id}`, { method: "DELETE" });
