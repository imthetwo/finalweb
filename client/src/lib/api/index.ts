// Barrel export — re-exports everything so old files importing from "@/lib/api" still work
export * from "./client";
export * from "./products";
export * from "./user";
export * from "./orders";
export * from "./admin-products.api";
export * from "./admin-orders.api";
export * from "./admin-users.api";
export * from "./cart";
export * from "./addresses";

// Re-export types from @/types/api
export type {
  Category, Paginated, ProductListItem, ProductListResponse,
  CpuSpec, GpuSpec, RamSpec, MotherboardSpec, PsuSpec,
  CaseSpec, CoolerSpec, MonitorSpec, StorageSpec, LaptopSpec,
  ProductSpecs, AdminProduct, ProductInput,
  UserProfile, Order, OrderItem, WishlistEntry,
  AdminStats, AdminOrder,
  Address, AddressInput,
} from "@/types/api";
