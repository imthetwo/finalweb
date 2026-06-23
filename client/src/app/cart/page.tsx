"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";
import { formatVnd } from "@/lib/format";

type CartResponse = {
  items: Array<{
    id: string;
    quantity: number;
    lineTotal: number;
    customBuildId: string | null;
    product: { id: string; name: string; thumbnailUrl: string | null; displayPrice: number };
  }>;
  subTotal: number;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);

  function load() {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setCart(null);
      return;
    }
    apiFetch<CartResponse>("/cart")
      .then(setCart)
      .catch(() => setCart(null));
  }

  useEffect(() => {
    load();
  }, []);

  async function updateQty(itemId: string, quantity: number) {
    try {
      const updated = await apiFetch<CartResponse>(`/cart/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      setCart(updated);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  async function removeBuild(buildId: string) {
    try {
      const updated = await apiFetch<CartResponse>(`/cart/builds/${buildId}`, { method: "DELETE" });
      setCart(updated);
      toast.success("Build removed from cart.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  if (cart === null && typeof window !== "undefined" && !localStorage.getItem("access_token")) {
    return (
      <main className="min-h-screen bg-black px-4 py-16 text-center text-white">
        <p className="mb-4">Sign in to view your cart</p>
        <Link href="/" className="text-brand">
          Back to home
        </Link>
      </main>
    );
  }

  const standaloneItems = cart?.items.filter((i) => !i.customBuildId) ?? [];
  const buildGroups = new Map<string, CartResponse["items"]>();
  for (const item of cart?.items ?? []) {
    if (!item.customBuildId) continue;
    const list = buildGroups.get(item.customBuildId) ?? [];
    list.push(item);
    buildGroups.set(item.customBuildId, list);
  }

  function renderItem(item: CartResponse["items"][number]) {
    return (
      <li key={item.id} className="flex gap-4 rounded-lg border border-edge p-4">
        {item.product.thumbnailUrl && (
          <div className="relative h-20 w-20 shrink-0">
            <Image src={item.product.thumbnailUrl} alt="" fill className="object-contain" unoptimized />
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold">{item.product.name}</p>
          <p className="text-brand">{formatVnd(item.lineTotal)}</p>
          {!item.customBuildId && (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                className="rounded border border-zinc-700 px-2"
                onClick={() => updateQty(item.id, item.quantity - 1)}
              >
                −
              </button>
              <span>{item.quantity}</span>
              <button
                type="button"
                className="rounded border border-zinc-700 px-2"
                onClick={() => updateQty(item.id, item.quantity + 1)}
              >
                +
              </button>
            </div>
          )}
        </div>
      </li>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white md:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">Cart</h1>
        {!cart?.items.length ? (
          <p className="text-muted">Your cart is empty.</p>
        ) : (
          <>
            {[...buildGroups.entries()].map(([buildId, items]) => {
              const total = items.reduce((s, i) => s + i.lineTotal, 0);
              return (
                <div key={buildId} className="mb-6 border border-brand/30 bg-brand/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-brand">
                      Custom PC Build — {formatVnd(total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBuild(buildId)}
                      className="text-[11px] uppercase tracking-wider text-muted underline hover:text-red-400"
                    >
                      Remove build
                    </button>
                  </div>
                  <ul className="space-y-3">{items.map(renderItem)}</ul>
                </div>
              );
            })}

            {standaloneItems.length > 0 && (
              <ul className="space-y-4">{standaloneItems.map(renderItem)}</ul>
            )}

            <p className="mt-8 text-right text-xl font-bold">
              Total: {formatVnd(cart.subTotal)}
            </p>
            <Link
              href="/checkout"
              className="mt-4 block rounded-full bg-brand py-3 text-center font-bold text-black"
            >
              Checkout
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
