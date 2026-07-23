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

// ProductDetail — more complete than ProductListItem, used for the /product/[id] page
export type ProductDetail = ProductListItem & ProductSpecs & {
  description: string | null;
};

export type ProductListResponse = {
  items: ProductListItem[];
  total: number;
  page: number;
  totalPages: number;
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
  role: "USER" | "STAFF" | "ADMIN";
  createdAt: string;
  isGoogleUser: boolean;
  isEmailVerified: boolean;
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
  shippingFee: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  isPaid: boolean;
  createdAt: string;
  shippingInfo: Record<string, string>;
  items: OrderItem[];
};

// ─── Payments & QR ────────────────────────────────────────────────────────────

export type InitiatePaymentResponse = {
  orderId: string;
  amount: number;
  payUrl: string | null;
  qrCodeUrl: string | null;
  source: "momo" | "simulated";
};

export type PaymentStatus = {
  orderId: string;
  isPaid: boolean;
  status: string;
  totalAmount: number;
};

export type OrderQr = { dataUrl: string };

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

// The 5 fields that make up a Vietnamese shipping address — shared by checkout
// and the account Address Book so both use identical inputs/validation feel.
export type AddressFieldsValue = {
  recipient: string;
  phone: string;
  street: string;
  ward: string;
  city: string;
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

export type UserRole = "USER" | "STAFF" | "ADMIN";

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  _count: { orders: number };
};

// ─── AI Consultant ──────────────────────────────────────────────────────────────

export type ChatTurn = { role: "user" | "model"; text: string };
export type ChatResponse = { reply: string; source: "gemini" | "fallback" };

// ─── Newsletter ───────────────────────────────────────────────────────────────

export type SubscribeResponse = {
  ok: boolean;
  message?: string;
  alreadySubscribed?: boolean;
};

export type ConfirmSubscriptionResponse = {
  ok: boolean;
  alreadyConfirmed?: boolean;
};
