import type { InitiatePaymentResponse, Order, PaymentStatus } from "@/types/api";
import { apiFetch, getApiUrl } from "./client";

export const fetchOrders = () =>
  apiFetch<Order[]>("/orders");

// POST /orders/guest-checkout — no auth required.
// Client "session" = localStorage["guest_cart"]; items are sent in body.
// Backend validates stock, runs $transaction(Order + OrderItem), returns order id.
export const guestCheckout = (data: {
  items: { productId: string; quantity: number }[];
  shippingInfo: Record<string, string>;
  paymentMethod: string;
  guestEmail: string;
}) =>
  apiFetch<{ id: string }>("/orders/guest-checkout", {
    method: "POST",
    body: JSON.stringify(data),
  });

// GET /orders/:id
export const fetchOrder = (id: string) =>
  apiFetch<Order>(`/orders/${id}`);

// POST /orders/track — public guest lookup, no auth. orderId + phone must match.
export const trackOrder = (orderId: string, phone: string) =>
  apiFetch<Order>("/orders/track", { method: "POST", body: JSON.stringify({ orderId, phone }) });

export const createOrder = (data: {
  shippingInfo: Record<string, string>;
  paymentMethod: string;
  saveAddress?: boolean;
}) =>
  apiFetch<Order>("/orders", { method: "POST", body: JSON.stringify(data) });

export const cancelOrder = (orderId: string) =>
  apiFetch<Order>(`/orders/${orderId}/cancel`, { method: "POST" });

// Attaches past guest orders (placed with this account's email before signing
// in) to the account — call once right after login/register/Google sign-in.
export async function claimGuestOrders(token: string): Promise<{ claimed: number }> {
  const res = await fetch(getApiUrl("/orders/claim"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to claim guest orders");
  return res.json() as Promise<{ claimed: number }>;
}

export const initiatePayment = (orderId: string) =>
  apiFetch<InitiatePaymentResponse>("/payments/initiate", { method: "POST", body: JSON.stringify({ orderId }) });

export const fetchPaymentStatus = (orderId: string) =>
  apiFetch<PaymentStatus>(`/payments/status/${orderId}`);

export const confirmPayment = (orderId: string, success = true) =>
  apiFetch<{ ok: boolean; status: string; isPaid?: boolean }>("/payments/confirm", {
    method: "POST",
    body: JSON.stringify({ orderId, success }),
  });
