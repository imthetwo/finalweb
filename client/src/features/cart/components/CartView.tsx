"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, ShoppingBag } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import { getToken } from "@/lib/auth";
import type { ProductListItem } from "@/types/api";

type CartItem = {
  id: string;
  quantity: number;
  lineTotal: number;
  customBuildId: string | null;
  product: { id: string; name: string; thumbnailUrl: string | null; displayPrice: number };
};
type Cart = { items: CartItem[]; subTotal: number };

export function CartView() {
  const isLoggedIn = !!getToken();

  const [cart, setCart] = useState<Cart | null>(() =>
    isLoggedIn ? null : { items: [], subTotal: 0 },
  );
  const [trending, setTrending] = useState<ProductListItem[]>([]);

  useEffect(() => {
    if (!isLoggedIn) {
      apiFetch<{ items: ProductListItem[] }>("/products?limit=4")
        .then((d) => setTrending(d.items))
        .catch(() => {});
      return;
    }
    apiFetch<Cart>("/cart").then(setCart).catch(() => setCart(null));
  }, [isLoggedIn]);

  async function updateQty(itemId: string, quantity: number) {
    try {
      setCart(
        await apiFetch<Cart>(`/cart/items/${itemId}`, {
          method: "PATCH",
          body: JSON.stringify({ quantity }),
        }),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  // Loading state (logged-in users only, waiting for fetch)
  if (cart === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base">
        <p className="text-body text-muted">Loading cart…</p>
      </main>
    );
  }

  const standalone = cart.items.filter((i) => !i.customBuildId);
  const buildMap = new Map<string, CartItem[]>();
  for (const item of cart.items) {
    if (!item.customBuildId) continue;
    buildMap.set(item.customBuildId, [
      ...(buildMap.get(item.customBuildId) ?? []),
      item,
    ]);
  }

  const isEmpty = cart.items.length === 0;

  return (
    <main className="min-h-screen bg-base text-fg">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* ── LEFT: items or empty state ─────────────────────────── */}
          <div>
            {isEmpty ? (
              <>
                <h1 className="text-3xl font-black uppercase tracking-tight text-fg md:text-4xl">
                  Your Cart Is Empty
                </h1>

                {!isLoggedIn && (
                  <p className="mt-4 text-body text-secondary">
                    Have an account?{" "}
                    <Link
                      href="/login"
                      className="text-brand underline decoration-brand/40 hover:decoration-brand"
                    >
                      Log in to see your cart
                    </Link>
                  </p>
                )}

                <div className="mt-8 border-t border-edge" />

                {/* Trending products */}
                {trending.length > 0 && (
                  <div className="mt-8">
                    <p className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-muted">
                      Trending Products
                    </p>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {trending.map((p) => (
                        <div key={p.id} className="group border border-edge bg-surface transition-colors hover:border-brand/30">
                          <Link href={`/product/${p.id}`} className="block p-4">
                            <div className="relative aspect-square bg-elevated">
                              {(p.thumbnailUrl ?? p.imageUrl) && (
                                <Image
                                  src={(p.thumbnailUrl ?? p.imageUrl)!}
                                  alt={p.name}
                                  fill
                                  className="object-contain p-3"
                                  unoptimized
                                />
                              )}
                            </div>
                            <p className="mt-3 line-clamp-2 text-xs font-semibold text-fg group-hover:text-brand">
                              {p.name}
                            </p>
                            <p className="mt-1 text-xs font-black text-brand">
                              {formatVnd(p.displayPrice)}
                            </p>
                          </Link>
                          <div className="px-4 pb-4">
                            <TrendingBuyButton productId={p.id} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <h1 className="mb-6 text-2xl font-black uppercase tracking-tight text-fg">
                  Your Cart
                </h1>

                {/* Custom PC builds */}
                {[...buildMap.entries()].map(([buildId, items]) => (
                  <div key={buildId} className="mb-6 border border-brand/30 bg-brand/5 p-4">
                    <p className="mb-3 text-xs font-black uppercase tracking-wider text-brand">
                      Custom PC Build —{" "}
                      {formatVnd(items.reduce((s, i) => s + i.lineTotal, 0))}
                    </p>
                    <ul className="space-y-3">
                      {items.map((i) => (
                        <CartItemRow key={i.id} item={i} onUpdate={updateQty} />
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Standalone items */}
                {standalone.length > 0 && (
                  <ul className="space-y-4">
                    {standalone.map((i) => (
                      <CartItemRow key={i.id} item={i} onUpdate={updateQty} />
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* ── RIGHT: Order summary ────────────────────────────────── */}
          <div className="h-fit border border-edge bg-surface p-6">
            <h2 className="text-lg font-black uppercase tracking-[0.15em] text-fg">
              Order Summary
            </h2>
            <div className="mt-4 border-t border-edge pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-body font-bold text-secondary">Total</span>
                <span className="text-md font-black text-fg">
                  {formatVnd(cart.subTotal)}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {!isEmpty && isLoggedIn ? (
                <>
                  <Link
                    href="/checkout"
                    className="flex w-full items-center justify-center gap-2 bg-brand py-3.5 text-sm font-black uppercase tracking-wider text-black transition-colors hover:bg-brand-hover"
                  >
                    <ShoppingBag size={14} />
                    Checkout
                  </Link>
                  <Link
                    href="/shop"
                    className="flex w-full items-center justify-center border border-edge py-3.5 text-sm font-bold uppercase tracking-wider text-secondary transition-colors hover:border-fg hover:text-fg"
                  >
                    Continue Shopping
                  </Link>
                </>
              ) : (
                <Link
                  href="/shop"
                  className="flex w-full items-center justify-center gap-2 bg-brand py-3.5 text-sm font-black uppercase tracking-wider text-black transition-colors hover:bg-brand-hover"
                >
                  Continue Shopping
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function TrendingBuyButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await apiFetch("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      toast.success("Added to cart");
      window.dispatchEvent(new Event("cart-updated"));
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add to cart");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full bg-brand py-2 text-xs font-black uppercase tracking-wider text-black transition hover:bg-brand-hover disabled:opacity-60"
    >
      {done ? "Added ✓" : loading ? "Adding…" : "Buy Now"}
    </button>
  );
}

function CartItemRow({
  item,
  onUpdate,
}: {
  item: CartItem;
  onUpdate: (id: string, qty: number) => void;
}) {
  return (
    <li className="flex gap-4 border border-edge p-4">
      <div className="relative h-20 w-20 shrink-0 border border-edge bg-elevated">
        {item.product.thumbnailUrl && (
          <Image
            src={item.product.thumbnailUrl}
            alt=""
            fill
            className="object-contain p-1"
            unoptimized
          />
        )}
      </div>
      <div className="flex-1">
        <p className="text-body font-semibold text-fg">{item.product.name}</p>
        <p className="mt-1 text-body text-brand">{formatVnd(item.lineTotal)}</p>
        {!item.customBuildId && (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdate(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="flex h-7 w-7 items-center justify-center border border-edge text-fg transition-colors hover:border-brand/50 disabled:opacity-30"
            >
              −
            </button>
            <span className="w-6 text-center text-body text-fg">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onUpdate(item.id, item.quantity + 1)}
              className="flex h-7 w-7 items-center justify-center border border-edge text-fg transition-colors hover:border-brand/50"
            >
              +
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
