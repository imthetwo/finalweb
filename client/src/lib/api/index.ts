// Barrel export — re-export tất cả để các file cũ dùng "@/lib/api" vẫn hoạt động
export * from "./client";
export * from "./products";
export * from "./user";
export * from "./orders";
export * from "./admin";
export * from "./settings";

// Re-export types từ @/types/api
export type {
  Category, Paginated, ProductListItem, ProductListResponse,
  MenuLink, MenuSection,
  CpuSpec, GpuSpec, RamSpec, MotherboardSpec, PsuSpec,
  CaseSpec, CoolerSpec, MonitorSpec, StorageSpec, LaptopSpec,
  ProductSpecs, AdminProduct, ProductInput,
  UserProfile, Order, OrderItem, WishlistEntry,
  Review, ReviewSummary, AdminStats, AdminOrder,
  Promotion, PromotionInput,
} from "@/types/api";
