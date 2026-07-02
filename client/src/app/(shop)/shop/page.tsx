// Server Component — thin page for /shop (all products)
import ShopBrowser from "@/features/shop/ShopBrowser";
import { getShopPage } from "@/features/shop/data/getShopPage";

type Props = {
  searchParams: Promise<{ page?: string; search?: string }>;
};

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { title, items, page, totalPages } = await getShopPage([], sp);
  return <ShopBrowser title={title} items={items} page={page} totalPages={totalPages} />;
}
