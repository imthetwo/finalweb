import type { Order } from "@/types/api";

export function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Order status display — shared across account/order-tracking/admin so all
// three surfaces agree on copy and color, instead of drifting independently.
export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending payment",
  AWAITING_CONFIRMATION: "Confirming order",
  PROCESSING: "Preparing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

// Bordered badge style — account Orders tab, guest order tracking.
export const ORDER_STATUS_BADGE_CLASS: Record<string, string> = {
  PENDING: "border-yellow-700/50 bg-yellow-950/30 text-warning",
  AWAITING_CONFIRMATION: "border-orange-700/50 bg-orange-950/30 text-orange-400",
  PROCESSING: "border-blue-700/50 bg-blue-950/30 text-info",
  SHIPPED: "border-cyan-700/50 bg-cyan-950/30 text-brand",
  DELIVERED: "border-emerald-700/50 bg-emerald-950/30 text-success",
  CANCELLED: "border-edge bg-surface text-muted",
};

// Plain text color — admin dashboard recent-orders table, orders manager status select.
export const ORDER_STATUS_TEXT_CLASS: Record<string, string> = {
  PENDING: "text-warning",
  AWAITING_CONFIRMATION: "text-orange-400",
  PROCESSING: "text-info",
  SHIPPED: "text-brand",
  DELIVERED: "text-success",
  CANCELLED: "text-muted",
};

// Shared by the account Orders tab and guest order tracking — same rule the
// server enforces: COD's isPaid=true is set at creation (no gateway needed),
// not "cash has changed hands" (that only happens on delivery), so it stays
// cancellable. Only a genuinely gateway-paid MoMo order is blocked.
export function canCancelOrder(o: Pick<Order, "paymentMethod" | "isPaid" | "status">) {
  const paidViaMomo = o.paymentMethod === "MOMO" && o.isPaid;
  return !paidViaMomo && ["PENDING", "AWAITING_CONFIRMATION", "PROCESSING"].includes(o.status);
}
