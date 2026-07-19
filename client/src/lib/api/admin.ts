import type {
  AdminStats, AdminProduct, AdminOrder, AdminUser, UserRole,
  ProductInput, Paginated,
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

export const approveAdminProduct = (id: string) =>
  apiFetch<{ id: string }>(`/admin/products/${id}/approve`, { method: "PATCH" });

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

// POST /admin/upload-video — Cloudinary hero video upload, ADMIN only
export async function uploadHeroVideo(file: File): Promise<{ url: string }> {
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(getApiUrl("/admin/upload-video"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? "Upload failed");
  }
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

// GET /admin/products/inventory-report — downloads the Inventory Report .xlsx (ADMIN only)
export async function downloadInventoryReport() {
  const token = getToken();
  const res = await fetch(getApiUrl("/admin/products/inventory-report"), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventory-report-${Date.now()}.xlsx`;
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

// PATCH /admin/orders/:id/accept — STAFF + ADMIN, moves AWAITING_CONFIRMATION → PROCESSING
export const acceptOrder = (id: string) =>
  apiFetch<AdminOrder>(`/admin/orders/${id}/accept`, { method: "PATCH" });

// POST /admin/orders/:id/reject — ADMIN only, refunds via MoMo first if paid
export const rejectOrder = (id: string, reason: string) =>
  apiFetch<AdminOrder>(`/admin/orders/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) });

// POST /admin/orders/:id/cancel — ADMIN only, restocks inventory, requires a reason
export const adminCancelOrder = (id: string, reason: string) =>
  apiFetch<AdminOrder>(`/admin/orders/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) });

// POST /admin/orders/:id/recheck-payment — ADMIN only, force-recheck against MoMo directly
export const recheckPayment = (id: string) =>
  apiFetch<{ orderId: string; isPaid: boolean; status: string; momoResultCode: number; momoMessage: string }>(
    `/admin/orders/${id}/recheck-payment`,
    { method: "POST" },
  );

// POST /admin/orders/:id/refund — ADMIN only, real MoMo refund + restock on success
export const refundOrder = (id: string, reason: string) =>
  apiFetch<AdminOrder>(`/admin/orders/${id}/refund`, { method: "POST", body: JSON.stringify({ reason }) });

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
  apiFetch<AdminUser[]>(`/admin/users?page=${page}`);

// PATCH /admin/users/:id/role — ADMIN ONLY
export const updateAdminUserRole = (id: string, role: UserRole) =>
  apiFetch<{ id: string; email: string; fullName: string; role: string }>(
    `/admin/users/${id}/role`,
    { method: "PATCH", body: JSON.stringify({ role }) },
  );
