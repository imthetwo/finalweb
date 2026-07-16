// Barrel export — re-exports everything so old files importing from "@/lib/api" still work
export * from "./client";
export * from "./products";
export * from "./user";
export * from "./orders";
export * from "./admin";
export * from "./settings";
export * from "./cart";
export * from "./addresses";

// Re-export types from @/types/api
export type {
  Category, Paginated, ProductListItem, ProductListResponse,
  MenuLink, MenuSection,
  CpuSpec, GpuSpec, RamSpec, MotherboardSpec, PsuSpec,
  CaseSpec, CoolerSpec, MonitorSpec, StorageSpec, LaptopSpec,
  ProductSpecs, AdminProduct, ProductInput,
  UserProfile, Order, OrderItem, WishlistEntry,
  AdminStats, AdminOrder,
  Promotion, PromotionInput,
  Address, AddressInput,
} from "@/types/api";
