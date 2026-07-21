import type { AdminOrder, Paginated } from "@/types/api";
import { apiFetch, fetchWithTimeout, getApiUrl, getToken, LONG_TIMEOUT_MS } from "./client";

export const fetchAdminOrders = (status = "", page = 1, search = "") =>
  apiFetch<Paginated<AdminOrder>>(
    `/admin/orders?status=${encodeURIComponent(status)}&page=${page}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
  );

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
  const res = await fetchWithTimeout(getApiUrl("/admin/orders/export"), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }, LONG_TIMEOUT_MS);
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-report-${Date.now()}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
