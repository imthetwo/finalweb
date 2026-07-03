"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, ShoppingBag } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatVnd } from "@/lib/format";
import { LoginOverlay } from "@/features/auth/LoginOverlay";
import { addToGuestCart } from "@/lib/guestCart";
import { useCartView } from "../hooks/useCartView";
import type { CartItem, GuestDisplayItem } from "../types";

// Returns the maximum allowed quantity based on product category
function getMaxQty(categoryName: string | undefined | null, stock: number): number {
  const cat = categoryName?.toLowerCase() ?? "";
  let cap: number;
  if (
    cat.includes("processor") || cat.includes("cpu") ||
    cat.includes("graphics") || cat.includes("gpu") ||
    cat.includes("ram") || cat.includes("memory") ||
    cat.includes("motherboard") || cat.includes("mainboard") ||
    cat.includes("laptop") || cat.includes("notebook") ||
    cat.includes("furniture") ||
    cat.includes("speaker")
  ) {
    cap = 2;
  } else if (
    cat.includes("monitor") ||
    cat.includes("keyboard") ||
    cat.includes("mice") || cat.includes("mouse") ||
    cat.includes("headset") || cat.includes("headphone")
  ) {
    cap = 5;
  } else {
    cap = 10;
  }
  return Math.min(cap, stock);
}

export function CartView() {
  const view = useCartView();

  // Show loading while auth or guest product details are being fetched
  if (view.status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base">
        <p className="text-body text-muted">Loading cart…</p>
      </main>
    );
  }

  // ── Logged-in user ────────────────────────────────────────────────────────
  if (view.status === "authed") {
    const { cart, standalone, buildGroups, isEmpty, updatingId, updateQty } = view;

    return (
      <main className="min-h-screen bg-base text-fg">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

            <div>
              {isEmpty ? (
                <h1 className="text-3xl font-black uppercase tracking-tight text-fg md:text-4xl">
                  Your Cart Is Empty
                </h1>
              ) : (
                <>
                  <h1 className="mb-6 text-2xl font-black uppercase tracking-tight text-fg">
                    Your Cart
                  </h1>
                  {buildGroups.map(([buildId, items]) => (
                    <div key={buildId} className="mb-6 border border-brand/30 bg-brand/5 p-4">
                      <p className="mb-3 text-xs font-black uppercase tracking-wider text-brand">
                        Custom PC Build —{" "}
                        {formatVnd(items.reduce((s, i) => s + i.lineTotal, 0))}
                      </p>
                      <ul className="space-y-3">
                        {items.map((i) => (
                          <CartItemRow key={i.id} item={i} onUpdate={updateQty} updating={updatingId === i.id} />
                        ))}
                      </ul>
                    </div>
                  ))}
                  {standalone.length > 0 && (
                    <ul className="space-y-4">
                      {standalone.map((i) => (
                        <CartItemRow key={i.id} item={i} onUpdate={updateQty} updating={updatingId === i.id} />
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            <div className="h-fit border border-edge bg-surface p-6">
              <h2 className="text-lg font-black uppercase tracking-[0.15em] text-fg">
                Order Summary
              </h2>
              <div className="mt-4 border-t border-edge pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-body font-bold text-secondary">Total</span>
                  <span className="text-md font-black text-fg">{formatVnd(cart.subTotal)}</span>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {!isEmpty ? (
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

  // ── Guest view ────────────────────────────────────────────────────────────
  const { guestItems, guestTotal, guestEmpty, trending, updateGuestQty } = view;

  return (
    <main className="min-h-screen bg-base text-fg">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* LEFT */}
          <div>
            {guestEmpty ? (
              <>
                <h1 className="text-3xl font-black uppercase tracking-tight text-fg md:text-4xl">
                  Your Cart Is Empty
                </h1>
                <p className="mt-4 text-body text-secondary">
                  Have an account?{" "}
                  <LoginOverlay
                    triggerButton={
                      <button type="button" className="text-brand underline decoration-brand/40 hover:decoration-brand">
                        Log in to see your cart
                      </button>
                    }
                  />
                </p>
                <div className="mt-8 border-t border-edge" />
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
                <ul className="space-y-4">
                  {guestItems.map((item) => (
                    <GuestCartItemRow key={item.productId} item={item} onUpdate={updateGuestQty} />
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* RIGHT: Order Summary */}
          <div className="h-fit border border-edge bg-surface p-6">
            <h2 className="text-lg font-black uppercase tracking-[0.15em] text-fg">
              Order Summary
            </h2>
            <div className="mt-4 border-t border-edge pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-body font-bold text-secondary">Total</span>
                <span className="text-md font-black text-fg">{formatVnd(guestTotal)}</span>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {!guestEmpty ? (
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

// ── Guest cart item with qty dropdown ─────────────────────────────────────
function GuestCartItemRow({
  item,
  onUpdate,
}: {
  item: GuestDisplayItem;
  onUpdate: (productId: string, qty: number) => void;
}) {
  const lineTotal = item.product.displayPrice * item.quantity;
  const maxQty = Math.max(getMaxQty(item.product.category?.name, item.product.stock), item.quantity);
  return (
    <li className="flex gap-4 border border-edge p-4">
      <div className="relative h-20 w-20 shrink-0 border border-edge bg-elevated">
        {(item.product.thumbnailUrl ?? item.product.imageUrl) && (
          <Image
            src={(item.product.thumbnailUrl ?? item.product.imageUrl)!}
            alt=""
            fill
            className="object-contain p-1"
            unoptimized
          />
        )}
      </div>
      <div className="flex-1">
        <p className="text-body font-semibold text-fg">{item.product.name}</p>
        <p className="mt-1 text-body text-brand">{formatVnd(lineTotal)}</p>
        <div className="mt-3 flex items-center gap-3">
          <select
            value={item.quantity}
            onChange={(e) => onUpdate(item.productId, Number(e.target.value))}
            className="border border-edge bg-surface px-2 py-1 text-body text-fg outline-none focus:border-brand/50"
          >
            {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>Qty {n}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onUpdate(item.productId, 0)}
            className="text-xs text-subtle underline hover:text-destructive"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

// ── Trending product buy button (guest-aware) ─────────────────────────────
function TrendingBuyButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      if (getToken()) {
        await apiFetch("/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId, quantity: 1 }),
        });
      } else {
        addToGuestCart(productId);
      }
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

// ── Server cart item row ──────────────────────────────────────────────────
function CartItemRow({
  item,
  onUpdate,
  updating = false,
}: {
  item: CartItem;
  onUpdate: (id: string, qty: number) => void;
  updating?: boolean;
}) {
  const maxQty = Math.max(getMaxQty(item.product.category?.name, item.product.stock), item.quantity);
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
          <div className="mt-3 flex items-center gap-3">
            <select
              value={item.quantity}
              disabled={updating}
              onChange={(e) => onUpdate(item.id, Number(e.target.value))}
              className="border border-edge bg-surface px-2 py-1 text-body text-fg outline-none focus:border-brand/50 disabled:opacity-50"
            >
              {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>Qty {n}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={updating}
              onClick={() => onUpdate(item.id, 0)}
              className="text-xs text-subtle underline hover:text-destructive disabled:opacity-40"
            >
              {updating ? "Updating…" : "Remove"}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
