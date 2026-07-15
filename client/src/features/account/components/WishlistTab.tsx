"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";

import { formatVnd } from "@/lib/format";
import { useWishlistTab } from "../hooks/useWishlistTab";

export default function WishlistTab() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { items, loading, removingId, remove } = useWishlistTab();

  if (loading) return <p className="py-12 text-center text-sm text-muted">Loading…</p>;

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-3 border border-dashed border-edge py-16 text-muted">
        <Heart size={32} className="opacity-30" />
        <p className="text-sm">Your wishlist is empty.</p>
        <Link href="/shop/components/processors" className="text-sm text-brand underline">Explore products →</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(({ product }) => (
        <div key={product.id} className="group relative flex flex-col border border-edge bg-elevated">
          <Link href={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-surface">
            {product.thumbnailUrl ? (
              <Image src={product.thumbnailUrl} alt={product.name} fill className="object-contain p-4" sizes="300px" />
            ) : (
              <div className="flex h-full items-center justify-center text-2xs text-subtle">No image</div>
            )}
          </Link>
          <div className="flex flex-1 flex-col gap-2 p-4">
            <p className="text-2xs font-bold uppercase tracking-wider text-brand/60">{product.brand}</p>
            <Link href={`/product/${product.id}`} className="line-clamp-2 text-body font-semibold text-fg hover:text-brand">
              {product.name}
            </Link>
            <div className="mt-auto flex items-center justify-between pt-2">
              <span className="text-sm font-black text-fg">{formatVnd(product.displayPrice)}</span>
              <button
                type="button"
                onClick={() => remove(product.id)}
                disabled={removingId === product.id}
                className="flex h-8 w-8 items-center justify-center border border-red-800/40 bg-red-950/20 text-destructive transition hover:border-destructive disabled:opacity-40"
                aria-label="Remove"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
