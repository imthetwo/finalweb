"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";

import { fetchOrders, type Order } from "@/lib/api";
import { formatVnd } from "@/lib/format";

const STATUS_STYLE: Record<string, string> = {
  PENDING:        "border-yellow-700/50 bg-yellow-950/30 text-warning",
  PAYMENT_FAILED: "border-red-700/50 bg-red-950/30 text-destructive",
  PROCESSING:     "border-blue-700/50 bg-blue-950/30 text-info",
  SHIPPED:        "border-cyan-700/50 bg-cyan-950/30 text-brand",
  DELIVERED:      "border-emerald-700/50 bg-emerald-950/30 text-success",
  CANCELLED:      "border-edge bg-surface text-muted",
  RETURNED:       "border-orange-700/50 bg-orange-950/30 text-orange-400",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending payment", PAYMENT_FAILED: "Payment failed",
  PROCESSING: "Processing", SHIPPED: "Shipped", DELIVERED: "Delivered",
  CANCELLED: "Cancelled", RETURNED: "Returned",
};

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="py-12 text-center text-sm text-muted">Loading orders…</p>;

  if (!orders.length) {
    return (
      <div className="flex flex-col items-center gap-3 border border-dashed border-edge py-16 text-muted">
        <Package size={32} className="opacity-30" />
        <p className="text-sm">You have no orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="border border-edge bg-elevated p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge pb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">Order</p>
              <p className="font-mono text-sm font-bold text-fg">#{o.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <span className={`border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${STATUS_STYLE[o.status] ?? STATUS_STYLE.PENDING}`}>
              {STATUS_LABEL[o.status] ?? o.status}
            </span>
          </div>

          <div className="space-y-1.5 py-3">
            {o.items.map((it) => (
              <div key={it.id} className="flex justify-between text-body">
                <span className="text-secondary">{it.product.name} <span className="text-subtle">×{it.quantity}</span></span>
                <span className="text-secondary">{formatVnd(it.priceAtBuy * it.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-edge pt-3">
            <span className="text-xs text-muted">
              {new Date(o.createdAt).toLocaleDateString("en-GB")} · {o.paymentMethod} · {o.isPaid ? "Paid" : "Unpaid"}
            </span>
            <span className="text-base font-black text-brand">{formatVnd(o.totalAmount)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
