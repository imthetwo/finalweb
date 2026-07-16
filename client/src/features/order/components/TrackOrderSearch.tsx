"use client";
// "use client" because: useState (form fields), event handlers (form submit)

import Link from "next/link";
import { Search } from "lucide-react";

import { useTrackOrderSearch } from "../hooks/useTrackOrderSearch";

const inputCls =
  "w-full border border-edge bg-surface px-4 py-2.5 text-sm text-fg outline-none transition-colors focus:border-brand/50 placeholder:text-subtle";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted";

export function TrackOrderSearch() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { orderId, setOrderId, phone, setPhone, loading, error, submit } = useTrackOrderSearch();

  return (
    <main className="min-h-screen bg-base px-4 py-10 text-fg md:px-8">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-2 text-2xl font-black uppercase tracking-wide text-fg">Track your order</h1>
        <p className="mb-8 text-body text-secondary">
          Enter your order ID and the phone number you checked out with.
        </p>

        <form onSubmit={submit} className="mb-8 space-y-4 border border-edge bg-elevated p-6">
          <div>
            <label className={labelCls}>Order ID</label>
            <input
              required
              placeholder="e.g. a1b2c3d4"
              className={`${inputCls} font-mono`}
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Phone number</label>
            <input
              required
              placeholder="0901234567"
              className={inputCls}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 bg-brand py-3 text-body font-black uppercase tracking-wider text-black transition hover:bg-brand/85 disabled:opacity-50"
          >
            <Search size={15} /> {loading ? "Searching…" : "Find my order"}
          </button>
        </form>

        {error && (
          <p className="mb-8 border border-destructive/40 bg-red-950/20 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <p className="text-center text-sm text-muted">
          Can't find your order ID? Check your confirmation email, or{" "}
          <Link href="/support" className="text-brand underline decoration-brand/40 hover:decoration-brand">
            contact support
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
