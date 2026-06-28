import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { formatVnd } from "@/lib/format";
import { serverApiUrl } from "@/lib/api";

type ProductItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  salePrice: number | null;
  displayPrice: number;
  thumbnailUrl: string | null;
  stock: number;
  category?: { id: string; name: string };
};

type ProductListResponse = {
  items: ProductItem[];
  total: number;
};

async function getProducts(limit = 8): Promise<ProductItem[]> {
  try {
    const res = await fetch(`${serverApiUrl}/products?limit=${limit}&page=1`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const data: ProductListResponse = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

function ProductCard({ product }: { product: ProductItem }) {
  const hasSale =
    product.salePrice !== null && product.salePrice < product.price;
  const discountPct = hasSale
    ? Math.round((1 - product.salePrice! / product.price) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden border border-white/5 bg-elevated transition-all duration-300 hover:border-brand/20 hover:shadow-glow-sm">
      {/* Card link overlay */}
      <Link href={`/product/${product.id}`} className="absolute inset-0 z-10" aria-label={product.name} />

      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden bg-surface">
        {product.thumbnailUrl ? (
          <Image
            src={product.thumbnailUrl}
            alt={product.name}
            fill
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-2xs uppercase tracking-widest text-subtle">No Image</span>
          </div>
        )}

        {hasSale && (
          <span className="absolute left-3 top-3 z-20 bg-brand px-2 py-0.5 text-2xs font-black uppercase tracking-wider text-black">
            -{discountPct}%
          </span>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-base/60">
            <span className="text-xs font-black uppercase tracking-widest text-muted">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-2xs font-bold uppercase tracking-[0.2em] text-brand/60">
          {product.brand}
        </p>
        <h3 className="line-clamp-2 text-body font-semibold leading-snug text-fg transition-colors duration-200 group-hover:text-brand">
          {product.name}
        </h3>

        <div className="mt-auto flex items-end justify-between pt-3">
          {/* Price */}
          <div className="flex flex-col">
            {hasSale ? (
              <>
                <span className="text-2xs text-subtle line-through">
                  {formatVnd(product.price)}
                </span>
                <span className="text-base font-black text-brand">
                  {formatVnd(product.salePrice!)}
                </span>
              </>
            ) : (
              <span className="text-base font-black text-fg">
                {formatVnd(product.price)}
              </span>
            )}
          </div>

          {/* Cart button — z-20 to be above link overlay */}
          <button
            type="button"
            data-product-id={product.id}
            className="relative z-20 flex items-center justify-center border border-white/10 bg-white/4 p-2.5 text-muted transition-all duration-200 hover:border-brand/40 hover:bg-brand/10 hover:text-brand"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default async function FeaturedProducts() {
  const products = await getProducts(8);

  if (products.length === 0) return null;

  return (
    <section className="bg-base py-20">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        {/* Header */}
        <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-brand">
              Just Arrived
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase leading-tight tracking-tight text-fg md:text-5xl">
              Featured Products
            </h2>
          </div>
          <Link
            href="/components/processors"
            className="group flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:text-brand"
          >
            View All
            <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
