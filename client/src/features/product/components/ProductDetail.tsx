import AddToCartButton from "@/components/shop/AddToCartButton";
import { WishlistButton } from "@/features/product/WishlistButton";
import { SpecsTable } from "@/features/product/components/SpecsTable";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatVnd } from "@/lib/format";
import { getProductDetail } from "../data/getProductDetail";

export async function ProductDetail({ id }: { id: string }) {
  const product = await getProductDetail(id);

  const hasSale = product.salePrice !== null && product.salePrice < product.price;

  return (
    <main className="min-h-screen bg-base px-4 py-10 text-fg md:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">

        {/* Image */}
        <div className="relative aspect-square border border-edge bg-surface">
          {(product.thumbnailUrl ?? product.imageUrl) && (
            <ProductImage
              src={(product.thumbnailUrl ?? product.imageUrl)!}
              alt={product.name}
              className="object-contain p-8"
              unoptimized
            />
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
            {product.stock > 0 ? "In stock" : "Out of stock"}
          </p>

          {product.description && (
            <p className="mt-4 text-body leading-relaxed text-secondary">{product.description}</p>
          )}

          <div className="mt-8 flex items-stretch gap-3">
            <div className="flex-1">
              <AddToCartButton productId={product.id} disabled={product.stock <= 0} />
            </div>
            <WishlistButton productId={product.id} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-0">
        <SpecsTable
          cpuSpec={product.cpuSpec}
          gpuSpec={product.gpuSpec}
          ramSpec={product.ramSpec}
          motherboardSpec={product.motherboardSpec}
          psuSpec={product.psuSpec}
          caseSpec={product.caseSpec}
          coolerSpec={product.coolerSpec}
          monitorSpec={product.monitorSpec}
          storageSpec={product.storageSpec}
          laptopSpec={product.laptopSpec}
          pcBuildSpec={product.pcBuildSpec}
          furnitureSpec={product.furnitureSpec}
        />
      </div>

    </main>
  );
}
