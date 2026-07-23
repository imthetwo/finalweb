"use client";
// "use client" because: useState, useEffect, event handlers (form submit, API calls)

import Link from "next/link";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

import { useOrderSuccess } from "../hooks/useOrderSuccess";

export function OrderSuccess() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { orderId, qr, user, belongsToAccount } = useOrderSuccess();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-base px-4 py-16 text-center text-fg">
      <CheckCircle2 size={56} className="text-success" />
      <h1 className="mt-6 text-3xl font-black uppercase tracking-tight text-fg">Order placed successfully!</h1>

      {orderId && (
        <p className="mt-3 font-mono text-sm text-secondary">
          Order #{orderId.slice(0, 8).toUpperCase()}
        </p>
      )}

      {qr && (
        <div className="mt-8 border border-edge bg-elevated p-5">
          <Image src={qr.dataUrl} alt="Order QR code" width={180} height={180} unoptimized />
          <p className="mt-3 text-xs uppercase tracking-wider text-muted">Scan to track your order</p>
        </div>
      )}

      {/* A guest order placed while already signed in under a different
          email never gets attached to that account (see useOrderSuccess) —
          "My Orders" below still always goes to the account's own list
          (which just won't have this one), so call that out here rather
          than let it look like a broken link once they get there. */}
      {user && !belongsToAccount && orderId && (
        <p className="mt-6 max-w-sm text-xs text-muted">
          This order used a different email than your account (
          <span className="text-secondary">{user.email}</span>) — it won&apos;t appear in My Orders, but
          &quot;View this order&quot; below still tracks it by order ID and phone.
        </p>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {user && (
          <Link
            href="/account?tab=orders"
            className="border border-edge px-6 py-3 text-sm font-bold uppercase tracking-wider text-secondary hover:border-fg hover:text-fg"
          >
            My orders
          </Link>
        )}
        {orderId && (
          <Link
            href={`/track-order/${orderId}`}
            className="border border-edge px-6 py-3 text-sm font-bold uppercase tracking-wider text-secondary hover:border-fg hover:text-fg"
          >
            View this order
          </Link>
        )}
        <Link href="/" className="bg-brand px-6 py-3 text-sm font-black uppercase tracking-wider text-black hover:bg-brand/85">
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
