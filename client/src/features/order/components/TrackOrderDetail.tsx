"use client";
// "use client" because: useState/useEffect (auto-lookup, phone fallback form)

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Info, Package, Search, XCircle } from "lucide-react";

import { formatVnd, canCancelOrder, ORDER_STATUS_BADGE_CLASS as STATUS_STYLE, ORDER_STATUS_LABEL as STATUS_LABEL } from "@/lib/format";
import { useTrackOrderDetail } from "../hooks/useTrackOrderDetail";

const inputCls =
  "w-full border border-edge bg-surface px-4 py-2.5 text-sm text-fg outline-none transition-colors focus:border-brand/50 placeholder:text-subtle";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted";

export function TrackOrderDetail({ id }: { id: string }) {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { phone, setPhone, order, loading, error, needsPhone, cancelling, submitPhone, cancelThisOrder, user } =
    useTrackOrderDetail(id);

  return (
    <main className="min-h-screen bg-base px-4 py-10 text-fg md:px-8">
      <div className="mx-auto max-w-lg">
        <Link href="/track-order" className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary hover:text-fg">
          <ArrowLeft size={13} /> Track a different order
        </Link>

        {loading && !order && <p className="text-body text-secondary">Loading…</p>}

        {needsPhone && !order && (
          <form onSubmit={submitPhone} className="space-y-4 border border-edge bg-elevated p-6">
            <div>
              <p className={labelCls}>Order</p>
              <p className="font-mono text-sm text-fg">#{id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <label className={labelCls}>Phone number used at checkout</label>
              <input
                required
                placeholder="0901234567"
                className={inputCls}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 bg-brand py-3 text-body font-black uppercase tracking-wider text-black transition hover:bg-brand/85 disabled:opacity-50"
            >
              <Search size={15} /> {loading ? "Searching…" : "View order"}
            </button>
          </form>
        )}

        {order && user && (
          <div className="mb-6 flex items-start gap-2.5 border border-edge bg-elevated p-4 text-sm text-secondary">
            <Info size={15} className="mt-0.5 shrink-0 text-muted" />
            <p>
              This order used a different email than your signed-in account, so it&apos;s tracked here
              by order ID and phone rather than in{" "}
              <Link href="/account?tab=orders" className="font-bold text-brand hover:underline">
                My Orders
              </Link>
              .
            </p>
          </div>
        )}

        {order && (
          <div className="space-y-6 border border-edge bg-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xs uppercase tracking-wider text-muted">Order</p>
                <p className="font-mono text-lg font-black text-fg">#{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <span className={`border px-3 py-1.5 text-xs font-black uppercase tracking-wider ${STATUS_STYLE[order.status] ?? STATUS_STYLE.PENDING}`}>
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
            </div>

            <div className="space-y-3">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between gap-4 border border-edge bg-surface p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-11 w-11 shrink-0 border border-edge bg-base">
                      {it.product.imageUrl ? (
                        <Image src={it.product.imageUrl} alt={it.product.name} fill sizes="44px" className="object-contain p-1" unoptimized />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package size={16} className="text-subtle" />
                        </div>
                      )}
                    </div>
                    <p className="truncate text-body text-secondary">{it.product.name}</p>
                  </div>
                  <p className="shrink-0 text-body text-muted">×{it.quantity}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-edge pt-4 flex items-center justify-between">
              <span className="text-body font-bold uppercase tracking-wider text-secondary">
                {/* COD's isPaid is set true at order creation just to mean "no
                    gateway step needed" — cash hasn't actually changed hands
                    until the courier delivers it. */}
                {order.paymentMethod} ·{" "}
                {order.paymentMethod === "COD"
                  ? (order.status === "DELIVERED" ? "Paid" : "Pay on delivery")
                  : (order.isPaid ? "Paid" : "Unpaid")}
              </span>
              <span className="text-xl font-black text-brand">{formatVnd(order.totalAmount)}</span>
            </div>

            <p className="text-xs text-muted">
              Placed on {new Date(order.createdAt).toLocaleString("en-GB")}
            </p>

            {canCancelOrder(order) && (
              <button
                type="button"
                onClick={cancelThisOrder}
                disabled={cancelling}
                className="inline-flex w-full items-center justify-center gap-2 border border-destructive/50 py-3 text-sm font-bold uppercase tracking-wider text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
              >
                <XCircle size={14} /> {cancelling ? "Cancelling…" : "Cancel order"}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
