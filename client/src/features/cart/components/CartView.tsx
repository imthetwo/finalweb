"use client";
// "use client" vì: useState (cart), useEffect (load), event handlers (updateQty, removeBuild)

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import { getToken } from "@/lib/auth";

type CartItem = {
  id: string; quantity: number; lineTotal: number; customBuildId: string | null;
  product: { id: string; name: string; thumbnailUrl: string | null; displayPrice: number };
};
type Cart = { items: CartItem[]; subTotal: number };

export function CartView() {
  // Guests start with an empty cart; logged-in users get it fetched below.
  const [cart, setCart] = useState<Cart | null>(() =>
    getToken() ? null : { items: [], subTotal: 0 }
  );

  useEffect(() => {
    if (!getToken()) return;
    apiFetch<Cart>("/cart").then(setCart).catch(() => setCart(null));
  }, []);

  async function updateQty(itemId: string, quantity: number) {
    try {
      setCart(await apiFetch<Cart>(`/cart/items/${itemId}`, { method: "PATCH", body: JSON.stringify({ quantity }) }));
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
  }

  if (!cart) return <p className="p-16 text-center text-muted">Loading cart…</p>;

  if (!getToken()) {
    return (
      <main className="min-h-screen bg-base px-4 py-16 text-center text-fg">
        <p className="mb-4">Sign in to view your cart</p>
        <Link href="/" className="text-brand">Back to home</Link>
      </main>
    );
  }

  const standalone = cart.items.filter((i) => !i.customBuildId);
  const buildMap = new Map<string, CartItem[]>();
  for (const item of cart.items) {
    if (!item.customBuildId) continue;
    buildMap.set(item.customBuildId, [...(buildMap.get(item.customBuildId) ?? []), item]);
  }

  function Item({ item }: { item: CartItem }) {
    return (
      <li className="flex gap-4 border border-edge p-4">
        {item.product.thumbnailUrl && (
          <div className="relative h-20 w-20 shrink-0">
            <Image src={item.product.thumbnailUrl} alt="" fill className="object-contain" unoptimized />
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold text-fg">{item.product.name}</p>
          <p className="text-brand">{formatVnd(item.lineTotal)}</p>
          {!item.customBuildId && (
            <div className="mt-2 flex items-center gap-2">
              <button type="button" onClick={() => updateQty(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="border border-edge px-2 disabled:opacity-30">−</button>
              <span className="text-fg">{item.quantity}</span>
              <button type="button" onClick={() => updateQty(item.id, item.quantity + 1)} className="border border-edge px-2">+</button>
            </div>
          )}
        </div>
      </li>
    );
  }

  return (
    <main className="min-h-screen bg-base px-4 py-10 text-fg md:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">Cart</h1>
        {!cart.items.length ? (
          <p className="text-muted">Your cart is empty.</p>
        ) : (
          <>
            {[...buildMap.entries()].map(([buildId, items]) => (
              <div key={buildId} className="mb-6 border border-brand/30 bg-brand/5 p-4">
                <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-brand">
                  Custom PC Build — {formatVnd(items.reduce((s, i) => s + i.lineTotal, 0))}
                </p>
                <ul className="space-y-3">{items.map((i) => <Item key={i.id} item={i} />)}</ul>
              </div>
            ))}
            {standalone.length > 0 && <ul className="space-y-4">{standalone.map((i) => <Item key={i.id} item={i} />)}</ul>}
            <p className="mt-8 text-right text-xl font-bold">Total: {formatVnd(cart.subTotal)}</p>
            <Link href="/checkout" className="mt-4 block bg-brand py-3 text-center font-bold text-black">Checkout</Link>
          </>
        )}
      </div>
    </main>
  );
}
