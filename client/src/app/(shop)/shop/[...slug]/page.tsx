import ShopBrowser from "@/features/shop/ShopBrowser";
import { getShopPage } from "@/features/shop/data/getShopPage";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ page?: string; search?: string }>;
};

export default async function ShopCategoryPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const { title, items, page, totalPages } = await getShopPage(slug, sp);
  return (
    <ShopBrowser
      title={title}
      items={items}
      page={page}
      totalPages={totalPages}
    />
  );
}
