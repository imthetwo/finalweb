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
  _count: { orders: number; wishlists: number };
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderItem = {
  id: string;
  quantity: number;
  priceAtBuy: number;
  product: { name: string };
};

export type Order = {
  id: string;
  subTotal: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  isPaid: boolean;
  createdAt: string;
  items: OrderItem[];
};

// ─── Wishlist & Reviews ───────────────────────────────────────────────────────

export type WishlistEntry = { id: string; addedAt: string; product: ProductListItem };

export type Review = {
  id: string;
  rating: number;
  title: string | null;
  text: string | null;
  isVerifiedBuy: boolean;
  createdAt: string;
  user: { fullName: string; avatarUrl: string | null };
};
export type ReviewSummary = { reviews: Review[]; average: number; count: number };

// ─── Admin ────────────────────────────────────────────────────────────────────

export type AdminStats = {
  totalRevenue: number;
  orderCount: number;
  userCount: number;
  productCount: number;
  lowStockCount: number;
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
