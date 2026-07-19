"use client";

import Image from "next/image";
import Link from "next/link";
import { Package, X, ChevronRight } from "lucide-react";

import { type Order } from "@/lib/api";
import { formatVnd, ORDER_STATUS_BADGE_CLASS as STATUS_STYLE, ORDER_STATUS_LABEL as STATUS_LABEL } from "@/lib/format";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useOrdersTab } from "../hooks/useOrdersTab";

// COD's isPaid=true is set at creation (no gateway needed), not "cash has
// changed hands" — that only happens on delivery — so it must stay
// cancellable. Only a genuinely gateway-paid MoMo order is blocked.
function canCancel(o: Order) {
  const paidViaMomo = o.paymentMethod === "MOMO" && o.isPaid;
  return !paidViaMomo && ["PENDING", "AWAITING_CONFIRMATION", "PROCESSING"].includes(o.status);
}

// An unpaid gateway order (e.g. MoMo) can still be paid — COD is paid on creation.
function canPay(o: Order) {
  return !o.isPaid && o.status === "PENDING" && o.paymentMethod !== "COD";
}

/* ─── Order Detail Modal ──────────────────────────────────────────────────── */
// Centered modal — follows the same overlay pattern as ProductFormModal
// (fixed inset-0 + flex centering + bg-base/70 backdrop) so it looks and
// behaves consistently with the rest of the admin/account UI.

function OrderDetailModal({
  order,
  onClose,
  onCancel,
  onPay,
  cancelling,
}: {
  order: Order;
  onClose: () => void;
  onCancel: (id: string) => void;
  onPay: (order: Order) => void;
  cancelling: string | null;
}) {
  const si = order.shippingInfo ?? {};

  useEscapeKey(onClose);

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
              {si.recipient && <p className="font-semibold text-fg">{si.recipient}</p>}
              {si.phone && <p className="text-secondary">{si.phone}</p>}
              {(si.street || si.ward || si.city) && (
                <p className="text-secondary">
                  {[si.street, si.ward, si.city].filter(Boolean).join(", ")}
                </p>
              )}
              {!si.recipient && !si.phone && !si.street && (
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
                <Link
                  key={it.id}
                  href={`/product/${it.product.id}`}
                  onClick={onClose}
                  className="flex gap-5 border border-edge bg-surface p-5 transition-colors hover:border-brand/40"
                >
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
                    <p className="text-lg text-secondary line-clamp-2 leading-snug hover:text-brand">{it.product.name}</p>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-semibold text-fg">{formatVnd(it.priceAtBuy * it.quantity)}</p>
                      <p className="text-sm text-muted">×{it.quantity}</p>
                    </div>
                  </div>
                </Link>
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
                  <span>Discount</span>
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
        {(canPay(order) || canCancel(order)) && (
          <div className="flex flex-col gap-3 border-t border-edge px-10 py-6">
            {canPay(order) && (
              <button
                type="button"
                onClick={() => onPay(order)}
                className="w-full bg-brand py-3.5 text-md font-black uppercase tracking-wider text-black transition-colors hover:bg-brand/85"
              >
                Pay Now
              </button>
            )}
            {canCancel(order) && (
              <button
                type="button"
                onClick={() => onCancel(order.id)}
                disabled={cancelling === order.id}
                className="w-full border border-destructive/50 py-3.5 text-md font-bold uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
              >
                {cancelling === order.id ? "Cancelling…" : "Cancel Order"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── OrdersTab ───────────────────────────────────────────────────────────── */

export default function OrdersTab() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { orders, loading, cancelling, selectedOrder, setSelectedOrder, handleCancel, payOrder } = useOrdersTab();

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
          onPay={payOrder}
          cancelling={cancelling}
        />
      )}
    </>
  );
}
