import Image from "next/image";
import { notFound } from "next/navigation";

import AddToCartButton from "@/components/shop/AddToCartButton";
import WishlistButton from "@/features/product/WishlistButton";
import ReviewsSection from "@/features/product/ReviewsSection";
import { apiFetch } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { ProductDetail as ProductDetailType } from "@/types/api";

export async function ProductDetail({ id }: { id: string }) {
  let product: ProductDetailType;
  try {
    product = await apiFetch<ProductDetailType>(`/products/${id}`);
  } catch {
    notFound();
  }

  const hasSale = product.salePrice !== null && product.salePrice < product.price;
  const specEntries = product.specs ? Object.entries(product.specs) : [];

  return (
    <main className="min-h-screen bg-base px-4 py-10 text-fg md:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">

        {/* Image */}
        <div className="relative aspect-square border border-edge bg-surface">
          {(product.thumbnailUrl ?? product.imageUrl) && (
            <Image
              src={(product.thumbnailUrl ?? product.imageUrl)!}
              alt={product.name}
              fill
              className="object-contain p-8"
              unoptimized
            />
          )}
          {hasSale && (
            <span className="absolute left-4 top-4 bg-brand px-2.5 py-1 text-xs font-black uppercase tracking-wider text-black">
              -{Math.round((1 - product.salePrice! / product.price) * 100)}%
            </span>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand/70">{product.brand}</p>
          <h1 className="mt-2 text-3xl font-black">{product.name}</h1>
          {product.category && (
            <p className="mt-2 text-sm text-muted">{product.category.name}</p>
          )}

          <div className="mt-6 flex items-end gap-3">
            {hasSale ? (
              <>
                <span className="text-3xl font-black text-brand">{formatVnd(product.salePrice!)}</span>
                <span className="mb-1 text-lg text-subtle line-through">{formatVnd(product.price)}</span>
              </>
            ) : (
              <span className="text-3xl font-black text-brand">{formatVnd(product.price)}</span>
            )}
          </div>

          <p className={`mt-2 text-sm ${product.stock > 0 ? "text-success" : "text-destructive"}`}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>

          {product.description && (
            <p className="mt-6 text-sm leading-relaxed text-secondary">{product.description}</p>
          )}

          {specEntries.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-2 border-y border-edge py-4">
              {specEntries.map(([key, val]) => (
                <div key={key} className="flex justify-between gap-2 text-body">
                  <span className="capitalize text-muted">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span className="font-semibold text-fg">{String(val)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex items-stretch gap-3">
            <div className="flex-1">
              <AddToCartButton productId={product.id} />
            </div>
            <WishlistButton productId={product.id} />
          </div>
        </div>
      </div>

      <ReviewsSection productId={product.id} />
    </main>
  );
}
