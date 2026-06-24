// Server Component — thin page
import ShopBrowser from "@/features/shop/ShopBrowser";
import { getShopPage } from "@/features/shop/data/getShopPage";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ page?: string; search?: string }>;
};

export default async function ShopCategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam, search: searchParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const search = searchParam?.trim() || undefined;

  const { title, items, page: p, totalPages } = await getShopPage(slug, page, search);

  return <ShopBrowser title={title} items={items} page={p} totalPages={totalPages} />;
}
