"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Package, X, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { fetchOrders, cancelOrder, type Order } from "@/lib/api";
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

function canCancel(o: Order) {
  return !o.isPaid && (o.status === "PENDING" || o.status === "PROCESSING");
}

/* ─── Order Detail Modal ──────────────────────────────────────────────────── */
// Centered modal — follows the same overlay pattern as ProductFormModal /
// PromotionsManager (fixed inset-0 + flex centering + bg-base/70 backdrop)
// so it looks and behaves consistently with the rest of the admin/account UI.

function OrderDetailModal({
  order,
  onClose,
  onCancel,
  cancelling,
}: {
  order: Order;
  onClose: () => void;
  onCancel: (id: string) => void;
  cancelling: string | null;
}) {
  const si = order.shippingInfo ?? {};

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-base/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden border border-edge bg-elevated shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >

        {/* header */}
        <div className="flex items-center justify-between border-b border-edge px-10 py-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-muted">Order Detail</p>
            <p className="font-mono text-2xl font-black text-fg">#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`border px-4 py-1.5 text-sm font-black uppercase tracking-wider ${STATUS_STYLE[order.status] ?? STATUS_STYLE.PENDING}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center border border-edge text-muted transition-colors hover:border-fg/30 hover:text-fg"
              aria-label="Close order detail"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8">

          {/* Shipping info */}
          <section>
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">Shipping Info</p>
            <div className="border border-edge bg-surface p-6 space-y-2 text-lg">
              {si.fullName && <p className="font-semibold text-fg">{si.fullName}</p>}
              {si.phone && <p className="text-secondary">{si.phone}</p>}
              {si.address && <p className="text-secondary">{si.address}</p>}
              {si.city && <p className="text-secondary">{si.city}</p>}
              {!si.fullName && !si.phone && !si.address && (
                <p className="text-muted italic">No shipping info available.</p>
              )}
            </div>
          </section>

          {/* Items */}
          <section>
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">
              Items ({order.items.length})
            </p>
            <div className="space-y-3">
              {order.items.map((it) => (
                <div key={it.id} className="flex gap-5 border border-edge bg-surface p-5">
                  <div className="relative h-28 w-28 shrink-0 border border-edge bg-base">
                    {it.product.imageUrl ? (
                      <Image
                        src={it.product.imageUrl}
                        alt={it.product.name}
                        fill
                        sizes="112px"
                        className="object-contain p-2"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package size={32} className="text-subtle" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 items-center justify-between gap-4 min-w-0">
                    <p className="text-lg text-secondary line-clamp-2 leading-snug">{it.product.name}</p>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-semibold text-fg">{formatVnd(it.priceAtBuy * it.quantity)}</p>
                      <p className="text-sm text-muted">×{it.quantity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Price breakdown */}
          <section>
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">Summary</p>
            <div className="border border-edge bg-surface p-6 space-y-3 text-lg">
              <div className="flex justify-between text-secondary">
                <span>Subtotal</span>
                <span>{formatVnd(order.subTotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>
                    Discount
                    {order.couponCode && (
                      <span className="ml-1.5 border border-success/40 bg-success/10 px-2 py-0.5 text-sm font-bold uppercase tracking-wider">
                        {order.couponCode}
                      </span>
                    )}
                  </span>
                  <span>−{formatVnd(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-secondary">
                <span>Shipping</span>
                <span>{order.shippingFee > 0 ? formatVnd(order.shippingFee) : "Free"}</span>
              </div>
              <div className="flex justify-between border-t border-edge pt-4 font-black text-fg">
                <span>Total</span>
                <span className="text-2xl text-brand">{formatVnd(order.totalAmount)}</span>
              </div>
            </div>
          </section>

          {/* Payment info */}
          <section>
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">Payment</p>
            <div className="border border-edge bg-surface p-6 flex items-center justify-between text-lg">
              <span className="text-secondary uppercase tracking-wide font-semibold">{order.paymentMethod}</span>
              <span className={order.isPaid ? "text-success font-bold" : "text-warning font-bold"}>
                {order.isPaid ? "Paid" : "Unpaid"}
              </span>
            </div>
          </section>

          <p className="text-sm text-muted">
            Placed on {new Date(order.createdAt).toLocaleString("en-GB")}
          </p>
        </div>

        {/* footer */}
        {canCancel(order) && (
          <div className="border-t border-edge px-10 py-6">
            <button
              type="button"
              onClick={() => onCancel(order.id)}
              disabled={cancelling === order.id}
              className="w-full border border-destructive/50 py-3.5 text-md font-bold uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
            >
              {cancelling === order.id ? "Cancelling…" : "Cancel Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── OrdersTab ───────────────────────────────────────────────────────────── */

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  async function handleCancel(orderId: string) {
    if (!confirm("Cancel this order? Stock will be restored.")) return;
    setCancelling(orderId);
    try {
      const updated = await cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      if (selectedOrder?.id === updated.id) setSelectedOrder(updated);
      toast.success("Order cancelled.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel order.");
    } finally {
      setCancelling(null);
    }
  }

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
    <>
      <div className="space-y-3">
        {orders.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setSelectedOrder(o)}
            className="w-full border border-edge bg-elevated p-5 text-left transition-colors hover:border-fg/20 hover:bg-surface"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-2xs uppercase tracking-wider text-muted">Order</p>
                  <p className="font-mono text-sm font-black text-fg">#{o.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <span className={`border px-2.5 py-0.5 text-2xs font-black uppercase tracking-wider ${STATUS_STYLE[o.status] ?? STATUS_STYLE.PENDING}`}>
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-md font-black text-brand">{formatVnd(o.totalAmount)}</p>
                  <p className="text-2xs text-muted">{new Date(o.createdAt).toLocaleDateString("en-GB")}</p>
                </div>
                <ChevronRight size={15} className="text-subtle" />
              </div>
            </div>

            <p className="mt-2 text-body text-secondary line-clamp-1">
              {o.items.map((it) => it.product.name).join(", ")}
            </p>
          </button>
        ))}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancel={handleCancel}
          cancelling={cancelling}
        />
      )}
    </>
  );
}
