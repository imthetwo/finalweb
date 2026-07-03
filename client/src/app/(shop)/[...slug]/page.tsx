import { redirect } from "next/navigation";
import { ProductDetail } from "@/features/product/components/ProductDetail";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function LegacyCatchAll({ params }: Props) {
  const { slug } = await params;

  // /product/{id} — render product detail directly (routing conflict workaround)
  if (slug.length >= 2 && slug[0] === "product") {
    return <ProductDetail id={slug[1]} />;
  }

  // All other legacy paths → redirect to /shop/ prefix
  const remaining = slug[0] === "shop" ? slug.slice(1) : slug;
  redirect(`/shop/${remaining.join("/")}`);
}
