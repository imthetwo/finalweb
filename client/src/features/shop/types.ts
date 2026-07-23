export type SortKey = "featured" | "price-asc" | "price-desc" | "name";

// Sub-type filters — a small in-page selector shown only while browsing the
// matching category, mirroring the corresponding header mega-menu links and
// getShopPage's query-param handling. Each one uses a real DB field
// (PcBuildSpec.buildType / StorageSpec.storageType / CoolerSpec.coolerType /
// FurnitureSpec.furnitureType), never a fake/decorative split.
export type SubTypeOption = { label: string; value?: string };
export type SubTypeFilter = {
  matchPath: string;
  basePath: string;
  title: string;
  param: string;
  options: SubTypeOption[];
};
