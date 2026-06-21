import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import AddToCartButton from "@/components/shop/AddToCartButton";
import WishlistButton from "@/features/product/WishlistButton";
import ReviewsSection from "@/features/product/ReviewsSection";
import { apiFetch } from "@/lib/api";
import { formatVnd } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

type ProductDetail = {
  id: string;
  name: string;
  brand: string;
  description: string | null;
  displayPrice: number;
  price: number;
  salePrice: number | null;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  stock: number;
  specs?: Record<string, unknown> | null;
  category?: { id: string; name: string };
};

export default async function ProductPage({ params }: Props) {
  const { slug: id } = await params;

  let product: ProductDetail;
  try {
    product = await apiFetch<ProductDetail>(`/products/${id}`);
  } catch {
    notFound();
  }

  const hasSale = product.salePrice !== null && product.salePrice < product.price;
  const specEntries = product.specs ? Object.entries(product.specs) : [];

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white md:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square border border-zinc-800 bg-[#0d0d0d]">
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
            <span className="absolute left-4 top-4 bg-[#00ffff] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-black">
              -{Math.round((1 - product.salePrice! / product.price) * 100)}%
            </span>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#00ffff]/70">{product.brand}</p>
          <h1 className="mt-2 text-3xl font-black">{product.name}</h1>
          {product.category && (
            <p className="mt-2 text-sm text-zinc-500">{product.category.name}</p>
          )}

          <div className="mt-6 flex items-end gap-3">
            {hasSale ? (
              <>
                <span className="text-3xl font-black text-[#00ffff]">{formatVnd(product.salePrice!)}</span>
                <span className="mb-1 text-lg text-zinc-600 line-through">{formatVnd(product.price)}</span>
              </>
            ) : (
              <span className="text-3xl font-black text-[#00ffff]">{formatVnd(product.price)}</span>
            )}
          </div>

          <p className={`mt-2 text-sm ${product.stock > 0 ? "text-emerald-400" : "text-red-400"}`}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>

          {product.description && (
            <p className="mt-6 text-sm leading-relaxed text-zinc-400">{product.description}</p>
          )}

          {specEntries.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-2 border-y border-zinc-800 py-4">
              {specEntries.map(([key, val]) => (
                <div key={key} className="flex justify-between gap-2 text-[13px]">
                  <span className="capitalize text-zinc-500">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span className="font-semibold text-white">{String(val)}</span>
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
