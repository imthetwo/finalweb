// GET /products + /categories — used by (shop)/shop/[...slug]/page.tsx
import { fetchCategories, fetchProducts, fetchProductBrands } from "@/lib/api";
import { CATEGORY_NAV } from "@/lib/category-nav";

// last URL segment → { display label, DB category name }
const URL_LOOKUP = Object.fromEntries(
  CATEGORY_NAV
    .filter((c) => c.href !== "/shop")
    .map((c) => [c.href.split("/").at(-1)!, { label: c.label, dbName: c.dbName ?? c.label }])
);

// ?type= query param (Prebuilt PCs sub-filter) → { display label, Prisma PcBuildType }
const BUILD_TYPE_LOOKUP: Record<string, { label: string; buildType: string }> = {
  "gaming-esport": { label: "PC Gaming Esport", buildType: "GAMING_ESPORT" },
  "workstation":   { label: "PC Workstation",   buildType: "WORKSTATION" },
  "mini-sff":      { label: "PC Mini (SFF)",    buildType: "MINI_SFF" },
};

// ?storageType= / ?coolerType= / ?furnitureType= → real spec fields, human label for the title
const STORAGE_TYPE_LABEL: Record<string, string> = { NVMe: "NVMe SSD", HDD: "HDD Storage" };
const COOLER_TYPE_LABEL: Record<string, string> = { AIO: "AIO Liquid Coolers", Air: "CPU Air Coolers" };
const FURNITURE_TYPE_LABEL: Record<string, string> = { CHAIR: "Gaming Chairs", DESK: "Gaming Desks" };

export async function getShopPage(
  slug: string[],
  searchParams: {
    page?: string; search?: string; type?: string;
    storageType?: string; coolerType?: string; furnitureType?: string;
    brand?: string; sortBy?: string;
  },
) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const search = searchParams.search?.trim() || undefined;
  const sortBy = searchParams.sortBy;
  const brand = searchParams.brand;
  // slug=[] → /shop root page; slug=['shop'] → legacy compat
  const isAllProducts = slug.length === 0 || (slug.length === 1 && slug[0] === "shop");

  const matchedSeg = [...slug].reverse().find((seg) => URL_LOOKUP[seg]);
  const entry = matchedSeg ? URL_LOOKUP[matchedSeg] : undefined;
  const buildEntry = searchParams.type ? BUILD_TYPE_LOOKUP[searchParams.type] : undefined;
  const { storageType, coolerType, furnitureType } = searchParams;

  let categoryId: string | undefined;
  const categoryName = isAllProducts ? "All Products" : (entry?.label ?? slug[slug.length - 1] ?? "Products");

  if (!isAllProducts) {
    try {
      const categories = await fetchCategories();
      const matched = categories.find((c) => c.name === entry?.dbName);
      if (matched) { categoryId = matched.id; }
    } catch { /* fallback */ }
  }

  const data = await fetchProducts(
    search
      ? { search, sortBy, page, limit: 48 }
      : { categoryId, buildType: buildEntry?.buildType, storageType, coolerType, furnitureType, brand, sortBy, page, limit: 48 },
  ).catch(() => ({ items: [], total: 0, page: 1, totalPages: 0 }));

  // Brand filter only makes sense on a single real category, not search
  // results or "All Products" (which spans every category).
  const availableBrands = (!isAllProducts && !search && categoryId)
    ? await fetchProductBrands(categoryId).catch(() => [])
    : [];

  const subFilterLabel =
    buildEntry?.label
    ?? (storageType && STORAGE_TYPE_LABEL[storageType])
    ?? (coolerType && COOLER_TYPE_LABEL[coolerType])
    ?? (furnitureType && FURNITURE_TYPE_LABEL[furnitureType]);

  return {
    title: search ? `Search: "${search}"` : (subFilterLabel ?? categoryName),
    items: data.items,
    page: data.page,
    totalPages: data.totalPages,
    availableBrands,
  };
}
