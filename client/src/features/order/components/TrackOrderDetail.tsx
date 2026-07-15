"use client";
// "use client" vì: useState/useEffect (auto-lookup, phone fallback form)

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Package, Search } from "lucide-react";

import { formatVnd } from "@/lib/format";
import { useTrackOrderDetail } from "../hooks/useTrackOrderDetail";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "border-yellow-700/50 bg-yellow-950/30 text-warning",
  AWAITING_CONFIRMATION: "border-orange-700/50 bg-orange-950/30 text-orange-400",
  PROCESSING: "border-blue-700/50 bg-blue-950/30 text-info",
  SHIPPED: "border-cyan-700/50 bg-cyan-950/30 text-brand",
  DELIVERED: "border-emerald-700/50 bg-emerald-950/30 text-success",
  CANCELLED: "border-edge bg-surface text-muted",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending payment", AWAITING_CONFIRMATION: "Confirming order",
  PROCESSING: "Preparing", SHIPPED: "Shipped",
  DELIVERED: "Delivered", CANCELLED: "Cancelled",
};

const inputCls =
  "w-full border border-edge bg-surface px-4 py-2.5 text-sm text-fg outline-none transition-colors focus:border-brand/50 placeholder:text-subtle";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted";

export function TrackOrderDetail({ id }: { id: string }) {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { phone, setPhone, order, loading, error, needsPhone, submitPhone } = useTrackOrderDetail(id);

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
                {order.paymentMethod} · {order.isPaid ? "Paid" : "Unpaid"}
              </span>
              <span className="text-xl font-black text-brand">{formatVnd(order.totalAmount)}</span>
            </div>

            <p className="text-xs text-muted">
              Placed on {new Date(order.createdAt).toLocaleString("en-GB")}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
