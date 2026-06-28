import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import type { ProductListItem } from "@/types/api";
import { formatVnd } from "@/lib/format";
import AddToCartButton from "@/components/shop/AddToCartButton";

export function ProductCard({ p }: { p: ProductListItem }) {
  const hasSale = p.salePrice !== null && p.salePrice < p.price;
  const save = hasSale ? p.price - p.salePrice! : 0;

  return (
    <div className="group flex flex-col bg-elevated">
      <Link href={`/product/${p.id}`} className="relative aspect-square overflow-hidden bg-elevated">
        {hasSale && (
          <span className="absolute left-3 top-3 z-10 bg-brand px-2 py-0.5 text-2xs font-black uppercase tracking-wider text-brand-fg">
            Sale
          </span>
        )}
        {p.thumbnailUrl ? (
          <Image
            src={p.thumbnailUrl}
            alt={p.name}
            fill
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width:768px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-subtle">No image</div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-2xs font-bold uppercase tracking-wider text-brand/60">{p.brand}</p>
        <Link
          href={`/product/${p.id}`}
          className="mt-1 line-clamp-2 text-body font-semibold leading-snug text-fg hover:text-brand"
        >
          {p.name}
        </Link>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
          <span className="text-base font-black text-fg">
            {formatVnd(hasSale ? p.salePrice! : p.price)}
          </span>
          {hasSale && (
            <>
              <span className="text-sm text-subtle line-through">{formatVnd(p.price)}</span>
              <span className="text-xs font-bold text-brand">SAVE {formatVnd(save)}</span>
            </>
          )}
        </div>

        <p className={`mt-1 text-xs ${p.stock > 0 ? "text-muted" : "text-destructive"}`}>
          {p.stock > 0 ? "In stock" : "Out of stock"}
        </p>

        <div className="mt-3">
          <AddToCartButton
            productId={p.id}
            className="flex w-full items-center justify-center gap-2 border border-brand/40 bg-transparent py-2 text-xs font-black uppercase tracking-wider text-brand transition hover:bg-brand hover:text-brand-fg"
            label={<><ShoppingCart size={13} /> Add to Cart</>}
          />
        </div>
      </div>
    </div>
  );
}
