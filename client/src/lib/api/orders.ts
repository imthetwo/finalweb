import type { InitiatePaymentResponse, Order, PaymentStatus } from "@/types/api";
import { apiFetch, fetchWithTimeout, getApiUrl } from "./client";

export const fetchOrders = () =>
  apiFetch<Order[]>("/orders");

// POST /orders/guest-checkout — no auth required.
// Client "session" = localStorage["guest_cart"]; items are sent in body.
// Doesn't create the order yet — emails a confirmation link to guestEmail
// first. The order itself is only created once that link is confirmed
// (see confirmGuestCheckout below).
export const guestCheckout = (data: {
  items: { productId: string; quantity: number }[];
  shippingInfo: Record<string, string>;
  paymentMethod: string;
  guestEmail: string;
}) =>
  apiFetch<{ pending: true; email: string; pendingId: string }>("/orders/guest-checkout", {
    method: "POST",
    body: JSON.stringify(data),
  });

// POST /orders/guest-checkout/confirm — called from the /guest-checkout/confirm
// page after the guest clicks the emailed link. This is what actually creates
// the order.
export const confirmGuestCheckout = (token: string) =>
  apiFetch<Order>("/orders/guest-checkout/confirm", {
    method: "POST",
    body: JSON.stringify({ token }),
  });

// GET /orders/guest-checkout/status/:pendingId — polled by the checkout tab
// while it shows "check your email", so it can auto-redirect once the guest
// confirms via the link, even if they open it on a different tab/device.
export const fetchGuestCheckoutStatus = (pendingId: string) =>
  apiFetch<{ confirmed: boolean; orderId: string | null }>(`/orders/guest-checkout/status/${pendingId}`);

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
  const res = await fetchWithTimeout(getApiUrl("/orders/claim"), {
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
