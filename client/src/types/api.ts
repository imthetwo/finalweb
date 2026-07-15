// ─── Core ────────────────────────────────────────────────────────────────────

export type Category = { id: string; name: string; _count?: { products: number } };

export type Paginated<T> = { items: T[]; total: number; page: number; totalPages: number };

// ─── Products ─────────────────────────────────────────────────────────────────

export type ProductListItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  salePrice: number | null;
  displayPrice: number;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  stock: number;
  specs?: Record<string, unknown> | null;
  category?: { id: string; name: string };
};

// ProductDetail — đầy đủ hơn ProductListItem, dùng cho trang /product/[id]
export type ProductDetail = ProductListItem & ProductSpecs & {
  description: string | null;
};

export type ProductListResponse = {
  items: ProductListItem[];
  total: number;
  page: number;
  totalPages: number;
};

export type MenuLink = { label: string; href: string; productCount: number };
export type MenuSection = {
  key: string;
  href: string;
  categoryId?: string;
  name?: string;
  productCount: number;
  columns: Array<{ title: string; links: MenuLink[] }>;
};

// ─── Specs (Table Per Type) ───────────────────────────────────────────────────

export type CpuSpec = {
  socket: string; cores: number; threads: number;
  baseClockGhz: number; boostClockGhz: number; tdp: number;
  cacheL3?: string; generation?: string;
};
export type GpuSpec = {
  vramGb: number; tdp: number; lengthMm?: number;
  pcieGen?: number; boostClockMhz?: number; memType?: string;
};
export type RamSpec = {
  capacityGb: number; speedMhz: number; generation: string; latency?: string; kit?: string;
};
export type MotherboardSpec = {
  socket: string; chipset?: string; formFactor: string;
  ramGen: string; ramSlots: number; maxRamGb?: number;
};
export type PsuSpec = { wattage: number; efficiency?: string; modular?: string };
export type CaseSpec = {
  formFactor: string; maxGpuLengthMm?: number; radiatorSupport?: string; driveBays?: number;
};
export type CoolerSpec = {
  coolerType: string; tdpRating?: number; radiatorSizeMm?: number; socketSupport?: string;
};
export type MonitorSpec = {
  sizeIn: number; resolution: string; refreshRateHz: number;
  panelType?: string; responseMs?: number; hdr?: boolean;
};
export type StorageSpec = {
  capacityGb: number; storageType: string; interfaceType?: string;
  readMbps?: number; writeMbps?: number;
};
export type LaptopSpec = {
  cpu: string; gpu?: string; ramGb: number; storageGb: number;
  displaySizeIn: number; displayResolution?: string; os?: string;
};
export type PcBuildType = "GAMING_ESPORT" | "WORKSTATION" | "MINI_SFF";
export type PcBuildSpec = { buildType: PcBuildType };
export type FurnitureType = "CHAIR" | "DESK";
export type FurnitureSpec = { furnitureType: FurnitureType };

export type ProductSpecs = {
  cpuSpec?: CpuSpec;
  gpuSpec?: GpuSpec;
  ramSpec?: RamSpec;
  motherboardSpec?: MotherboardSpec;
  psuSpec?: PsuSpec;
  caseSpec?: CaseSpec;
  coolerSpec?: CoolerSpec;
  monitorSpec?: MonitorSpec;
  storageSpec?: StorageSpec;
  laptopSpec?: LaptopSpec;
  pcBuildSpec?: PcBuildSpec;
  furnitureSpec?: FurnitureSpec;
};

// ─── User ─────────────────────────────────────────────────────────────────────

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  isGoogleUser: boolean;
  _count: { orders: number; wishlists: number };
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderItem = {
  id: string;
  quantity: number;
  priceAtBuy: number;
  product: { id: string; name: string; imageUrl?: string | null };
};

export type Order = {
  id: string;
  subTotal: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;
  couponCode: string | null;
  status: string;
  paymentMethod: string;
  isPaid: boolean;
  createdAt: string;
  shippingInfo: Record<string, string>;
  items: OrderItem[];
};

// ─── Address book ─────────────────────────────────────────────────────────────

export type Address = {
  id: string;
  label: string | null;
  recipient: string;
  phone: string;
  street: string;
  ward: string;
  city: string;
  isDefault: boolean;
  createdAt: string;
};

export type AddressInput = {
  label?: string;
  recipient: string;
  phone: string;
  street: string;
  ward: string;
  city: string;
  isDefault?: boolean;
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export type WishlistEntry = { id: string; addedAt: string; product: ProductListItem };

// ─── Admin ────────────────────────────────────────────────────────────────────

export type AdminStats = {
  totalRevenue: number;
  orderCount: number;
  userCount: number;
  productCount: number;
  recentOrders: Array<{
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    user: { fullName: string; email: string } | null;
  }>;
};

export type AdminProduct = {
  id: string;
  name: string;
  brand: string;
  price: number;
  costPrice: number | null;
  salePrice: number | null;
  stock: number;
  isPublished: boolean;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  description?: string | null;
  category?: { id: string; name: string };
} & ProductSpecs;

export type ProductInput = {
  categoryId: string;
  name: string;
  brand: string;
  description?: string;
  imageUrl?: string;
  price: number;
  costPrice?: number;
  salePrice?: number;
  stock?: number;
  isPublished?: boolean;
} & { [K in keyof ProductSpecs]?: ProductSpecs[K] extends infer S ? Partial<NonNullable<S>> : never };

export type AdminOrder = {
  id: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  isPaid: boolean;
  createdAt: string;
  user: { fullName: string; email: string } | null;
  guestEmail: string | null;
  refundedAt: string | null;
  shippingInfo: { recipient: string; phone: string; street: string; ward: string; city: string };
  items: Array<{ id: string; quantity: number; product: { name: string } }>;
};

// ─── Promotions ───────────────────────────────────────────────────────────────

export type Promotion = {
  id: string;
  title: string;
  actionLabel: string | null;
  href: string | null;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type PromotionInput = {
  title: string;
  actionLabel?: string;
  href?: string;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
  sortOrder?: number;
};
