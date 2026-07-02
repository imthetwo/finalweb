type NavItem = {
  readonly label: string;
  readonly href: string;
  readonly dbName?: string; // DB category name when it differs from label
};

// Single source of truth for navigation — used in FilterSidebar, ShopByCategory, URL routing
export const CATEGORY_NAV: readonly NavItem[] = [
  { label: "All Products",      href: "/shop" },
  { label: "Gaming PCs",        href: "/shop/pcs",                              dbName: "Prebuilt PCs" },
  { label: "Laptops",           href: "/shop/laptops/laptops" },
  { label: "Processors (CPU)",  href: "/shop/components/processors" },
  { label: "Graphics Cards",    href: "/shop/components/gpu",                   dbName: "Graphics Cards (GPU)" },
  { label: "Motherboards",      href: "/shop/components/motherboards" },
  { label: "Memory (RAM)",      href: "/shop/components/ram",                   dbName: "RAM" },
  { label: "Storage",           href: "/shop/components/storage",               dbName: "Storage (SSD/HDD)" },
  { label: "Power Supplies",    href: "/shop/components/power-supplies" },
  { label: "CPU Coolers",       href: "/shop/components/cpu-coolers" },
  { label: "Case Fans",         href: "/shop/components/case-fans" },
  { label: "PC Cases",          href: "/shop/components/pc-cases" },
  { label: "Keyboards",         href: "/shop/gaming-gear/mechanical-keyboards", dbName: "Mechanical Keyboards" },
  { label: "Gaming Mice",       href: "/shop/gaming-gear/gaming-mice" },
  { label: "Headsets",          href: "/shop/gaming-gear/gaming-headsets",      dbName: "Gaming Headsets" },
  { label: "Monitors",          href: "/shop/gaming-gear/gaming-monitors",      dbName: "Gaming Monitors" },
  { label: "Furniture",         href: "/shop/gaming-furniture",                 dbName: "Gaming Furniture" },
];
