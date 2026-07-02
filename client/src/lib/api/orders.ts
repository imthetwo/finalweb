import type { Order } from "@/types/api";
import { apiFetch } from "./client";

export const fetchOrders = () =>
  apiFetch<Order[]>("/orders");

// GET /orders/:id
export const fetchOrder = (id: string) =>
  apiFetch<Order>(`/orders/${id}`);

export const createOrder = (data: {
  shippingInfo: Record<string, string>;
  paymentMethod: string;
  couponCode?: string;
}) =>
  apiFetch<Order>("/orders", { method: "POST", body: JSON.stringify(data) });

export const cancelOrder = (orderId: string) =>
  apiFetch<Order>(`/orders/${orderId}/cancel`, { method: "POST" });

export const validateCoupon = (code: string, subtotal: number) =>
  apiFetch<{ valid: boolean; discount: number; message: string; code?: string }>("/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code, subtotal }),
  });

export const initiatePayment = (orderId: string) =>
  apiFetch<{
    orderId: string;
    amount: number;
    payUrl: string | null;
    qrCodeUrl: string | null;
    source: "momo" | "simulated";
  }>("/payments/initiate", { method: "POST", body: JSON.stringify({ orderId }) });

export const confirmPayment = (orderId: string, success = true) =>
  apiFetch<{ ok: boolean; status: string; isPaid?: boolean }>("/payments/confirm", {
    method: "POST",
    body: JSON.stringify({ orderId, success }),
  });
