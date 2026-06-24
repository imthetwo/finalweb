"use client";
// "use client" vì: useState, useEffect, event handlers (form submit, API calls)

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { getApiUrl } from "@/lib/api";

type OrderQr = { dataUrl: string; status: string; total: number };

export function OrderSuccess() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const [qr, setQr] = useState<OrderQr | null>(null);

  useEffect(() => {
    if (!orderId) return;
    fetch(getApiUrl(`/qr/order/${orderId}`))
      .then((r) => (r.ok ? r.json() : null))
      .then(setQr)
      .catch(() => {});
  }, [orderId]);

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
          <p className="mt-3 text-[11px] uppercase tracking-wider text-muted">Scan to track your order</p>
        </div>
      )}

      <div className="mt-10 flex gap-3">
        <Link href="/account?tab=orders" className="border border-edge px-6 py-3 text-[12px] font-bold uppercase tracking-wider text-secondary hover:border-white hover:text-fg">
          View orders
        </Link>
        <Link href="/" className="bg-brand px-6 py-3 text-[12px] font-black uppercase tracking-wider text-black hover:bg-brand/85">
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
