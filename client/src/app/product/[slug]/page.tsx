// Server Component — thin page
import { ProductDetail } from "@/features/product/components/ProductDetail";

type Props = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: Props) {
  const { slug: id } = await params;
  return <ProductDetail id={id} />;
}
